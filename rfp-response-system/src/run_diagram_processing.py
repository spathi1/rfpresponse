"""
Example usage of the Diagram Processing Module integrated with an RFP document ingestion pipeline.
"""

import os
import logging
from pathlib import Path
from typing import List, Dict, Any

# Import the diagram processing module
from diagram_processing_module import DiagramProcessingModule, DiagramType
from rfp_diagram_integration import RFPDiagramIntegration

# Import the existing document ingestion components (assumed to exist)
from document_ingestion import (
    DocumentInventory, DocumentPreprocessor, MetadataExtractor, 
    CorpusTaxonomy, LLMIntegration, DocumentSearchEngine
)

# Set up logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class RFPIngestionPipeline:
    """Main RFP document ingestion pipeline with diagram processing."""
    
    def __init__(self, config_path: str = "./config"):
        """
        Initialize the RFP ingestion pipeline.
        
        Args:
            config_path: Path to configuration directory
        """
        self.config_path = Path(config_path)
        
        # Ensure configuration directory exists
        os.makedirs(self.config_path, exist_ok=True)
        
        # Initialize pipeline components
        self.inventory = DocumentInventory(config_path=str(self.config_path / "inventory.json"))
        self.preprocessor = DocumentPreprocessor(config_path=str(self.config_path / "preprocessor.json"))
        self.metadata_extractor = MetadataExtractor(config_path=str(self.config_path / "metadata.json"))
        self.taxonomy = CorpusTaxonomy(config_path=str(self.config_path / "taxonomy.json"))
        self.llm_integration = LLMIntegration(config_path=str(self.config_path / "llm.json"))
        self.search_engine = DocumentSearchEngine(config_path=str(self.config_path / "search.json"))
        
        # Initialize diagram processing integration
        self.diagram_integration = RFPDiagramIntegration(
            config_path=str(self.config_path / "diagram_processing.json")
        )
        
        # Connect diagram processing with other components
        self.diagram_integration.integrate_with_pipeline(
            self.inventory, 
            self.preprocessor, 
            self.metadata_extractor, 
            self.taxonomy, 
            self.llm_integration
        )
        
        logger.info("Initialized RFP ingestion pipeline with diagram processing")
    
    def process_document(self, document_path: str) -> str:
        """
        Process a single document through the pipeline.
        
        Args:
            document_path: Path to the document file
            
        Returns:
            Document ID
        """
        # 1. Add document to inventory
        document_id = self.inventory.add_document(document_path)
        
        # 2. Preprocess document (extracts text and diagrams)
        document_data = self.preprocessor.process_document(document_path, document_id)
        
        # 3. Extract metadata
        metadata = self.metadata_extractor.extract_metadata(document_data)
        
        # 4. Organize in taxonomy
        self.taxonomy.categorize_document(document_id, metadata)
        
        # 5. Enhance with LLM
        enhanced_data = self.llm_integration.enhance_document(document_id, document_data, metadata)
        
        # 6. Index for search
        self.search_engine.index_document(document_id, enhanced_data)
        
        logger.info(f"Processed document {document_id} ({document_path})")
        
        return document_id
    
    def process_batch(self, document_paths: List[str]) -> List[str]:
        """
        Process a batch of documents.
        
        Args:
            document_paths: List of paths to document files
            
        Returns:
            List of document IDs
        """
        document_ids = []
        
        for document_path in document_paths:
            try:
                document_id = self.process_document(document_path)
                document_ids.append(document_id)
            except Exception as e:
                logger.error(f"Error processing document {document_path}: {e}")
        
        return document_ids
    
    def search(self, query: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """
        Search for documents and diagrams matching a query.
        
        Args:
            query: Search query
            top_k: Number of results to return
            
        Returns:
            List of search results
        """
        # Search for documents
        document_results = self.search_engine.search(query, top_k)
        
        # Search for diagrams
        diagram_results = self.diagram_integration.search_diagrams(query, top_k)
        
        # Combine and rank results
        # This is a simplified approach - in a real system you might want more sophisticated ranking
        combined_results = []
        
        # Add document results
        for result in document_results:
            combined_results.append({
                "type": "document",
                "score": result.get("score", 0),
                "data": result
            })
        
        # Add diagram results
        for result in diagram_results:
            combined_results.append({
                "type": "diagram",
                "score": result.get("score", 0),
                "data": result
            })
        
        # Sort by score (descending)
        combined_results.sort(key=lambda x: x.get("score", 0), reverse=True)
        
        # Return top results
        return combined_results[:top_k]
    
    def get_diagram_insights(self, document_id: str) -> Dict[str, Any]:
        """
        Get insights from diagrams in a document.
        
        Args:
            document_id: Document ID
            
        Returns:
            Dictionary with diagram insights
        """
        # Get diagrams for the document
        diagrams = self.diagram_integration.diagram_processor.get_diagrams_by_document(document_id)
        
        if not diagrams:
            return {"document_id": document_id, "diagram_count": 0, "insights": []}
        
        # Collect insights
        insights = []
        diagram_types = {}
        
        for diagram_data in diagrams:
            metadata = diagram_data.get("metadata", {})
            
            # Count diagram types
            diagram_type = metadata.get("diagram_type", "unknown")
            diagram_types[diagram_type] = diagram_types.get(diagram_type, 0) + 1
            
            # Collect descriptions and other metadata
            insight = {
                "diagram_id": metadata.get("diagram_id", ""),
                "type": diagram_type,
                "description": metadata.get("description", ""),
                "tags": metadata.get("tags", []),
                "has_structured_representation": self.diagram_integration.diagram_processor.get_structured_representation(
                    metadata.get("diagram_id", "")
                ) is not None
            }
            
            insights.append(insight)
        
        return {
            "document_id": document_id,
            "diagram_count": len(diagrams),
            "diagram_types": diagram_types,
            "insights": insights
        }

def main():
    """Main function to demonstrate usage."""
    # Initialize the pipeline
    pipeline = RFPIngestionPipeline()
    
    # Example document paths
    documents = [
        "./data/rfps/cloud_infrastructure_rfp.pdf",
        "./data/rfps/security_services_rfp.docx",
        "./data/rfps/data_analytics_platform_rfp.pptx"
    ]
    
    # Process documents
    document_ids = pipeline.process_batch(documents)
    
    # Search for documents and diagrams
    search_results = pipeline.search("network security architecture")
    
    print(f"Found {len(search_results)} results for 'network security architecture'")
    
    # Get insights for a document
    if document_ids:
        insights = pipeline.get_diagram_insights(document_ids[0])
        print(f"Document {document_ids[0]} has {insights['diagram_count']} diagrams")
        
        # Print diagram types
        print("Diagram types:")
        for diagram_type, count in insights.get("diagram_types", {}).items():
            print(f"  - {diagram_type}: {count}")

if __name__ == "__main__":
    main()
