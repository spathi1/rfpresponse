"""
Integration of the Diagram Processing Module with the Existing RFP Document Ingestion Pipeline.

This module provides the integration points, configuration, and usage examples for connecting
the Diagram Processing Module with the existing document ingestion components.
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional
from pathlib import Path

# Import the core diagram processing module
from diagram_processing_module import (
    DiagramProcessingModule, DiagramType, DiagramMetadata, DiagramContext
)

# Import existing document ingestion components (assumed structure)
from document_ingestion import (
    DocumentInventory, DocumentPreprocessor, MetadataExtractor, 
    CorpusTaxonomy, LLMIntegration
)

# Logging configuration
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DiagramProcessingConfig:
    """Configuration management for the Diagram Processing Module."""
    
    DEFAULT_CONFIG = {
        "storage_path": "./data/diagram_storage",
        "temp_path": "./data/temp",
        "ocr_engine": "tesseract",
        "enable_structured_conversion": True,
        "embedding_model": "all-MiniLM-L6-v2",
        "llm": {
            "type": "together",
            "api_key": "",  # To be loaded from environment or secure storage
            "model_name": "together/llama-3-70b-instruct",
            "vision_model": "Qwen/Qwen-VL-Chat"
        },
        "indexing": {
            "auto_reindex": True,
            "index_batch_size": 50,
            "embedding_dimension": 384
        },
        "integration": {
            "extract_during_preprocessing": True,
            "enhance_document_metadata": True,
            "index_diagrams_with_text": True,
            "store_structured_representations": True
        }
    }
    
    @classmethod
    def load_config(cls, config_path: Optional[str] = None, env_prefix: str = "DIAGRAM_") -> Dict[str, Any]:
        """
        Load configuration from file and/or environment variables.
        
        Args:
            config_path: Path to JSON configuration file (optional)
            env_prefix: Prefix for environment variables to override config
            
        Returns:
            Configuration dictionary
        """
        # Start with default config
        config = cls.DEFAULT_CONFIG.copy()
        
        # Load from config file if provided
        if config_path and Path(config_path).exists():
            try:
                with open(config_path, 'r') as f:
                    file_config = json.load(f)
                    # Recursively update config
                    cls._update_nested_dict(config, file_config)
                logger.info(f"Loaded configuration from {config_path}")
            except Exception as e:
                logger.error(f"Error loading config from {config_path}: {e}")
        
        # Override with environment variables
        cls._update_from_env(config, env_prefix)
        
        # Ensure API keys are loaded from environment if not in config
        if not config["llm"]["api_key"]:
            if config["llm"]["type"] == "together":
                config["llm"]["api_key"] = os.environ.get("TOGETHER_API_KEY", "")
            elif config["llm"]["type"] == "private":
                config["llm"]["api_key"] = os.environ.get("PRIVATE_LLM_API_KEY", "")
                
        return config
    
    @staticmethod
    def _update_nested_dict(d: Dict, u: Dict) -> Dict:
        """Recursively update a nested dictionary."""
        for k, v in u.items():
            if isinstance(v, dict) and k in d and isinstance(d[k], dict):
                d[k] = DiagramProcessingConfig._update_nested_dict(d[k], v)
            else:
                d[k] = v
        return d
    
    @staticmethod
    def _update_from_env(config: Dict, prefix: str, path: str = ""):
        """
        Update configuration from environment variables.
        
        Environment variables should be in the format:
        PREFIX_KEY or PREFIX_SECTION_KEY for nested configs
        """
        for k, v in list(config.items()):
            env_key = f"{prefix}{path}{'_' if path else ''}{k}".upper()
            
            if isinstance(v, dict):
                # Recurse into nested dicts
                DiagramProcessingConfig._update_from_env(v, prefix, f"{path}{'_' if path else ''}{k}")
            else:
                # Update from environment if exists
                if env_key in os.environ:
                    env_val = os.environ[env_key]
                    
                    # Type conversion based on current type
                    if isinstance(v, bool):
                        config[k] = env_val.lower() in ('true', 'yes', 'y', '1')
                    elif isinstance(v, int):
                        config[k] = int(env_val)
                    elif isinstance(v, float):
                        config[k] = float(env_val)
                    else:
                        config[k] = env_val
                    
                    logger.debug(f"Updated config {k} from environment variable {env_key}")
    
    @staticmethod
    def save_config(config: Dict[str, Any], config_path: str):
        """
        Save configuration to a file.
        
        Args:
            config: Configuration dictionary
            config_path: Path to save the configuration
        """
        try:
            os.makedirs(os.path.dirname(config_path), exist_ok=True)
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=2)
            logger.info(f"Saved configuration to {config_path}")
        except Exception as e:
            logger.error(f"Error saving config to {config_path}: {e}")

class RFPDiagramIntegration:
    """
    Integrates the Diagram Processing Module with the existing RFP ingestion pipeline.
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the integration module.
        
        Args:
            config_path: Path to configuration file (optional)
        """
        # Load configuration
        self.config = DiagramProcessingConfig.load_config(config_path)
        
        # Initialize diagram processing module
        self.diagram_processor = DiagramProcessingModule(self.config)
        
        # Track integration points
        self.document_inventory = None
        self.document_preprocessor = None
        self.metadata_extractor = None
        self.corpus_taxonomy = None
        self.llm_integration = None
        
        logger.info("Initialized RFP Diagram Integration")
        
    def integrate_with_pipeline(self, 
                              inventory: DocumentInventory,
                              preprocessor: DocumentPreprocessor,
                              metadata_extractor: MetadataExtractor,
                              taxonomy: CorpusTaxonomy,
                              llm: LLMIntegration):
        """
        Connect with all components of the existing pipeline.
        
        Args:
            inventory: Document inventory component
            preprocessor: Document preprocessor component
            metadata_extractor: Metadata extractor component
            taxonomy: Corpus taxonomy component
            llm: LLM integration component
        """
        self.document_inventory = inventory
        self.document_preprocessor = preprocessor
        self.metadata_extractor = metadata_extractor
        self.corpus_taxonomy = taxonomy
        self.llm_integration = llm
        
        # Register callbacks and hooks
        self._register_preprocessor_hook()
        self._register_metadata_hook()
        self._register_taxonomy_hook()
        self._register_search_integration()
        
        logger.info("Integrated diagram processing with all pipeline components")
    
    def _register_preprocessor_hook(self):
        """Register hook with the document preprocessor."""
        if self.config["integration"]["extract_during_preprocessing"]:
            self.document_preprocessor.register_post_processing_hook(
                self._extract_diagrams_hook
            )
            logger.info("Registered diagram extraction hook with document preprocessor")
    
    def _register_metadata_hook(self):
        """Register hook with the metadata extractor."""
        if self.config["integration"]["enhance_document_metadata"]:
            self.metadata_extractor.register_metadata_enhancer(
                self._enhance_metadata_with_diagrams
            )
            logger.info("Registered diagram metadata enhancer with metadata extractor")
    
    def _register_taxonomy_hook(self):
        """Register hook with the corpus taxonomy."""
        if self.config["integration"]["store_structured_representations"]:
            self.corpus_taxonomy.register_content_processor(
                self._process_structured_representations
            )
            logger.info("Registered structured diagram processor with corpus taxonomy")
    
    def _register_search_integration(self):
        """Register diagram search with the existing search infrastructure."""
        if self.config["integration"]["index_diagrams_with_text"]:
            # This will depend on the specific search implementation
            # Placeholder for search integration
            logger.info("Registered diagram search with the search infrastructure")
    
    def _extract_diagrams_hook(self, document_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Hook for extracting diagrams during document preprocessing.
        
        Args:
            document_data: Document data dictionary
            
        Returns:
            Updated document data with diagram information
        """
        document_path = document_data.get("file_path")
        document_id = document_data.get("id")
        
        if not document_path or not document_id:
            logger.warning("Cannot process document: missing path or ID")
            return document_data
        
        try:
            # Process the document to extract diagrams
            diagram_ids = self.diagram_processor.process_document(document_path, document_id)
            
            # Add diagram IDs to the document data
            document_data["diagram_ids"] = diagram_ids
            document_data["diagram_count"] = len(diagram_ids)
            
            logger.info(f"Extracted {len(diagram_ids)} diagrams from document {document_id}")
            
        except Exception as e:
            logger.error(f"Error extracting diagrams from document {document_id}: {e}")
            document_data["diagram_ids"] = []
            document_data["diagram_count"] = 0
        
        return document_data
    
    def _enhance_metadata_with_diagrams(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enhance document metadata with diagram information.
        
        Args:
            metadata: Document metadata dictionary
            
        Returns:
            Enhanced metadata dictionary
        """
        document_id = metadata.get("id")
        if not document_id:
            return metadata
        
        diagram_ids = metadata.get("diagram_ids", [])
        if not diagram_ids:
            return metadata
        
        # Get diagram information
        diagram_summaries = []
        
        for diagram_id in diagram_ids:
            diagram_data = self.diagram_processor.get_diagram_by_id(diagram_id)
            if diagram_data and "metadata" in diagram_data:
                diagram_meta = diagram_data["metadata"]
                
                summary = {
                    "id": diagram_id,
                    "type": diagram_meta.get("diagram_type", "unknown"),
                    "description": diagram_meta.get("description", ""),
                    "tags": diagram_meta.get("tags", []),
                    "page": diagram_meta.get("context", {}).get("page_number", 0)
                }
                
                diagram_summaries.append(summary)
        
        # Add diagram summaries to metadata
        metadata["diagrams"] = diagram_summaries
        
        # Add diagram types summary
        diagram_types = {}
        for summary in diagram_summaries:
            diagram_type = summary.get("type")
            if diagram_type:
                diagram_types[diagram_type] = diagram_types.get(diagram_type, 0) + 1
                
        metadata["diagram_type_counts"] = diagram_types
        
        logger.info(f"Enhanced metadata for document {document_id} with {len(diagram_summaries)} diagram summaries")
        return metadata
    
    def _process_structured_representations(self, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process structured representations for inclusion in the corpus.
        
        Args:
            content_data: Content data dictionary
            
        Returns:
            Updated content data
        """
        document_id = content_data.get("document_id")
        if not document_id:
            return content_data
        
        # Get diagrams for this document
        diagrams = self.diagram_processor.get_diagrams_by_document(document_id)
        
        structured_representations = []
        
        for diagram_data in diagrams:
            diagram_id = diagram_data.get("metadata", {}).get("diagram_id")
            if not diagram_id:
                continue
                
            # Get structured representation
            structured_repr = self.diagram_processor.get_structured_representation(diagram_id)
            
            if structured_repr:
                representation = {
                    "diagram_id": diagram_id,
                    "type": diagram_data.get("metadata", {}).get("diagram_type"),
                    "representation": structured_repr,
                    "format": "mermaid"  # Currently only supporting Mermaid
                }
                
                structured_representations.append(representation)
        
        # Add structured representations to content data
        content_data["structured_diagrams"] = structured_representations
        
        logger.info(f"Added {len(structured_representations)} structured diagram representations to document {document_id}")
        return content_data
    
    def search_diagrams(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Search for diagrams matching a query.
        
        Args:
            query: Search query
            top_k: Number of results to return
            
        Returns:
            List of diagram search results
        """
        return self.diagram_processor.search_diagrams(query, top_k)
    
    def get_diagram_with_context(self, diagram_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a diagram with its full document context.
        
        Args:
            diagram_id: ID of the diagram
            
        Returns:
            Dictionary with diagram and document context
        """
        diagram_data = self.diagram_processor.get_diagram_by_id(diagram_id)
        if not diagram_data:
            return None
            
        document_id = diagram_data.get("metadata", {}).get("document_id")
        if not document_id:
            return diagram_data
            
        # Get document metadata (if available)
        document_metadata = {}
        if self.metadata_extractor:
            document_metadata = self.metadata_extractor.get_metadata(document_id) or {}
            
        # Add document context to the result
        result = diagram_data.copy()
        result["document"] = {
            "id": document_id,
            "metadata": document_metadata
        }
        
        return result
    
    def get_diagram_types_summary(self) -> Dict[str, int]:
        """
        Get a summary of diagram types across all documents.
        
        Returns:
            Dictionary mapping diagram types to counts
        """
        # This would require a scan of all diagrams
        # Placeholder implementation
        return {}

# Example usage
def example_usage():
    """Example usage of the Diagram Processing Integration."""
    
    # Initialize existing pipeline components (placeholder)
    inventory = DocumentInventory()
    preprocessor = DocumentPreprocessor()
    metadata_extractor = MetadataExtractor()
    taxonomy = CorpusTaxonomy()
    llm_integration = LLMIntegration()
    
    # Initialize and integrate diagram processing
    diagram_integration = RFPDiagramIntegration("config/diagram_processing.json")
    
    # Connect with existing pipeline
    diagram_integration.integrate_with_pipeline(
        inventory, preprocessor, metadata_extractor, taxonomy, llm_integration
    )
    
    # Example: Process a document
    document_data = {
        "id": "rfp-2023-001",
        "file_path": "/path/to/rfp.pdf",
        "title": "Cloud Infrastructure RFP"
    }
    
    # This would typically be called by the preprocessor
    processed_data = diagram_integration._extract_diagrams_hook(document_data)
    
    print(f"Processed document with {processed_data.get('diagram_count', 0)} diagrams")
    
    # Example: Search for diagrams
    results = diagram_integration.search_diagrams("network architecture")
    
    print(f"Found {len(results)} diagrams matching 'network architecture'")
    
    for result in results:
        print(f"- {result.get('metadata', {}).get('description', '')}")

if __name__ == "__main__":
    example_usage()
