import datetime
import re
import os
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from typing import Dict, List, Set
from sklearn.feature_extraction.text import TfidfVectorizer

class MetadataExtractor:
    def __init__(self, config=None):
        """
        Initialize metadata extractor with optional configuration
        
        Args:
            config: Configuration dictionary with customization options
        """
        self.config = config or {}
        
        # Download NLTK resources if needed
        nltk.download('stopwords', quiet=True)
        nltk.download('punkt', quiet=True)
        
        # Load industry-specific keywords from config
        self.industry_keywords = self.config.get('industry_keywords', {})
        
        # Prepare TF-IDF vectorizer for keyword extraction
        self.tfidf = TfidfVectorizer(stop_words='english', max_features=50)
        
    def extract_metadata(self, document_info: Dict) -> Dict:
        """
        Extract and enhance metadata from document
        
        Args:
            document_info: Document information with content
            
        Returns:
            Document with enhanced metadata
        """
        # Extract basic metadata
        metadata = self._extract_basic_metadata(document_info)
        
        # Extract content-based metadata
        content_metadata = self._extract_content_metadata(document_info)
        metadata.update(content_metadata)
        
        # Add metadata to document info
        document_info['metadata'] = metadata
        
        return document_info
    
    def _extract_basic_metadata(self, document_info: Dict) -> Dict:
        """Extract basic file metadata"""
        file_path = document_info['path']
        modified_time = os.path.getmtime(file_path)
        
        metadata = {
            'title': os.path.splitext(document_info['filename'])[0],
            'created_date': datetime.datetime.fromtimestamp(
                os.path.getctime(file_path)).isoformat(),
            'modified_date': datetime.datetime.fromtimestamp(
                modified_time).isoformat(),
            'size_bytes': document_info['size_bytes'],
            'file_type': document_info['extension'][1:],  # Remove leading dot
            'category': document_info['category'],
            'industry_tags': document_info['industry_tags']
        }
        
        return metadata
    
    def _extract_content_metadata(self, document_info: Dict) -> Dict:
        """Extract metadata based on document content"""
        # Get full text content
        full_text = document_info['content']['full_text']
        
        # Initialize content metadata
        content_metadata = {
            'keywords': self._extract_keywords(full_text),
            'estimated_reading_time': self._calculate_reading_time(full_text),
            'word_count': len(full_text.split()),
            'content_type': self._determine_content_type(full_text),
            'technical_level': self._determine_technical_level(full_text),
            'contains_pricing': self._contains_pricing_info(full_text),
            'contains_graphics': self._estimate_graphics_content(document_info),
            'readability_score': self._calculate_readability(full_text),
            'industry_relevance': self._determine_industry_relevance(full_text)
        }
        
        # Check for specific document indicators
        if self._is_legal_document(full_text):
            content_metadata['document_subtype'] = 'legal'
        elif self._is_financial_document(full_text):
            content_metadata['document_subtype'] = 'financial'
        elif self._is_technical_document(full_text):
            content_metadata['document_subtype'] = 'technical'
        
        return content_metadata
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract keywords using TF-IDF"""
        # Use a corpus of just this document for TF-IDF
        try:
            tfidf_matrix = self.tfidf.fit_transform([text])
            feature_names = self.tfidf.get_feature_names_out()
            
            # Get top keywords
            scores = zip(feature_names, tfidf_matrix.toarray()[0])
            sorted_scores = sorted(scores, key=lambda x: x[1], reverse=True)
            
            # Return top 10 keywords
            return [word for word, score in sorted_scores[:10]]
        except:
            # Fallback to simple word frequency if TF-IDF fails
            words = word_tokenize(text.lower())
            stop_words = set(stopwords.words('english'))
            filtered_words = [word for word in words if word.isalnum() and word not in stop_words]
            
            # Count word frequencies
            word_freq = {}
            for word in filtered_words:
                word_freq[word] = word_freq.get(word, 0) + 1
                
            # Return top 10 words by frequency
            return [word for word, freq in sorted(word_freq.items(), 
                                                key=lambda x: x[1], 
                                                reverse=True)[:10]]
    
    def _calculate_reading_time(self, text: str) -> int:
        """Calculate estimated reading time in minutes"""
        # Average reading speed: 200-250 words per minute
        word_count = len(text.split())
        reading_time = max(1, round(word_count / 225))  # Min 1 minute
        return reading_time
    
    def _determine_content_type(self, text: str) -> str:
        """Determine the primary content type"""
        # Define patterns for different content types
        patterns = {
            'narrative': r'\b(we|our|us|client|customer|service|provide|solution)\b',
            'technical': r'\b(system|data|software|hardware|network|configuration|interface)\b',
            'financial': r'\b(\$|cost|price|budget|expense|payment|invoice|dollar)\b',
            'legal': r'\b(agreement|contract|comply|regulation|requirement|law|guideline|policy)\b'
        }
        
        # Count matches for each pattern
        counts = {}
        for content_type, pattern in patterns.items():
            counts[content_type] = len(re.findall(pattern, text, re.IGNORECASE))
            
        # Return the content type with the most matches
        return max(counts.items(), key=lambda x: x[1])[0]
    
    def _determine_technical_level(self, text: str) -> str:
        """Determine technical complexity level"""
        # Calculate average word length as a simple technical indicator
        words = text.split()
        if not words:
            return 'low'
            
        avg_word_length = sum(len(word) for word in words) / len(words)
        
        # Count technical terms
        technical_term_count = len(re.findall(
            r'\b(algorithm|framework|infrastructure|implementation|architecture|integration|protocol)\b', 
            text, 
            re.IGNORECASE
        ))
        
        # Determine level based on word length and technical term frequency
        if avg_word_length > 6 and technical_term_count > 10:
            return 'high'
        elif avg_word_length > 5 and technical_term_count > 5:
            return 'medium'
        else:
            return 'low'
    
    def _contains_pricing_info(self, text: str) -> bool:
        """Check if document contains pricing information"""
        price_patterns = [
            r'\$\s*[\d,]+(\.\d{2})?',  # $1,000.00
            r'\b\d+\s*dollars\b',  # 1000 dollars
            r'\bcost\b.{1,30}\$\d+',  # cost... $100
            r'\bprice\b.{1,30}\$\d+',  # price... $100
            r'\b(total|subtotal|grand total).{1,30}\$\d+'  # total... $100
        ]
        
        for pattern in price_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return True
                
        return False
    
    def _estimate_graphics_content(self, document_info: Dict) -> bool:
        """Estimate if document contains graphics based on file type and content"""
        # Check file extension for potential graphics
        if document_info['extension'] in ['.pdf', '.pptx', '.docx']:
            # Check for image references in text
            text = document_info['content']['full_text']
            image_indicators = [
                r'\bfigure\s+\d+\b',
                r'\bimage\b',
                r'\bchart\b',
                r'\bgraph\b',
                r'\bdiagram\b',
                r'\billustration\b'
            ]
            
            for indicator in image_indicators:
                if re.search(indicator, text, re.IGNORECASE):
                    return True
                    
        return False
    
    def _calculate_readability(self, text: str) -> float:
        """Calculate simplified readability score (0-100)"""
        # Split into sentences and words
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        word_count = len(text.split())
        
        if not sentences or not word_count:
            return 50.0  # Default middle value
            
        # Calculate average sentence length
        avg_sentence_length = word_count / len(sentences)
        
        # Calculate average word length
        char_count = len(re.sub(r'\s', '', text))
        avg_word_length = char_count / word_count if word_count > 0 else 5.0
        
        # Simple readability formula (100 = easy, 0 = difficult)
        # Lower values for longer sentences and words
        readability = max(0, min(100, 
            206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_word_length / 10)))
            
        return round(readability, 1)
    
    def _determine_industry_relevance(self, text: str) -> Dict[str, float]:
        """Determine document relevance to different industries"""
        relevance_scores = {}
        
        # Check relevance to each configured industry
        for industry, keywords in self.industry_keywords.items():
            matches = 0
            for keyword in keywords:
                matches += len(re.findall(r'\b' + re.escape(keyword) + r'\b', 
                                      text, re.IGNORECASE))
            
            # Normalize score (0-1)
            word_count = len(text.split())
            if word_count > 0:
                score = min(1.0, matches / (word_count * 0.01))  # Cap at 1.0
                relevance_scores[industry] = round(score, 2)
                
        return relevance_scores
    
    def _is_legal_document(self, text: str) -> bool:
        """Check if document is primarily legal in nature"""
        legal_indicators = [
            r'\b(terms and conditions)\b',
            r'\b(privacy policy)\b',
            r'\b(legal agreement)\b',
            r'\b(hereby agrees)\b',
            r'\b(shall comply)\b',
            r'\b(liability)\b.{1,50}\b(limitation)\b',
            r'\b(intellectual property)\b'
        ]
        
        matches = 0
        for indicator in legal_indicators:
            matches += len(re.findall(indicator, text, re.IGNORECASE))
            
        # Check if significant number of legal terms found
        return matches >= 3
    
    def _is_financial_document(self, text: str) -> bool:
        """Check if document is primarily financial in nature"""
        financial_indicators = [
            r'\b(balance sheet)\b',
            r'\b(income statement)\b',
            r'\b(cash flow)\b',
            r'\b(fiscal year)\b',
            r'\b(quarterly report)\b',
            r'\b(profit margin)\b',
            r'\b(revenue forecast)\b'
        ]
        
        matches = 0
        for indicator in financial_indicators:
            matches += len(re.findall(indicator, text, re.IGNORECASE))
            
        # Check if significant number of financial terms found
        return matches >= 3
    
    def _is_technical_document(self, text: str) -> bool:
        """Check if document is primarily technical in nature"""
        technical_indicators = [
            r'\b(technical specification)\b',
            r'\b(system architecture)\b',
            r'\b(data flow)\b',
            r'\b(software component)\b',
            r'\b(api reference)\b',
            r'\b(database schema)\b',
            r'\b(implementation details)\b'
        ]
        
        matches = 0
        for indicator in technical_indicators:
            matches += len(re.findall(indicator, text, re.IGNORECASE))
            
        # Check if significant number of technical terms found
        return matches >= 3