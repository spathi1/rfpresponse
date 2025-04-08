import os
import logging
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path

from rag_system import RAGSystem

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RAGIntegration:
    """
    Integrates the Retrieval-Augmented Generation (RAG) system with the main RFP response system.
    """
    
    def __init__(self, rag_config_path: Optional[str] = None, kg_config_path: Optional[str] = None):
        """
        Initialize the RAG integration module.
        
        Args:
            rag_config_path: Path to RAG configuration file (optional)
            kg_config_path: Path to knowledge graph configuration file (optional)
        """
        # Initialize RAG system
        self.rag_system = RAGSystem(rag_config_path, kg_config_path)
        
        # Track integration points
        self.document_inventory = None
        self.document_preprocessor = None
        self.response_generator = None
        
        logger.info("Initialized RAG Integration")
    
    def integrate_with_pipeline(self, 
                              inventory,
                              preprocessor,
                              response_generator):
        """
        Connect with components of the existing pipeline.
        
        Args:
            inventory: Document inventory component
            preprocessor: Document preprocessor component
            response_generator: Response generator component
        """
        self.document_inventory = inventory
        self.document_preprocessor = preprocessor
        self.response_generator = response_generator
        
        # Register hooks
        self._register_document_hooks()
        self._register_response_hooks()
        
        logger.info("RAG system integrated with pipeline")
    
    def _register_document_hooks(self):
        """Register hooks for document processing"""
        if self.document_preprocessor:
            # Register post-processing hook to index documents
            self.document_preprocessor.register_post_process_hook(self._index_document)
            logger.info("Registered document indexing hook")
    
    def _register_response_hooks(self):
        """Register hooks for response generation"""
        if self.response_generator:
            # Register pre-generation hook to retrieve relevant context
            self.response_generator.register_pre_generation_hook(self._retrieve_context)
            logger.info("Registered context retrieval hook")
    
    def _index_document(self, document):
        """
        Hook to index a document after preprocessing.
        
        Args:
            document: Processed document object
            
        Returns:
            The document (unchanged)
        """
        try:
            # Extract document ID and content
            doc_id = document.get("id", str(hash(document.get("filename", ""))))
            
            # Combine all section content
            content = ""
            for section in document.get("sections", []):
                section_title = section.get("title", "")
                section_content = section.get("content", "")
                content += f"{section_title}\n{section_content}\n\n"
            
            # Extract metadata
            metadata = document.get("metadata", {})
            
            # Index the document
            self.rag_system.index_document(doc_id, content, metadata)
            
            logger.info(f"Indexed document: {doc_id}")
            
        except Exception as e:
            logger.error(f"Error indexing document: {str(e)}")
        
        # Return document unchanged
        return document
    
    def _retrieve_context(self, query, response_params):
        """
        Hook to retrieve context before generating a response.
        
        Args:
            query: The query or RFP section to respond to
            response_params: Parameters for response generation
            
        Returns:
            Updated response parameters with context
        """
        try:
            # Get top_k from params or use default
            top_k = response_params.get("top_k", 5)
            
            # Retrieve relevant documents
            context = self.rag_system.retrieve(query, top_k)
            
            # Add context to response parameters
            response_params["context"] = context
            
            logger.info(f"Retrieved {len(context)} relevant documents for context")
            
        except Exception as e:
            logger.error(f"Error retrieving context: {str(e)}")
        
        return response_params
    
    def generate_response(self, query: str, top_k: int = 5) -> str:
        """
        Generate a response to a query using the RAG system.
        
        Args:
            query: The query to respond to
            top_k: Number of relevant documents to retrieve
            
        Returns:
            Generated response
        """
        return self.rag_system.generate_response(query, top_k=top_k)
    
    def save_state(self):
        """Save the current state of the RAG system"""
        return self.rag_system.save()
    
    def search_documents(self, query: str, top_k: int = 10) -> List[Dict]:
        """
        Search for documents relevant to a query.
        
        Args:
            query: Search query
            top_k: Maximum number of results to return
            
        Returns:
            List of relevant documents with similarity scores
        """
        return self.rag_system.retrieve(query, top_k)


# Example usage
def example_usage():
    """Example usage of the RAG Integration."""
    
    # Initialize RAG integration
    rag_integration = RAGIntegration("config/rag_config.json", "config/kg_config.json")
    
    # Example: Integrate with pipeline components (placeholder)
    from document_inventory import DocumentInventory
    from document_preprocessor import DocumentPreprocessor
    from response_generator import ResponseGenerator
    
    inventory = DocumentInventory()
    preprocessor = DocumentPreprocessor()
    response_generator = ResponseGenerator()
    
    # Connect with existing pipeline
    rag_integration.integrate_with_pipeline(
        inventory, preprocessor, response_generator
    )
    
    # Example: Generate a response to an RFP query
    query = "What experience does your company have with cloud migration projects?"
    response = rag_integration.generate_response(query)
    print(f"Response: {response}")
    
    # Example: Search for relevant documents
    results = rag_integration.search_documents("security compliance requirements")
    for i, doc in enumerate(results):
        print(f"Result {i+1}: {doc['document_id']} (Score: {doc['similarity']:.2f})")
    
    # Save the RAG system state
    rag_integration.save_state()


if __name__ == "__main__":
    example_usage()