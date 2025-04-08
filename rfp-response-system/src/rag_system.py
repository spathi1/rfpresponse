import os
import json
import logging
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
import pickle
from datetime import datetime

from knowledge_graph import RFPKnowledgeGraph

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RAGSystem:
    """Retrieval-Augmented Generation system for RFP responses"""
    
    def __init__(self, config_path: str = None, kg_config_path: str = None):
        """Initialize the RAG system
        
        Args:
            config_path: Path to RAG configuration file
            kg_config_path: Path to knowledge graph configuration file
        """
        # Load configuration
        self.config = self._load_config(config_path)
        
        # Initialize knowledge graph
        self.kg = RFPKnowledgeGraph(kg_config_path)
        
        # Initialize embedding model
        self.embedding_model = SentenceTransformer(self.config["embedding_model"])
        
        # Initialize vector index
        self.index = self._initialize_index()
        
        # Initialize document store
        self.document_store = self._initialize_document_store()
        
        logger.info("RAG system initialized successfully")
    
    def _load_config(self, config_path: Optional[str]) -> Dict:
        """Load configuration from file"""
        default_config = {
            "embedding_model": "all-MiniLM-L6-v2",
            "index_path": "data/vector_index",
            "document_store_path": "data/document_store.pkl",
            "retrieval": {
                "top_k": 5,
                "similarity_threshold": 0.7,
                "use_knowledge_graph": True,
                "rerank_results": True
            },
            "generation": {
                "model": "together/llama-3-70b-instruct",
                "temperature": 0.7,
                "max_tokens": 1024,
                "use_few_shot": True,
                "few_shot_examples": 3
            }
        }
        
        if not config_path:
            logger.info("Using default RAG configuration")
            return default_config
        
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
                logger.info(f"Loaded RAG configuration from {config_path}")
                # Merge with defaults for any missing keys
                merged_config = {**default_config, **config}
                return merged_config
        except Exception as e:
            logger.warning(f"Failed to load config from {config_path}: {str(e)}")
            logger.info("Using default RAG configuration")
            return default_config
    
    def _initialize_index(self) -> Any:
        """Initialize or load vector index"""
        index_path = self.config["index_path"]
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(index_path), exist_ok=True)
        
        # Check if index exists
        index_file = os.path.join(index_path, "faiss_index.bin")
        if os.path.exists(index_file):
            try:
                logger.info(f"Loading existing vector index from {index_file}")
                return faiss.read_index(index_file)
            except Exception as e:
                logger.warning(f"Failed to load index: {str(e)}")
        
        # Create new index
        logger.info("Creating new vector index")
        dimension = self.embedding_model.get_sentence_embedding_dimension()
        index = faiss.IndexFlatL2(dimension)
        return index
    
    def _initialize_document_store(self) -> Dict:
        """Initialize or load document store"""
        store_path = self.config["document_store_path"]
        
        if os.path.exists(store_path):
            try:
                logger.info(f"Loading existing document store from {store_path}")
                with open(store_path, 'rb') as f:
                    return pickle.load(f)
            except Exception as e:
                logger.warning(f"Failed to load document store: {str(e)}")
        
        logger.info("Creating new document store")
        return {
            "documents": {},
            "metadata": {},
            "last_updated": datetime.now().isoformat()
        }
    
    def index_document(self, document_id: str, content: str, metadata: Dict = None) -> bool:
        """Index a document for retrieval
        
        Args:
            document_id: Unique identifier for the document
            content: Text content to index
            metadata: Additional metadata about the document
            
        Returns:
            Success status
        """
        try:
            # Generate embedding
            embedding = self.embedding_model.encode([content])[0]
            
            # Add to index
            self.index.add(np.array([embedding], dtype=np.float32))
            
            # Store document and metadata
            doc_index = len(self.document_store["documents"])
            self.document_store["documents"][doc_index] = {
                "id": document_id,
                "content": content,
                "embedding_id": doc_index
            }
            
            if metadata:
                self.document_store["metadata"][doc_index] = metadata
            
            # Update knowledge graph
            if self.config["retrieval"]["use_knowledge_graph"]:
                self.kg.add_document(document_id, content, metadata)
            
            logger.info(f"Indexed document {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to index document {document_id}: {str(e)}")
            return False
    
    def retrieve(self, query: str, top_k: int = None) -> List[Dict]:
        """Retrieve relevant documents for a query
        
        Args:
            query: Query text
            top_k: Number of results to return (defaults to config value)
            
        Returns:
            List of retrieved documents with relevance scores
        """
        if top_k is None:
            top_k = self.config["retrieval"]["top_k"]
        
        try:
            # Generate query embedding
            query_embedding = self.embedding_model.encode([query])[0]
            
            # Search index
            distances, indices = self.index.search(
                np.array([query_embedding], dtype=np.float32), 
                top_k
            )
            
            # Get documents
            results = []
            for i, idx in enumerate(indices[0]):
                if idx != -1:  # Valid index
                    doc = self.document_store["documents"].get(int(idx))
                    if doc:
                        # Convert distance to similarity score (1 - normalized distance)
                        similarity = 1 - (distances[0][i] / 100)  # Normalize
                        
                        # Skip if below threshold
                        if similarity < self.config["retrieval"]["similarity_threshold"]:
                            continue
                            
                        results.append({
                            "document_id": doc["id"],
                            "content": doc["content"],
                            "similarity": similarity,
                            "metadata": self.document_store["metadata"].get(int(idx), {})
                        })
            
            # Enhance with knowledge graph if enabled
            if self.config["retrieval"]["use_knowledge_graph"]:
                kg_results = self.kg.query(query, top_k)
                
                # Merge results
                for kg_doc in kg_results:
                    # Check if already in results
                    if not any(r["document_id"] == kg_doc["document_id"] for r in results):
                        results.append(kg_doc)
            
            # Sort by similarity
            results = sorted(results, key=lambda x: x["similarity"], reverse=True)
            
            # Limit to top_k
            return results[:top_k]
            
        except Exception as e:
            logger.error(f"Retrieval error: {str(e)}")
            return []
    
    def generate_response(self, query: str, context: List[Dict] = None) -> str:
        """Generate a response to a query using retrieved context
        
        Args:
            query: User query
            context: Optional pre-retrieved context
            
        Returns:
            Generated response
        """
        try:
            # Retrieve context if not provided
            if context is None:
                context = self.retrieve(query)
            
            # Format context for the prompt
            context_text = "\n\n".join([
                f"Document {i+1} ({doc['document_id']}):\n{doc['content']}"
                for i, doc in enumerate(context)
            ])
            
            # TODO: Implement LLM integration for response generation
            # This would connect to an LLM API like Together.ai
            
            # Placeholder for now
            return f"Generated response based on {len(context)} retrieved documents"
            
        except Exception as e:
            logger.error(f"Generation error: {str(e)}")
            return "Failed to generate response due to an error."
    
    def save(self) -> bool:
        """Save the RAG system state to disk"""
        try:
            # Save index
            index_path = self.config["index_path"]
            os.makedirs(os.path.dirname(index_path), exist_ok=True)
            index_file = os.path.join(index_path, "faiss_index.bin")
            faiss.write_index(self.index, index_file)
            
            # Save document store
            self.document_store["last_updated"] = datetime.now().isoformat()
            with open(self.config["document_store_path"], 'wb') as f:
                pickle.dump(self.document_store, f)
            
            # Save knowledge graph
            self.kg.save()
            
            logger.info("RAG system state saved successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save RAG system state: {str(e)}")
            return False
