import json
import os
import time
import requests
from typing import Dict, List, Optional, Any, Union
from enum import Enum
import logging

class LLMProvider(Enum):
    TOGETHER_AI = "together_ai"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    CUSTOM = "custom"

class LLMTask(Enum):
    DOCUMENT_CLASSIFICATION = "document_classification"
    METADATA_ENHANCEMENT = "metadata_enhancement"
    CONTENT_SUMMARIZATION = "content_summarization"
    TAXONOMY_GENERATION = "taxonomy_generation"

class LLMConfig:
    """Configuration class for LLM integration"""
    
    def __init__(self, config_path: str = None):
        """
        Initialize LLM configuration from file or defaults
        
        Args:
            config_path: Path to JSON configuration file (optional)
        """
        # Default configuration
        self.default_config = {
            "provider": LLMProvider.TOGETHER_AI.value,
            "api_key": os.environ.get("TOGETHER_API_KEY", ""),
            "base_url": "https://api.together.xyz/v1",
            "default_model": "mistralai/Mixtral-8x7B-Instruct-v0.1",
            "timeout": 60,
            "max_retries": 3,
            "retry_delay": 2,
            "max_tokens": 2048,
            "temperature": 0.2,
            "tasks": {
                LLMTask.DOCUMENT_CLASSIFICATION.value: {
                    "model": "mistralai/Mixtral-8x7B-Instruct-v0.1",
                    "temperature": 0.1,
                    "max_tokens": 1024,
                    "enabled": True
                },
                LLMTask.METADATA_ENHANCEMENT.value: {
                    "model": "mistralai/Mixtral-8x7B-Instruct-v0.1", 
                    "temperature": 0.2,
                    "max_tokens": 1536,
                    "enabled": True
                },
                LLMTask.CONTENT_SUMMARIZATION.value: {
                    "model": "meta-llama/Llama-3-70b-chat-hf",
                    "temperature": 0.3,
                    "max_tokens": 2048,
                    "enabled": True
                },
                LLMTask.TAXONOMY_GENERATION.value: {
                    "model": "mistralai/Mixtral-8x7B-Instruct-v0.1",
                    "temperature": 0.1,
                    "max_tokens": 1024,
                    "enabled": True
                }
            }
        }
        
        # Load configuration from file if provided
        if config_path and os.path.exists(config_path):
            with open(config_path, 'r') as file:
                user_config = json.load(file)
                self._merge_configs(user_config)
        else:
            self.config = self.default_config
        
    def _merge_configs(self, user_config: Dict):
        """Merge user configuration with defaults"""
        self.config = self.default_config.copy()
        
        # Update top-level config
        for key, value in user_config.items():
            if key != "tasks":
                self.config[key] = value
        
        # Update tasks if provided
        if "tasks" in user_config:
            for task, task_config in user_config["tasks"].items():
                if task in self.config["tasks"]:
                    for param, param_value in task_config.items():
                        self.config["tasks"][task][param] = param_value
    
    def get_task_config(self, task: LLMTask) -> Dict:
        """Get configuration for a specific task"""
        task_key = task.value
        if task_key in self.config["tasks"]:
            return self.config["tasks"][task_key]
        return {}
    
    def is_task_enabled(self, task: LLMTask) -> bool:
        """Check if a specific task is enabled"""
        task_config = self.get_task_config(task)
        return task_config.get("enabled", False)
    
    def save_config(self, path: str):
        """Save current configuration to file"""
        with open(path, 'w') as file:
            json.dump(self.config, file, indent=2)


class LLMClient:
    """Client for interacting with LLM providers"""
    
    def __init__(self, config: Union[LLMConfig, str]):
        """
        Initialize LLM client
        
        Args:
            config: LLMConfig instance or path to config file
        """
        if isinstance(config, str):
            self.config = LLMConfig(config)
        else:
            self.config = config
            
        self.logger = logging.getLogger('LLMClient')
        
    def generate(self, prompt: str, task: LLMTask = None, **kwargs) -> Optional[str]:
        """
        Generate text using configured LLM
        
        Args:
            prompt: Text prompt for the LLM
            task: Specific task to use configuration for (optional)
            **kwargs: Override configuration parameters
            
        Returns:
            Generated text or None if failed
        """
        provider = self.config.config["provider"]
        
        # Get task-specific configuration if provided
        params = {}
        if task:
            params = self.config.get_task_config(task).copy()
            
        # Override with any provided kwargs
        params.update(kwargs)
        
        # Select appropriate provider method
        if provider == LLMProvider.TOGETHER_AI.value:
            return self._generate_together_ai(prompt, params)
        elif provider == LLMProvider.OPENAI.value:
            return self._generate_openai(prompt, params)
        elif provider == LLMProvider.ANTHROPIC.value:
            return self._generate_anthropic(prompt, params)
        elif provider == LLMProvider.CUSTOM.value:
            return self._generate_custom(prompt, params)
        else:
            self.logger.error(f"Unsupported provider: {provider}")
            return None
    
    def _generate_together_ai(self, prompt: str, params: Dict) -> Optional[str]:
        """Generate text using Together.ai API"""
        api_key = self.config.config["api_key"]
        base_url = self.config.config["base_url"]
        
        # Get parameters with defaults
        model = params.get("model", self.config.config["default_model"])
        temperature = params.get("temperature", self.config.config["temperature"])
        max_tokens = params.get("max_tokens", self.config.config["max_tokens"])
        
        # Prepare API request
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Format messages in the chat format
        messages = [{"role": "user", "content": prompt}]
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        # Add any additional parameters
        for key, value in params.items():
            if key not in ["model", "temperature", "max_tokens", "enabled"]:
                payload[key] = value
        
        # Make API request with retries
        retries = 0
        max_retries = self.config.config["max_retries"]
        
        while retries <= max_retries:
            try:
                response = requests.post(
                    f"{base_url}/completions", 
                    headers=headers, 
                    json=payload,
                    timeout=self.config.config["timeout"]
                )
                
                if response.status_code == 200:
                    result = response.json()
                    # Extract text from the response based on Together.ai format
                    if "choices" in result and len(result["choices"]) > 0:
                        message = result["choices"][0].get("message", {})
                        return message.get("content", "")
                    return ""
                else:
                    self.logger.warning(f"API request failed with status {response.status_code}: {response.text}")
            
            except Exception as e:
                self.logger.warning(f"API request failed: {str(e)}")
            
            # Retry after delay
            retries += 1
            if retries <= max_retries:
                self.logger.info(f"Retrying in {self.config.config['retry_delay']} seconds...")
                time.sleep(self.config.config["retry_delay"])
            
        self.logger.error("Max retries exceeded. LLM request failed.")
        return None
    
    def _generate_openai(self, prompt: str, params: Dict) -> Optional[str]:
        """Generate text using OpenAI API"""
        # Implementation for OpenAI API
        # Similar to Together.ai but with OpenAI-specific parameters
        # This is a placeholder for future implementation
        self.logger.warning("OpenAI provider not fully implemented yet")
        return "OpenAI implementation placeholder"
    
    def _generate_anthropic(self, prompt: str, params: Dict) -> Optional[str]:
        """Generate text using Anthropic API"""
        # Implementation for Anthropic API
        # This is a placeholder for future implementation
        self.logger.warning("Anthropic provider not fully implemented yet")
        return "Anthropic implementation placeholder"
    
    def _generate_custom(self, prompt: str, params: Dict) -> Optional[str]:
        """Generate text using custom API"""
        # Implementation for custom API integration
        # This is a placeholder for future implementation
        self.logger.warning("Custom provider not implemented yet")
        return "Custom implementation placeholder"


class LLMDocumentProcessor:
    """Process documents using LLM for various tasks"""
    
    def __init__(self, llm_client: LLMClient):
        """
        Initialize document processor
        
        Args:
            llm_client: LLM client instance
        """
        self.llm_client = llm_client
        self.logger = logging.getLogger('LLMDocumentProcessor')
    
    def process_document(self, document_info: Dict) -> Dict:
        """
        Process a document with LLM for all enabled tasks
        
        Args:
            document_info: Document information with content
            
        Returns:
            Document with LLM-enhanced information
        """
        # Initialize LLM metadata if not present
        if "llm_metadata" not in document_info:
            document_info["llm_metadata"] = {}
        
        # Check which tasks are enabled and process
        config = self.llm_client.config
        
        # Document Classification
        if config.is_task_enabled(LLMTask.DOCUMENT_CLASSIFICATION):
            try:
                document_info = self._classify_document(document_info)
            except Exception as e:
                self.logger.error(f"Document classification failed: {str(e)}")
        
        # Metadata Enhancement
        if config.is_task_enabled(LLMTask.METADATA_ENHANCEMENT):
            try:
                document_info = self._enhance_metadata(document_info)
            except Exception as e:
                self.logger.error(f"Metadata enhancement failed: {str(e)}")
        
        # Content Summarization
        if config.is_task_enabled(LLMTask.CONTENT_SUMMARIZATION):
            try:
                document_info = self._summarize_content(document_info)
            except Exception as e:
                self.logger.error(f"Content summarization failed: {str(e)}")
        
        return document_info
    
    def _classify_document(self, document_info: Dict) -> Dict:
        """Classify document using LLM"""
        # Extract text content
        content = document_info.get('content', {}).get('full_text', '')
        filename = document_info.get('filename', 'Unknown')
        
        # Take a sample of the content for classification (first 5000 chars)
        content_sample = content[:5000]
        
        # Create prompt for document classification
        prompt = f"""
You are an expert document analyst specializing in RFP document classification.

Please analyze this document and classify it with the following information:

Document filename: {filename}

Document content (truncated):
{content_sample}

Provide your analysis in the following JSON format:
{{
  "document_type": "Type of document (e.g., RFP response, product spec, compliance document, solution brief)",
  "industry_classification": "Primary industry this document relates to",
  "secondary_industries": ["List", "of", "secondary", "related", "industries"],
  "document_purpose": "The main purpose of this document (e.g. technical description, legal agreement, marketing)",
  "audience": "The intended audience for this document",
  "confidence_score": "A value from 0-1 indicating confidence in classification"
}}

Return ONLY the JSON object with no additional text.
"""
        
        # Generate classification
        response = self.llm_client.generate(prompt, LLMTask.DOCUMENT_CLASSIFICATION)
        
        if response:
            try:
                # Extract JSON from potential wrapper text
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                
                if json_start >= 0 and json_end > json_start:
                    json_str = response[json_start:json_end]
                    classification = json.loads(json_str)
                    document_info["llm_metadata"]["classification"] = classification
                    
                    # Update document metadata with classification results
                    if "metadata" not in document_info:
                        document_info["metadata"] = {}
                    
                    # Add or update industry tags
                    if "industry_tags" not in document_info["metadata"]:
                        document_info["metadata"]["industry_tags"] = []
                    
                    # Add primary industry if not already in tags
                    primary_industry = classification.get("industry_classification", "").lower()
                    if primary_industry and primary_industry not in document_info["metadata"]["industry_tags"]:
                        document_info["metadata"]["industry_tags"].append(primary_industry)
                    
                    # Add secondary industries
                    for industry in classification.get("secondary_industries", []):
                        industry = industry.lower()
                        if industry and industry not in document_info["metadata"]["industry_tags"]:
                            document_info["metadata"]["industry_tags"].append(industry)
                    
                    # Update category if confident
                    if classification.get("confidence_score", 0) >= 0.7:
                        document_info["metadata"]["category"] = classification.get("document_type", "").lower()
                        
                    # Add audience information
                    document_info["metadata"]["audience"] = classification.get("audience", "")
                    
                    # Add document purpose
                    document_info["metadata"]["purpose"] = classification.get("document_purpose", "")
            except json.JSONDecodeError as e:
                self.logger.error(f"Failed to parse LLM classification response as JSON: {str(e)}")
            except Exception as e:
                self.logger.error(f"Error processing classification result: {str(e)}")
        
        return document_info
    
    def _enhance_metadata(self, document_info: Dict) -> Dict:
        """Enhance document metadata using LLM"""
        # Extract content
        content = document_info.get('content', {}).get('full_text', '')
        
        # Get first chunk for context if content is too large
        chunks = document_info.get('chunks', [])
        sample_text = content[:8000]
        if not sample_text and chunks:
            # Use first few chunks if full text not available
            sample_text = "\n\n".join([chunk.get('text', '') for chunk in chunks[:3]])
        
        # If we still don't have sample text, return document as is
        if not sample_text:
            return document_info
        
        # Create prompt for metadata enhancement
        prompt = f"""
You are an expert document analyzer specializing in extracting relevant metadata from RFP documents.

Please analyze this document content and extract the following metadata:

Document content (truncated):
{sample_text}

Extract the following information in JSON format:
{{
  "key_entities": [
    {{
      "name": "Entity name",
      "type": "company|person|product|technology|location|regulation",
      "relevance": "Brief explanation of relevance"
    }}
  ],
  "key_topics": ["List", "of", "key", "topics"],
  "technical_terms": ["List", "of", "important", "technical", "terms"],
  "contains_pricing": true/false,
  "contains_legal_terms": true/false,
  "technical_complexity": "low|medium|high",
  "keywords": ["List", "of", "important", "keywords"],
  "timeline_mentions": ["Any", "date", "or", "time", "mentions"],
  "requirements_present": true/false
}}

Return ONLY the JSON object with no additional text.
"""
        
        # Generate metadata
        response = self.llm_client.generate(prompt, LLMTask.METADATA_ENHANCEMENT)
        
        if response:
            try:
                # Extract JSON from potential wrapper text
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                
                if json_start >= 0 and json_end > json_start:
                    json_str = response[json_start:json_end]
                    enhanced_metadata = json.loads(json_str)
                    
                    # Save the complete LLM metadata
                    document_info["llm_metadata"]["enhanced"] = enhanced_metadata
                    
                    # Update core metadata with selected enhanced data
                    if "metadata" not in document_info:
                        document_info["metadata"] = {}
                    
                    # Update keywords
                    if "keywords" in enhanced_metadata:
                        document_info["metadata"]["keywords"] = enhanced_metadata["keywords"]
                    
                    # Update pricing flag
                    if "contains_pricing" in enhanced_metadata:
                        document_info["metadata"]["contains_pricing"] = enhanced_metadata["contains_pricing"]
                    
                    # Update technical complexity
                    if "technical_complexity" in enhanced_metadata:
                        document_info["metadata"]["technical_level"] = enhanced_metadata["technical_complexity"]
                    
                    # Add entities as structured metadata
                    if "key_entities" in enhanced_metadata:
                        document_info["metadata"]["entities"] = enhanced_metadata["key_entities"]
                    
                    # Add technical terms
                    if "technical_terms" in enhanced_metadata:
                        document_info["metadata"]["technical_terms"] = enhanced_metadata["technical_terms"]
                    
                    # Add timeline mentions
                    if "timeline_mentions" in enhanced_metadata:
                        document_info["metadata"]["timeline_mentions"] = enhanced_metadata["timeline_mentions"]
                    
                    # Set legal document subtype if it contains legal terms
                    if enhanced_metadata.get("contains_legal_terms", False):
                        document_info["metadata"]["document_subtype"] = "legal"
                    
                    # Add requirements flag
                    if "requirements_present" in enhanced_metadata:
                        document_info["metadata"]["contains_requirements"] = enhanced_metadata["requirements_present"]
            except json.JSONDecodeError as e:
                self.logger.error(f"Failed to parse LLM metadata response as JSON: {str(e)}")
            except Exception as e:
                self.logger.error(f"Error processing enhanced metadata: {str(e)}")
        
        return document_info
    
    def _summarize_content(self, document_info: Dict) -> Dict:
        """Generate document summaries using LLM"""
        # Extract content
        content = document_info.get('content', {}).get('full_text', '')
        
        # If content is too large, use chunks
        chunks = document_info.get('chunks', [])
        
        # Initialize summaries
        section_summaries = []
        overall_summary = ""
        
        # If we have chunks, summarize each chunk/section
        if chunks:
            # First generate section summaries
            for i, chunk in enumerate(chunks[:10]):  # Limit to first 10 chunks
                heading = chunk.get('heading', f'Section {i+1}')
                text = chunk.get('text', '')
                
                if len(text) < 100:  # Skip very small chunks
                    continue
                
                # Create prompt for section summarization
                prompt = f"""
You are an expert document analyst specializing in summarizing RFP document sections.

Please summarize the following document section concisely:

Section heading: {heading}

Section content:
{text[:3000]}

Provide a concise summary (2-3 sentences) capturing the key points of this section.
"""
                
                # Generate section summary
                response = self.llm_client.generate(
                    prompt, 
                    LLMTask.CONTENT_SUMMARIZATION,
                    max_tokens=256
                )
                
                if response:
                    section_summaries.append({
                        "heading": heading,
                        "summary": response.strip()
                    })
            
            # Now generate an overall summary using the section summaries
            if section_summaries:
                sections_text = "\n\n".join([
                    f"Section: {item['heading']}\nSummary: {item['summary']}" 
                    for item in section_summaries
                ])
                
                prompt = f"""
You are an expert document analyst specializing in summarizing RFP documents.

Below are summaries of the main sections of a document. Please create an overall summary of the entire document based on these section summaries.

{sections_text}

Provide an executive summary (3-5 sentences) of the entire document, capturing its key purpose and main points.
"""
                
                # Generate overall summary
                overall_summary = self.llm_client.generate(
                    prompt, 
                    LLMTask.CONTENT_SUMMARIZATION,
                    max_tokens=512
                )
        
        # If no chunks or section summaries, try to summarize the whole document
        elif content:
            # Create prompt for document summarization
            prompt = f"""
You are an expert document analyst specializing in summarizing RFP documents.

Please summarize the following document content concisely:

Document content (truncated):
{content[:10000]}

Provide an executive summary (3-5 sentences) capturing the key purpose and main points of this document.
"""
            
            # Generate overall summary
            overall_summary = self.llm_client.generate(
                prompt, 
                LLMTask.CONTENT_SUMMARIZATION,
                max_tokens=512
            )
        
        # Save summaries in document info
        if section_summaries or overall_summary:
            document_info["llm_metadata"]["summaries"] = {
                "overall": overall_summary.strip() if overall_summary else "",
                "sections": section_summaries
            }
            
            # Add executive summary to primary metadata
            if overall_summary:
                if "metadata" not in document_info:
                    document_info["metadata"] = {}
                document_info["metadata"]["executive_summary"] = overall_summary.strip()
        
        return document_info


class LLMTaxonomyEnhancer:
    """Enhance taxonomy generation using LLM"""
    
    def __init__(self, llm_client: LLMClient):
        """
        Initialize taxonomy enhancer
        
        Args:
            llm_client: LLM client instance
        """
        self.llm_client = llm_client
        self.logger = logging.getLogger('LLMTaxonomyEnhancer')
    
    def enhance_taxonomy(self, taxonomy: Dict, document_samples: List[Dict]) -> Dict:
        """
        Enhance taxonomy structure using LLM
        
        Args:
            taxonomy: Existing taxonomy structure
            document_samples: Sample documents to inform taxonomy enhancement
            
        Returns:
            Enhanced taxonomy structure
        """
        # Only proceed if the task is enabled
        if not self.llm_client.config.is_task_enabled(LLMTask.TAXONOMY_GENERATION):
            return taxonomy
        
        # Extract existing taxonomy structure
        industry_types = list(taxonomy.get("industries", {}).keys())
        document_types = list(taxonomy.get("document_types", {}).keys())
        content_types = list(taxonomy.get("content_types", {}).keys())
        topic_areas = list(taxonomy.get("topic_areas", {}).keys())
        
        # Prepare sample document information for the LLM
        doc_samples_text = []
        for i, doc in enumerate(document_samples[:5]):  # Limit to 5 samples
            metadata = doc.get("metadata", {})
            llm_metadata = doc.get("llm_metadata", {})
            
            sample_text = f"Document {i+1}:\n"
            sample_text += f"  Title: {metadata.get('title', 'Unknown')}\n"
            sample_text += f"  Category: {metadata.get('category', 'Unknown')}\n"
            sample_text += f"  Industry tags: {', '.join(metadata.get('industry_tags', []))}\n"
            
            # Add classification if available
            if "classification" in llm_metadata:
                classification = llm_metadata["classification"]
                sample_text += f"  Classified as: {classification.get('document_type', 'Unknown')}\n"
                sample_text += f"  Primary industry: {classification.get('industry_classification', 'Unknown')}\n"
            
            # Add enhanced metadata if available
            if "enhanced" in llm_metadata:
                enhanced = llm_metadata["enhanced"]
                if "key_topics" in enhanced:
                    sample_text += f"  Key topics: {', '.join(enhanced['key_topics'])}\n"
            
            doc_samples_text.append(sample_text)
        
        # Create prompt for taxonomy enhancement
        prompt = f"""
You are an expert taxonomist specializing in RFP document organization systems.

I have an existing taxonomy for RFP documents with the following categories:

Industry Types: {', '.join(industry_types) if industry_types else 'None defined'}
Document Types: {', '.join(document_types) if document_types else 'None defined'}
Content Types: {', '.join(content_types) if content_types else 'None defined'}
Topic Areas: {', '.join(topic_areas[:20]) if topic_areas else 'None defined'}

Here are some sample documents in our collection:

{''.join(doc_samples_text)}

Please enhance this taxonomy by providing:
1. Suggested additional categories that would improve document organization
2. Hierarchical relationships between categories
3. Standardized naming conventions for taxonomy items

Respond in the following JSON format:
{{
  "suggested_additions": {{
    "industries": ["New industry 1", "New industry 2"],
    "document_types": ["New document type 1", "New document type 2"],
    "content_types": ["New content type 1", "New content type 2"],
    "topic_areas": ["New topic 1", "New topic 2"]
  }},
  "hierarchical_structure": {{
    "industries": {{
      "parent_industry": ["child_industry_1", "child_industry_2"]
    }},
    "document_types": {{
      "parent_document_type": ["child_document_type_1", "child_document_type_2"]
    }}
  }},
  "naming_conventions": {{
    "industries": "Suggested naming convention for industries",
    "document_types": "Suggested naming convention for document types",
    "content_types": "Suggested naming convention for content types",
    "topic_areas": "Suggested naming convention for topic areas"
  }}
}}

Return ONLY the JSON object with no additional text.
"""
        
        # Generate taxonomy enhancement
        response = self.llm_client.generate(prompt, LLMTask.TAXONOMY_GENERATION)
        
        if response:
            try:
                # Extract JSON from potential wrapper text
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                
                if json_start >= 0 and json_end > json_start:
                    json_str = response[json_start:json_end]
                    enhancement = json.loads(json_str)
                    
                    # Store the enhancement suggestions in the taxonomy
                    taxonomy["llm_enhancements"] = enhancement
                    
                    # Apply suggested additions if they don't already exist
                    if "suggested_additions" in enhancement:
                        additions = enhancement["suggested_additions"]
                        
                        # Add new industries
                        for industry in additions.get("industries", []):
                            if industry not in taxonomy.get("industries", {}):
                                if "industries" not in taxonomy:
                                    taxonomy["industries"] = {}
                                taxonomy["industries"][industry] = {"count": 0, "subtypes": {}}
                        
                        # Add new document types
                        for doc_type in additions.get("document_types", []):
                            if doc_type not in taxonomy.get("document_types", {}):
                                if "document_types" not in taxonomy:
                                    taxonomy["document_types"] = {}
                                taxonomy["document_types"][doc_type] = {"count": 0, "subtypes": {}}
                        
                        # Add new content types
                        for content_type in additions.get("content_types", []):
                            if content_type not in taxonomy.get("content_types", {}):
                                if "content_types" not in taxonomy:
                                    taxonomy["content_types"] = {}
                                taxonomy["content_types"][content_type] = {"count": 0, "subtypes": {}}
                    
                    # Apply hierarchical structure
                    if "hierarchical_structure" in enhancement:
                        structure = enhancement["hierarchical_structure"]
                        
                        # Apply industry hierarchy
                        for parent, children in structure.get("industries", {}).items():
                            if parent in taxonomy.get("industries", {}):
                                taxonomy["industries"][parent]["subtypes"] = {
                                    child: {"count": 0} for child in children
                                }
                        
                        # Apply document type hierarchy
                        for parent, children in structure.get("document_types", {}).items():
                            if parent in taxonomy.get("document_types", {}):
                                taxonomy["document_types"][parent]["subtypes"] = {
                                    child: {"count": 0} for child in children
                                }
            except json.JSONDecodeError as e:
                self.logger.error(f"Failed to parse LLM taxonomy response as JSON: {str(e)}")
            except Exception as e:
                self.logger.error(f"Error processing taxonomy enhancement: {str(e)}")
        
        return taxonomy


# Example LLM integration with RFP document ingestion system
def integrate_llm_with_ingestion(config_path: str, llm_config_path: str = None) -> None:
    """
    Integrate LLM processing into the RFP document ingestion system
    
    Args:
        config_path: Path to main configuration file
        llm_config_path: Path to LLM configuration file (optional)
    """
    from rfp_document_ingestion import RFPDocumentIngestionSystem
    
    # Initialize LLM components
    llm_config = LLMConfig(llm_config_path)
    llm_client = LLMClient(llm_config)
    document_processor = LLMDocumentProcessor(llm_client)
    taxonomy_enhancer = LLMTaxonomyEnhancer(llm_client)
    
    # Initialize the RFP ingestion system
    ingestion_system = RFPDocumentIngestionSystem(config_path)
    
    # Create a custom document processor function to inject into the ingestion system
    def llm_process_document(document_info):
        """Process document with LLM before final saving"""
        return document_processor.process_document(document_info)
    
    # Create a custom taxonomy enhancer function
    def llm_enhance_taxonomy(taxonomy, processed_documents):
        """Enhance taxonomy with LLM after initial generation"""
        # Sample a subset of documents for taxonomy enhancement
        document_samples = processed_documents[:10] if len(processed_documents) > 10 else processed_documents
        return taxonomy_enhancer.enhance_taxonomy(taxonomy, document_samples)
    
    # Store the original methods to extend
    original_save_processed_document = ingestion_system._save_processed_document
    
    # Override the save method to include LLM processing
    def enhanced_save_processed_document(doc_info):
        """Enhanced document saving with LLM processing"""
        # Process with LLM
        doc_info = llm_process_document(doc_info)
        # Call the original method
        return original_save_processed_document(doc_info)
    
    # Replace the method with our enhanced version
    ingestion_system._save_processed_document = enhanced_save_processed_document
    
    # Store the original taxonomy generation method
    original_generate_taxonomy = ingestion_system.taxonomy.generate_taxonomy
    
    # Override the taxonomy generation method
    def enhanced_generate_taxonomy(documents):
        """Enhanced taxonomy generation with LLM"""
        # Generate the initial taxonomy
        taxonomy = original_generate_taxonomy(documents)
        # Enhance with LLM
        return llm_enhance_taxonomy(taxonomy, documents)
        
    # Replace the method with our enhanced version
    ingestion_system.taxonomy.generate_taxonomy = enhanced_generate_taxonomy
    
    # Run the ingestion process
    processed_count = ingestion_system.ingest_documents()
    
    return processed_count