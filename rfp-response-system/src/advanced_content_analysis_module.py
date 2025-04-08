import json
import yaml
import logging
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Tuple, Union, Any
from dataclasses import dataclass, field
import os
import re
import langid
import pandas as pd
from langdetect import detect, DetectorFactory
from langdetect.lang_detect_exception import LangDetectException
import pytesseract
from transformers import pipeline
from bs4 import BeautifulSoup
import numpy as np

# Set seeds for reproducibility
DetectorFactory.seed = 0

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("advanced_content_analysis")

@dataclass
class TableData:
    """Data structure for extracted tables"""
    rows: List[List[str]]
    headers: Optional[List[str]] = None
    caption: Optional[str] = None
    context: Optional[str] = None
    page_number: Optional[int] = None
    table_number: Optional[int] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_json(self) -> str:
        """Convert table to JSON string"""
        return json.dumps(self.__dict__, ensure_ascii=False, indent=2)
    
    def to_csv(self) -> str:
        """Convert table to CSV string"""
        df = pd.DataFrame(self.rows, columns=self.headers if self.headers else None)
        return df.to_csv(index=False)
    
    def to_dataframe(self) -> pd.DataFrame:
        """Convert table to pandas DataFrame"""
        return pd.DataFrame(self.rows, columns=self.headers if self.headers else None)


@dataclass
class LanguageInfo:
    """Data structure for language detection results"""
    primary_language: str
    confidence: float
    language_codes: Dict[str, float] = field(default_factory=dict)
    section_languages: Dict[str, str] = field(default_factory=dict)
    encoding_issues: List[str] = field(default_factory=list)
    
    def to_json(self) -> str:
        """Convert language info to JSON string"""
        return json.dumps(self.__dict__, ensure_ascii=False, indent=2)


@dataclass
class DocumentSection:
    """Data structure for document sections in hierarchical structure"""
    title: str
    content: str
    level: int
    section_number: Optional[str] = None
    parent: Optional['DocumentSection'] = None
    children: List['DocumentSection'] = field(default_factory=list)
    start_index: Optional[int] = None
    end_index: Optional[int] = None
    page_number: Optional[int] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict:
        """Convert section to dictionary (for JSON serialization)"""
        result = {
            "title": self.title,
            "content": self.content,
            "level": self.level,
            "section_number": self.section_number,
            "start_index": self.start_index,
            "end_index": self.end_index,
            "page_number": self.page_number,
            "metadata": self.metadata,
            "children": [child.to_dict() for child in self.children]
        }
        # Remove the parent to avoid circular references
        return result
    
    def to_json(self) -> str:
        """Convert section to JSON string"""
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=2)


@dataclass
class DocumentStructure:
    """Overall document structure with hierarchical sections"""
    title: Optional[str] = None
    sections: List[DocumentSection] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict:
        """Convert document structure to dictionary"""
        return {
            "title": self.title,
            "metadata": self.metadata,
            "sections": [section.to_dict() for section in self.sections]
        }
    
    def to_json(self) -> str:
        """Convert document structure to JSON string"""
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=2)
    
    def generate_table_of_contents(self) -> List[Dict]:
        """Generate a table of contents from the document structure"""
        toc = []
        
        def _add_section_to_toc(section, path=[]):
            item = {
                "title": section.title,
                "section_number": section.section_number,
                "level": section.level,
                "path": path + [section.title]
            }
            toc.append(item)
            for i, child in enumerate(section.children):
                _add_section_to_toc(child, path + [section.title])
                
        for section in self.sections:
            _add_section_to_toc(section)
            
        return toc


class ContentAnalyzer(ABC):
    """Abstract base class for content analyzers"""
    
    @abstractmethod
    def analyze(self, document_content, document_metadata=None):
        pass


class AIModelIntegration(ABC):
    """Abstract base class for AI model integrations"""
    
    @abstractmethod
    def initialize(self):
        pass
    
    @abstractmethod
    def process(self, text, **kwargs):
        pass


class TogetherAIIntegration(AIModelIntegration):
    """Integration with Together.ai API"""
    
    def __init__(self, api_key, model_name="togethercomputer/llama-2-70b-chat"):
        self.api_key = api_key
        self.model_name = model_name
        self.client = None
        
    def initialize(self):
        """Initialize Together.ai client"""
        try:
            import together
            together.api_key = self.api_key
            self.client = together
            logger.info(f"Together.ai client initialized with model: {self.model_name}")
        except ImportError:
            logger.error("Failed to import Together.ai SDK. Install with 'pip install together'")
            raise
    
    def process(self, text, **kwargs):
        """Process text with Together.ai model"""
        if not self.client:
            self.initialize()
            
        prompt_template = kwargs.get("prompt_template", "{input_text}")
        prompt = prompt_template.format(input_text=text)
        
        try:
            response = self.client.Complete.create(
                prompt=prompt,
                model=self.model_name,
                max_tokens=kwargs.get("max_tokens", 1024),
                temperature=kwargs.get("temperature", 0.7),
                top_p=kwargs.get("top_p", 0.9),
                top_k=kwargs.get("top_k", 40)
            )
            return response['output']['choices'][0]['text']
        except Exception as e:
            logger.error(f"Error processing with Together.ai: {str(e)}")
            return None


class LocalModelIntegration(AIModelIntegration):
    """Integration with local Hugging Face models"""
    
    def __init__(self, model_name, task="text-generation", device="cpu"):
        self.model_name = model_name
        self.task = task
        self.device = device
        self.pipeline = None
        
    def initialize(self):
        """Initialize local model pipeline"""
        try:
            self.pipeline = pipeline(
                task=self.task,
                model=self.model_name,
                device=self.device
            )
            logger.info(f"Local model pipeline initialized: {self.model_name} for {self.task}")
        except Exception as e:
            logger.error(f"Failed to initialize local model: {str(e)}")
            raise
    
    def process(self, text, **kwargs):
        """Process text with local model"""
        if not self.pipeline:
            self.initialize()
            
        try:
            result = self.pipeline(text, **kwargs)
            
            # Handle different result formats based on task
            if self.task == "text-generation":
                return result[0]["generated_text"]
            elif self.task == "token-classification":
                return result
            else:
                return result
        except Exception as e:
            logger.error(f"Error processing with local model: {str(e)}")
            return None


class TableExtractor(ContentAnalyzer):
    """Extracts tables from documents and converts to structured formats"""
    
    def __init__(self, config):
        self.config = config
        self.ai_model = None
        
        if config.get("use_ai_model", False):
            ai_provider = config.get("ai_provider", "local")
            if ai_provider == "together":
                self.ai_model = TogetherAIIntegration(
                    api_key=config.get("together_api_key"),
                    model_name=config.get("together_model", "togethercomputer/llama-2-70b-chat")
                )
            elif ai_provider == "local":
                self.ai_model = LocalModelIntegration(
                    model_name=config.get("local_model", "microsoft/table-transformer-detection"),
                    task="object-detection",
                    device=config.get("device", "cpu")
                )
                
        self.fallback_enabled = config.get("enable_fallback", True)
        self.table_patterns = [
            r'<table.*?>.*?</table>',  # HTML tables
            r'\|\s*-+\s*\|.*?\|',      # Markdown tables
            r'^\s*\|.*\|.*$'           # Simple pipe tables
        ]
    
    def analyze(self, document_content, document_metadata=None):
        """Extract tables from document content"""
        document_format = document_metadata.get("format", "text") if document_metadata else "text"
        tables = []
        
        try:
            if document_format == "pdf":
                tables = self._extract_from_pdf(document_content, document_metadata)
            elif document_format == "docx":
                tables = self._extract_from_docx(document_content, document_metadata)
            elif document_format == "html":
                tables = self._extract_from_html(document_content, document_metadata)
            elif document_format == "pptx":
                tables = self._extract_from_pptx(document_content, document_metadata)
            else:
                tables = self._extract_from_text(document_content, document_metadata)
                
            # Process tables with AI if configured
            if self.ai_model and tables:
                tables = self._enhance_tables_with_ai(tables, document_content)
                
            logger.info(f"Extracted {len(tables)} tables from {document_format} document")
            return tables
        except Exception as e:
            logger.error(f"Error extracting tables: {str(e)}")
            if self.fallback_enabled:
                logger.info("Using fallback table extraction method")
                return self._fallback_extraction(document_content, document_metadata)
            return []
    
    def _extract_from_pdf(self, document_content, document_metadata):
        """Extract tables from PDF documents"""
        # Implementation would use libraries like tabula-py, camelot, or pdfplumber
        # For this example, we'll use a placeholder
        tables = []
        
        # Mock implementation - in real code, use proper PDF table extraction libraries
        # import tabula
        # tables_df = tabula.read_pdf(document_content, pages='all')
        # for i, df in enumerate(tables_df):
        #     tables.append(TableData(
        #         rows=df.values.tolist(),
        #         headers=df.columns.tolist(),
        #         table_number=i+1
        #     ))
        
        return tables
    
    def _extract_from_docx(self, document_content, document_metadata):
        """Extract tables from DOCX documents"""
        # Implementation would use libraries like python-docx
        tables = []
        
        # Mock implementation - in real code, use proper DOCX table extraction
        # from docx import Document
        # doc = Document(BytesIO(document_content))
        # for i, table in enumerate(doc.tables):
        #     rows = []
        #     for row in table.rows:
        #         row_data = [cell.text for cell in row.cells]
        #         rows.append(row_data)
        #     tables.append(TableData(
        #         rows=rows[1:] if rows else [],
        #         headers=rows[0] if rows else None,
        #         table_number=i+1
        #     ))
        
        return tables
    
    def _extract_from_html(self, document_content, document_metadata):
        """Extract tables from HTML documents"""
        tables = []
        
        try:
            soup = BeautifulSoup(document_content, 'html.parser')
            html_tables = soup.find_all('table')
            
            for i, table in enumerate(html_tables):
                headers = []
                header_row = table.find('thead')
                if header_row:
                    headers = [th.get_text(strip=True) for th in header_row.find_all('th')]
                
                rows = []
                for tr in table.find_all('tr'):
                    row = [td.get_text(strip=True) for td in tr.find_all(['td', 'th'])]
                    if row:  # Skip empty rows
                        rows.append(row)
                
                # Get caption if available
                caption_tag = table.find('caption')
                caption = caption_tag.get_text(strip=True) if caption_tag else None
                
                # Get context (text before the table)
                context = None
                prev_element = table.find_previous(string=True)
                if prev_element:
                    context = prev_element.strip()
                
                tables.append(TableData(
                    rows=rows[1:] if headers and rows else rows,
                    headers=headers if headers else (rows[0] if rows else None),
                    caption=caption,
                    context=context,
                    table_number=i+1
                ))
            
        except Exception as e:
            logger.error(f"Error parsing HTML tables: {str(e)}")
        
        return tables
    
    def _extract_from_pptx(self, document_content, document_metadata):
        """Extract tables from PPTX documents"""
        # Implementation would use libraries like python-pptx
        tables = []
        
        # Mock implementation - in real code, use proper PPTX table extraction
        # from pptx import Presentation
        # prs = Presentation(BytesIO(document_content))
        # table_count = 0
        # for slide in prs.slides:
        #     for shape in slide.shapes:
        #         if shape.has_table:
        #             table_count += 1
        #             rows = []
        #             for row in shape.table.rows:
        #                 row_data = [cell.text for cell in row.cells]
        #                 rows.append(row_data)
        #             tables.append(TableData(
        #                 rows=rows[1:] if rows else [],
        #                 headers=rows[0] if rows else None,
        #                 table_number=table_count,
        #                 page_number=slide.slide_id
        #             ))
        
        return tables
    
    def _extract_from_text(self, document_content, document_metadata):
        """Extract tables from plain text using regex patterns"""
        tables = []
        
        # Look for table patterns in text
        for pattern in self.table_patterns:
            matches = re.finditer(pattern, document_content, re.MULTILINE | re.DOTALL)
            for i, match in enumerate(matches):
                table_text = match.group(0)
                # Parse the table based on its format
                if '<table' in pattern:  # HTML table
                    soup = BeautifulSoup(table_text, 'html.parser')
                    rows = []
                    for tr in soup.find_all('tr'):
                        row = [td.get_text(strip=True) for td in tr.find_all(['td', 'th'])]
                        rows.append(row)
                    headers = rows[0] if rows else None
                    
                    tables.append(TableData(
                        rows=rows[1:] if rows else [],
                        headers=headers,
                        table_number=i+1
                    ))
                else:  # Markdown or pipe table
                    lines = table_text.strip().split('\n')
                    # Skip separator lines
                    rows = [line.strip('|').split('|') for line in lines if not re.match(r'^\s*\|[\s-:]+\|\s*$', line)]
                    headers = [h.strip() for h in rows[0]] if rows else None
                    
                    tables.append(TableData(
                        rows=[[cell.strip() for cell in row] for row in rows[1:]] if rows else [],
                        headers=headers,
                        table_number=i+1
                    ))
        
        return tables
    
    def _enhance_tables_with_ai(self, tables, document_content):
        """Use AI to enhance table extraction and understanding"""
        enhanced_tables = []
        
        for table in tables:
            try:
                if self.ai_model:
                    # For table structure improvement
                    table_str = "\n".join(["|".join(row) for row in table.rows])
                    prompt = f"Analyze this table and improve its structure:\n{table_str}"
                    
                    result = self.ai_model.process(
                        prompt,
                        max_tokens=1024,
                        temperature=0.2
                    )
                    
                    if result:
                        # Process the AI result to enhance the table
                        # This is simplified and would need custom parsing based on model output
                        enhanced_table = TableData(
                            rows=table.rows,
                            headers=table.headers,
                            caption=table.caption,
                            context=table.context,
                            page_number=table.page_number,
                            table_number=table.table_number,
                            metadata=table.metadata
                        )
                        
                        # Add AI-derived insights to metadata
                        enhanced_table.metadata["ai_enhanced"] = True
                        enhanced_table.metadata["ai_insights"] = result
                        
                        enhanced_tables.append(enhanced_table)
                    else:
                        enhanced_tables.append(table)
                else:
                    enhanced_tables.append(table)
            except Exception as e:
                logger.error(f"Error enhancing table with AI: {str(e)}")
                enhanced_tables.append(table)
        
        return enhanced_tables
    
    def _fallback_extraction(self, document_content, document_metadata):
        """Fallback method for table extraction when primary methods fail"""
        tables = []
        
        try:
            # Simple regex pattern matching for table-like structures
            lines = document_content.split('\n')
            table_lines = []
            in_table = False
            
            for line in lines:
                # Detect table start based on multiple pipe or tab characters
                if not in_table and (line.count('|') > 2 or line.count('\t') > 2):
                    in_table = True
                    table_lines = [line]
                elif in_table:
                    if line.strip() and (line.count('|') > 0 or line.count('\t') > 0):
                        table_lines.append(line)
                    else:
                        # End of table detected
                        if len(table_lines) > 1:
                            # Parse the collected table lines
                            delimiter = '|' if table_lines[0].count('|') > table_lines[0].count('\t') else '\t'
                            rows = [line.strip().split(delimiter) for line in table_lines]
                            
                            tables.append(TableData(
                                rows=rows[1:] if rows else [],
                                headers=[h.strip() for h in rows[0]] if rows else None,
                                table_number=len(tables) + 1
                            ))
                        
                        in_table = False
                        table_lines = []
            
            # Check if the document ended while still in a table
            if in_table and len(table_lines) > 1:
                delimiter = '|' if table_lines[0].count('|') > table_lines[0].count('\t') else '\t'
                rows = [line.strip().split(delimiter) for line in table_lines]
                
                tables.append(TableData(
                    rows=rows[1:] if rows else [],
                    headers=[h.strip() for h in rows[0]] if rows else None,
                    table_number=len(tables) + 1
                ))
                
        except Exception as e:
            logger.error(f"Error in fallback table extraction: {str(e)}")
        
        return tables


class LanguageDetector(ContentAnalyzer):
    """Detects languages in documents and sections"""
    
    def __init__(self, config):
        self.config = config
        self.ai_model = None
        self.min_confidence = config.get("min_confidence", 0.7)
        self.section_detection = config.get("section_detection", True)
        self.min_section_length = config.get("min_section_length", 100)
        self.supported_languages = config.get("supported_languages", None)
        self.encoding_detection = config.get("encoding_detection", True)
        
        if config.get("use_ai_model", False):
            ai_provider = config.get("ai_provider", "local")
            if ai_provider == "together":
                self.ai_model = TogetherAIIntegration(
                    api_key=config.get("together_api_key"),
                    model_name=config.get("together_model", "togethercomputer/llama-2-70b-chat")
                )
            elif ai_provider == "local":
                self.ai_model = LocalModelIntegration(
                    model_name=config.get("local_model", "xlm-roberta-base"),
                    task="text-classification",
                    device=config.get("device", "cpu")
                )
    
    def analyze(self, document_content, document_metadata=None):
        """Detect languages in the document"""
        encoding_issues = []
        
        try:
            # Check for encoding issues
            if self.encoding_detection:
                encoding_issues = self._check_encoding_issues(document_content)
            
            # Detect primary language
            primary_language, confidence, language_codes = self._detect_primary_language(document_content)
            
            # Detect section languages if enabled
            section_languages = {}
            if self.section_detection and document_content and len(document_content) > self.min_section_length:
                section_languages = self._detect_section_languages(document_content)
            
            logger.info(f"Detected primary language: {primary_language} with confidence {confidence:.2f}")
            
            # Use AI to validate language detection if configured
            if self.ai_model and confidence < self.min_confidence:
                ai_language = self._validate_with_ai(document_content, primary_language)
                if ai_language and ai_language != primary_language:
                    logger.info(f"AI suggests different language: {ai_language} (was {primary_language})")
                    primary_language = ai_language
                    confidence = 0.9  # Assign high confidence to AI prediction
            
            return LanguageInfo(
                primary_language=primary_language,
                confidence=confidence,
                language_codes=language_codes,
                section_languages=section_languages,
                encoding_issues=encoding_issues
            )
        except Exception as e:
            logger.error(f"Error detecting language: {str(e)}")
            # Fallback to simple detection
            try:
                langid.set_languages(['en', 'fr', 'de', 'es', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'])
                lang, _ = langid.classify(document_content[:1000])
                return LanguageInfo(
                    primary_language=lang,
                    confidence=0.5,
                    encoding_issues=["Error in main detection, using fallback"]
                )
            except:
                return LanguageInfo(
                    primary_language="unknown",
                    confidence=0.0,
                    encoding_issues=["Language detection failed"]
                )
    
    def _detect_primary_language(self, text):
        """Detect the primary language of the text"""
        if not text or len(text.strip()) < 10:
            return "unknown", 0.0, {}
        
        # First try with langdetect
        try:
            language_code = detect(text[:5000])
            confidence = 0.8  # langdetect doesn't provide confidence
            language_codes = {language_code: confidence}
            
            # Map language code to language name
            language_names = {
                'en': 'English',
                'fr': 'French',
                'de': 'German',
                'es': 'Spanish',
                'it': 'Italian',
                'pt': 'Portuguese',
                'ru': 'Russian',
                'zh': 'Chinese',
                'ja': 'Japanese',
                'ko': 'Korean',
                'ar': 'Arabic',
                'hi': 'Hindi',
                'nl': 'Dutch',
                'sv': 'Swedish',
                'fi': 'Finnish',
                'no': 'Norwegian',
                'da': 'Danish',
                'cs': 'Czech',
                'pl': 'Polish',
                'hu': 'Hungarian',
                'tr': 'Turkish',
                'el': 'Greek',
                'he': 'Hebrew',
                'th': 'Thai',
                'vi': 'Vietnamese'
            }
            
            primary_language = language_names.get(language_code, language_code)
            
            # Cross-validate with langid
            langid.set_languages(list(language_names.keys()))
            langid_code, langid_conf = langid.classify(text[:5000])
            
            if langid_code != language_code:
                logger.info(f"Language detection conflict: langdetect={language_code}, langid={langid_code}")
                # If confidence is high enough, prefer langid
                if langid_conf > 0.6:
                    primary_language = language_names.get(langid_code, langid_code)
                    confidence = langid_conf
                    language_codes[langid_code] = langid_conf
            
            return primary_language, confidence, language_codes
            
        except LangDetectException as e:
            logger.warning(f"langdetect error: {str(e)}. Falling back to langid.")
            try:
                langid_code, confidence = langid.classify(text[:5000])
                language_names = {
                    'en': 'English',
                    'fr': 'French',
                    'de': 'German',
                    'es': 'Spanish',
                    'it': 'Italian',
                    'pt': 'Portuguese',
                    'ru': 'Russian',
                    'zh': 'Chinese',
                    'ja': 'Japanese'
                }
                primary_language = language_names.get(langid_code, langid_code)
                return primary_language, confidence, {langid_code: confidence}
            except Exception as e2:
                logger.error(f"langid error: {str(e2)}")
                return "unknown", 0.0, {}
    
    def _detect_section_languages(self, text):
        """Detect languages at the section level"""
        section_languages = {}
        
        # Simple approach: split by newlines and detect language of paragraphs
        paragraphs = text.split('\n\n')
        
        for i, paragraph in enumerate(paragraphs):
            if len(paragraph.strip()) >= self.min_section_length:
                try:
                    lang, _ = langid.classify(paragraph)
                    section_key = f"paragraph_{i}"
                    section_languages[section_key] = lang
                except Exception as e:
                    logger.warning(f"Error detecting language for section {i}: {str(e)}")
        
        return section_languages
    
    def _check_encoding_issues(self, text):
        """Detect potential encoding issues in the text"""
        encoding_issues = []
        
        # Check for common encoding error indicators
        if '�' in text:
            encoding_issues.append("Replacement character detected (�)")
        
        # Check for unexpected Unicode control characters
        control_chars = set(range(0, 32)) - {9, 10, 13}  # Tab, LF, CR are allowed
        if any(ord(c) in control_chars for c in text):
            encoding_issues.append("Unexpected control characters")
        
        # Check for mojibake patterns (e.g., Ã© instead of é)
        mojibake_patterns = [
            (r'Ã©', 'é'),
            (r'Ã¨', 'è'),
            (r'Ã¤', 'ä'),
            (r'Ã¶', 'ö'),
            (r'Ã¼', 'ü')
        ]
        
        for pattern, replacement in mojibake_patterns:
            if re.search(pattern, text):
                encoding_issues.append(f"Possible mojibake: {pattern} should be {replacement}")
        
        return encoding_issues
    
    def _validate_with_ai(self, text, detected_language):
        """Use AI to validate language detection"""
        if not self.ai_model:
            return None
            
        try:
            # Prepare sample for validation
            sample = text[:1000] if len(text) > 1000 else text
            
            prompt = f"""
            Please identify the language of the following text. 
            Respond with just the language name in English.
            
            Text: "{sample}"
            """
            
            result = self.ai_model.process(
                prompt,
                max_tokens=50,
                temperature=0.1
            )
            
            if result:
                # Clean up and normalize the result
                result = result.strip().lower()
                
                # Extract just the language name
                language_pattern = r'(english|french|german|spanish|italian|portuguese|russian|chinese|japanese|korean|arabic|hindi|dutch|swedish|finnish|norwegian|danish|czech|polish|hungarian|turkish|greek|hebrew|thai|vietnamese)'
                match = re.search(language_pattern, result)
                
                if match:
                    return match.group(1).capitalize()
            
            return None
        except Exception as e:
            logger.error(f"Error validating language with AI: {str(e)}")
            return None


class SectionDetector(ContentAnalyzer):
    """Detects hierarchical sections in documents"""
    
    def __init__(self, config):
        self.config = config
        self.ai_model = None
        self.heading_patterns = [
            # Common heading patterns with capturing groups for section number and title
            r'^((?:\d+\.)+)\s*(.+),
            r'^([A-Z]\.)\s*(.+),
            r'^([IVXLCDM]+\.)\s*(.+),
            r'^(Section\s+\d+(?:\.\d+)*)\s*[-:]?\s*(.+),
            r'^(Chapter\s+\d+(?:\.\d+)*)\s*[-:]?\s*(.+),
            r'^(Appendix\s+[A-Z])\s*[-:]?\s*(.+)
        ]
        
        self.heading_markers = config.get("heading_markers", [
            "HEADING", "TITLE", "SECTION", "CHAPTER", "PART"
        ])
        
        # Regular expressions for detecting headings based on formatting (simplified)
        self.formatting_patterns = [
            r'^#+\s+(.+),  # Markdown headings
            r'^<h[1-6].*?>(.+?)</h[1-6]>,  # HTML headings
            r'^\s*\\(chapter|section|subsection|subsubsection)\{(.+)\}',  # LaTeX headings
        ]
        
        self.min_section_length = config.get("min_section_length", 50)
        self.max_heading_length = config.get("max_heading_length", 200)
        
        if config.get("use_ai_model", False):
            ai_provider = config.get("ai_provider", "local")
            if ai_provider == "together":
                self.ai_model = TogetherAIIntegration(
                    api_key=config.get("together_api_key"),
                    model_name=config.get("together_model", "togethercomputer/llama-2-70b-chat")
                )
            elif ai_provider == "local":
                self.ai_model = LocalModelIntegration(
                    model_name=config.get("local_model", "bert-base-uncased"),
                    task="token-classification",
                    device=config.get("device", "cpu")
                )
    
    def analyze(self, document_content, document_metadata=None):
        """Detect hierarchical sections in the document"""
        try:
            # Try to extract document title
            title = self._extract_document_title(document_content)
            
            # Split document into lines
            lines = document_content.split('\n')
            
            # Find potential section headings
            headings = self._identify_headings(lines)
            
            # Create section objects with hierarchical structure
            doc_structure = self._create_section_hierarchy(headings, document_content)
            doc_structure.title = title
            
            # Add document metadata if available
            if document_metadata:
                doc_structure.metadata = document_metadata
            
            # Use AI to enhance section detection if configured
            if self.ai_model:
                doc_structure = self._enhance_with_ai(doc_structure, document_content)
            
            logger.info(f"Detected {len(doc_structure.sections)} top-level sections")
            return doc_structure
        except Exception as e:
            logger.error(f"Error detecting sections: {str(e)}")
            # Return basic document structure on error
            return DocumentStructure(
                title=document_metadata.get("title") if document_metadata else None,
                sections=[DocumentSection(
                    title="Document Content",
                    content=document_content,
                    level=0
                )]
            )
    
    def _extract_document_title(self, document_content):
        """Extract the document title from content"""
        title = None
        
        # Simple approach: look for the first non-empty line
        lines = document_content.split('\n')
        for line in lines:
            line = line.strip()
            if line and len(line) < self.max_heading_length:
                # Check if it looks like a title (not a heading with number)
                if not any(re.match(pattern, line) for pattern in self.heading_patterns):
                    title = line
                    break
        
        return title
    
    def _identify_headings(self, lines):
        """Identify potential section headings in the document"""
        headings = []
        
        for i, line in enumerate(lines):
            line = line.strip()
            if not line or len(line) > self.max_heading_length:
                continue
            
            # Check for patterns in the current line
            is_heading = False
            heading_text = line
            section_number = None
            level = 1  # Default level
            
            # Check for numbered headings
            for pattern in self.heading_patterns:
                match = re.match(pattern, line)
                if match:
                    section_number = match.group(1).strip()
                    heading_text = match.group(2).strip()
                    # Determine level from the section number (count dots or depth indicators)
                    level = section_number.count('.') + 1 if '.' in section_number else 1
                    is_heading = True
                    break
            
            # Check for formatting-based headings
            if not is_heading:
                for pattern in self.formatting_patterns:
                    match = re.match(pattern, line)
                    if match:
                        if len(match.groups()) == 1:
                            heading_text = match.group(1).strip()
                            # For Markdown, determine level from number of #
                            if pattern.startswith(r'^#+'):
                                level = line.count('#')
                            # For HTML, extract level from tag
                            elif '<h' in pattern:
                                level_match = re.search(r'<h([1-6])', line)
                                if level_match:
                                    level = int(level_match.group(1))
                            is_heading = True
                            break
                        elif len(match.groups()) == 2:
                            # LaTeX type heading
                            marker = match.group(1)
                            heading_text = match.group(2).strip()
                            # Determine level from LaTeX command
                            if marker == 'chapter':
                                level = 1
                            elif marker == 'section':
                                level = 2
                            elif marker == 'subsection':
                                level = 3
                            elif marker == 'subsubsection':
                                level = 4
                            is_heading = True
                            break
            
            # Check for caps or special formatting indicators
            if not is_heading:
                # All caps might indicate a heading
                if line.isupper() and len(line) > 3 and len(line) < 100:
                    is_heading = True
                    level = 1
                # Check for heading markers
                elif any(marker in line.upper() for marker in self.heading_markers):
                    is_heading = True
                    level = 1
                # Check for lines followed by blank lines (potential heading)
                elif i < len(lines) - 1 and not lines[i+1].strip() and i > 0 and not lines[i-1].strip():
                    is_heading = True
                    level = 3  # Assume lower level for unmarked headings
            
            if is_heading:
                headings.append({
                    'text': heading_text,
                    'section_number': section_number,
                    'level': level,
                    'line_index': i
                })
        
        return headings
    
    def _create_section_hierarchy(self, headings, document_content):
        """Create hierarchical section structure from identified headings"""
        lines = document_content.split('\n')
        doc_structure = DocumentStructure()
        
        # If no headings were found, create a single section
        if not headings:
            doc_structure.sections = [DocumentSection(
                title="Document Content",
                content=document_content,
                level=0
            )]
            return doc_structure
        
        # Create section objects from headings
        sections = []
        for i, heading in enumerate(headings):
            start_index = heading['line_index']
            end_index = len(lines) if i == len(headings) - 1 else headings[i+1]['line_index']
            
            section_content = '\n'.join(lines[start_index+1:end_index])
            
            section = DocumentSection(
                title=heading['text'],
                content=section_content,
                level=heading['level'],
                section_number=heading['section_number'],
                start_index=start_index,
                end_index=end_index
            )
            sections.append(section)
        
        # Build hierarchy
        return self._build_hierarchy(sections)
    
    def _build_hierarchy(self, sections):
        """Build parent-child relationships between sections based on levels"""
        doc_structure = DocumentStructure()
        
        if not sections:
            return doc_structure
        
        # Sort by start_index to ensure proper order
        sections.sort(key=lambda s: s.start_index if s.start_index is not None else 0)
        
        # First pass: identify root sections
        root_sections = []
        min_level = min(section.level for section in sections)
        
        for section in sections:
            if section.level == min_level:
                root_sections.append(section)
                doc_structure.sections.append(section)
        
        # Second pass: assign children
        for root in root_sections:
            self._assign_children(root, sections)
        
        return doc_structure
    
    def _assign_children(self, parent, all_sections):
        """Recursively assign child sections to a parent section"""
        potential_children = [s for s in all_sections 
                             if s.start_index > parent.start_index 
                             and s.end_index <= parent.end_index 
                             and s.level > parent.level
                             and s != parent]
        
        # Group potential children by level
        level_groups = {}
        for section in potential_children:
            if section.level not in level_groups:
                level_groups[section.level] = []
            level_groups[section.level].append(section)
        
        # Find direct children (sections with the next level)
        if level_groups:
            next_level = min(level_groups.keys())
            direct_children = level_groups[next_level]
            
            # Sort children by start_index
            direct_children.sort(key=lambda s: s.start_index if s.start_index is not None else 0)
            
            # Assign children
            for child in direct_children:
                child.parent = parent
                parent.children.append(child)
                
                # Recursively process this child's children
                self._assign_children(child, all_sections)
    
    def _enhance_with_ai(self, doc_structure, document_content):
        """Use AI to enhance section detection and structure"""
        if not self.ai_model:
            return doc_structure
            
        try:
            # Sample of document for AI analysis
            sample_size = min(len(document_content), 5000)
            sample = document_content[:sample_size]
            
            prompt = f"""
            Analyze the structure of this document and identify its main sections.
            For each section, provide the section title, level (1 for top-level, 2 for sub-sections, etc.),
            and any section numbering scheme used.
            
            Document sample:
            {sample}
            
            Format your response as follows:
            Section 1: [Title] | Level: [#] | Number: [section number if any]
            Section 2: [Title] | Level: [#] | Number: [section number if any]
            ...
            """
            
            result = self.ai_model.process(
                prompt,
                max_tokens=1024,
                temperature=0.3
            )
            
            if result:
                # Parse AI-detected sections
                ai_sections = []
                
                # Extract sections from AI response
                section_pattern = r'Section\s+\d+:\s+(.+?)\s+\|\s+Level:\s+(\d+)\s+\|\s+Number:\s+(.+?)
                for line in result.split('\n'):
                    match = re.search(section_pattern, line)
                    if match:
                        ai_sections.append({
                            'title': match.group(1).strip(),
                            'level': int(match.group(2)),
                            'section_number': match.group(3).strip() if match.group(3).strip() != 'None' else None
                        })
                
                # If AI found more sections than we did, add them
                if len(ai_sections) > len(doc_structure.sections):
                    logger.info(f"AI detected {len(ai_sections)} sections vs {len(doc_structure.sections)} from rules")
                    
                    # TODO: Merge AI-detected sections with existing ones
                    # For this example, we'll just add metadata about AI suggestions
                    doc_structure.metadata["ai_suggested_sections"] = ai_sections
                
            return doc_structure
        except Exception as e:
            logger.error(f"Error enhancing sections with AI: {str(e)}")
            return doc_structure


class AdvancedContentAnalysis:
    """Main module for advanced content analysis capabilities"""
    
    def __init__(self, config_file=None, config=None):
        """Initialize with either a config file path or a config dictionary"""
        if config_file:
            with open(config_file, 'r') as f:
                self.config = yaml.safe_load(f)
        else:
            self.config = config or {}
            
        # Initialize analyzers based on configuration
        self.table_extractor = None
        self.language_detector = None
        self.section_detector = None
        
        if self.config.get("table_extraction", {}).get("enabled", True):
            self.table_extractor = TableExtractor(self.config.get("table_extraction", {}))
            
        if self.config.get("language_detection", {}).get("enabled", True):
            self.language_detector = LanguageDetector(self.config.get("language_detection", {}))
            
        if self.config.get("section_detection", {}).get("enabled", True):
            self.section_detector = SectionDetector(self.config.get("section_detection", {}))
        
        logger.info(f"Initialized AdvancedContentAnalysis with config: {self.config.get('name', 'default')}")
    
    def analyze_document(self, document_content, document_metadata=None):
        """Run all enabled analyzers on a document"""
        results = {}
        
        if not document_content:
            logger.warning("Empty document content provided")
            return {}
            
        if self.table_extractor:
            try:
                tables = self.table_extractor.analyze(document_content, document_metadata)
                results["tables"] = tables
                logger.info(f"Extracted {len(tables)} tables")
            except Exception as e:
                logger.error(f"Error in table extraction: {str(e)}")
                results["tables"] = []
        
        if self.language_detector:
            try:
                language_info = self.language_detector.analyze(document_content, document_metadata)
                results["language"] = language_info
                logger.info(f"Detected language: {language_info.primary_language}")
            except Exception as e:
                logger.error(f"Error in language detection: {str(e)}")
                results["language"] = LanguageInfo(primary_language="unknown", confidence=0.0)
        
        if self.section_detector:
            try:
                doc_structure = self.section_detector.analyze(document_content, document_metadata)
                results["structure"] = doc_structure
                logger.info(f"Detected {len(doc_structure.sections)} top-level sections")
            except Exception as e:
                logger.error(f"Error in section detection: {str(e)}")
                results["structure"] = DocumentStructure()
        
        return results
    
    def process_document(self, document_path, document_metadata=None):
        """Process a document from file"""
        try:
            with open(document_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # If metadata doesn't include format, try to infer it from file extension
            if document_metadata is None:
                document_metadata = {}
                
            if 'format' not in document_metadata:
                ext = os.path.splitext(document_path)[1].lower()
                format_map = {
                    '.pdf': 'pdf',
                    '.docx': 'docx',
                    '.doc': 'doc',
                    '.html': 'html',
                    '.htm': 'html',
                    '.pptx': 'pptx',
                    '.txt': 'text',
                    '.md': 'markdown'
                }
                document_metadata['format'] = format_map.get(ext, 'text')
                
            # Add file metadata
            document_metadata['filename'] = os.path.basename(document_path)
            document_metadata['file_size'] = os.path.getsize(document_path)
            
            return self.analyze_document(content, document_metadata)
        except Exception as e:
            logger.error(f"Error processing document {document_path}: {str(e)}")
            return {"error": str(e)}
    
    def save_results(self, results, output_path, format="json"):
        """Save analysis results to file"""
        try:
            output_data = {}
            
            # Convert results to serializable format
            if "tables" in results:
                output_data["tables"] = [table.__dict__ for table in results["tables"]]
                
            if "language" in results:
                output_data["language"] = results["language"].__dict__
                
            if "structure" in results:
                output_data["structure"] = results["structure"].to_dict()
            
            # Save to file in specified format
            if format.lower() == "json":
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(output_data, f, ensure_ascii=False, indent=2)
            elif format.lower() == "yaml":
                with open(output_path, 'w', encoding='utf-8') as f:
                    yaml.dump(output_data, f, default_flow_style=False)
            else:
                logger.error(f"Unsupported output format: {format}")
                return False
                
            logger.info(f"Results saved to {output_path}")
            return True
        except Exception as e:
            logger.error(f"Error saving results: {str(e)}")
            return False


def integrate_with_document_preprocessor(advanced_analysis, preprocessor):
    """
    Integration function to hook Advanced Content Analysis into
    an existing Document Preprocessor
    
    Args:
        advanced_analysis: Instance of AdvancedContentAnalysis
        preprocessor: The existing document preprocessor object
    
    Returns:
        Enhanced preprocessor with advanced analysis capabilities
    """
    # This is a placeholder function showing how integration might work
    # In a real implementation, this would depend on the actual preprocessor API
    
    original_process_method = preprocessor.process_document
    
    def enhanced_process_document(document_path, options=None):
        # Call the original method first
        result = original_process_method(document_path, options)
        
        # Skip advanced analysis if it's disabled in options
        if options and not options.get("advanced_analysis", True):
            return result
            
        # Add advanced analysis results
        advanced_results = advanced_analysis.process_document(
            document_path, 
            document_metadata=result.get("metadata")
        )
        
        # Merge results
        result["advanced_analysis"] = advanced_results
        
        return result
    
    # Replace the original method with enhanced version
    preprocessor.process_document = enhanced_process_document
    
    return preprocessor


def create_default_config():
    """Create default configuration structure for AdvancedContentAnalysis"""
    return {
        "name": "Advanced Content Analysis",
        "version": "1.0",
        "description": "Enhanced document processing capabilities",
        
        "table_extraction": {
            "enabled": True,
            "use_ai_model": False,
            "ai_provider": "local",  # "local" or "together"
            "together_api_key": "",
            "together_model": "togethercomputer/llama-2-70b-chat",
            "local_model": "microsoft/table-transformer-detection",
            "device": "cpu",
            "enable_fallback": True,
            "formats": ["pdf", "docx", "html", "pptx", "text"]
        },
        
        "language_detection": {
            "enabled": True,
            "use_ai_model": False,
            "ai_provider": "local",
            "together_api_key": "",
            "together_model": "togethercomputer/llama-2-70b-chat",
            "local_model": "xlm-roberta-base",
            "device": "cpu",
            "min_confidence": 0.7,
            "section_detection": True,
            "min_section_length": 100,
            "supported_languages": [
                "en", "fr", "de", "es", "it", "pt", "ru", "zh", "ja", "ko", "ar"
            ],
            "encoding_detection": True
        },
        
        "section_detection": {
            "enabled": True,
            "use_ai_model": False,
            "ai_provider": "local",
            "together_api_key": "",
            "together_model": "togethercomputer/llama-2-70b-chat",
            "local_model": "bert-base-uncased",
            "device": "cpu",
            "min_section_length": 50,
            "max_heading_length": 200,
            "heading_markers": ["HEADING", "TITLE", "SECTION", "CHAPTER", "PART"]
        },
        
        "storage": {
            "type": "filesystem",  # "filesystem", "database", or "cloud"
            "path": "./advanced_analysis_results",
            "format": "json",  # "json" or "yaml"
            "database": {
                "type": "sqlite",
                "connection_string": "sqlite:///advanced_analysis.db"
            },
            "cloud": {
                "provider": "s3",
                "bucket": "document-analysis",
                "prefix": "advanced-analysis/"
            }
        }
    }
