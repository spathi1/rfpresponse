import networkx as nx
import spacy
import json
from typing import Dict, List, Any, Optional, Tuple
import logging
from pathlib import Path
import pandas as pd
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RFPKnowledgeGraph:
    """Knowledge graph for RFP documents and responses"""
    
    def __init__(self, config_path: str = None):
        """Initialize the knowledge graph
        
        Args:
            config_path: Path to configuration file
        """
        # Load configuration
        self.config = self._load_config(config_path)
        
        # Initialize graph
        self.graph = nx.DiGraph()
        
        # Initialize NLP
        try:
            self.nlp = spacy.load("en_core_web_lg")
            logger.info("Loaded spaCy model: en_core_web_lg")
        except:
            logger.warning("Could not load en_core_web_lg, downloading...")
            spacy.cli.download("en_core_web_lg")
            self.nlp = spacy.load("en_core_web_lg")
        
        # Load existing graph if available
        self.graph_path = Path(self.config.get("graph_storage_path", "data/knowledge_graph.gpickle"))
        if self.graph_path.exists():
            self._load_graph()
    
    def _load_config(self, config_path: Optional[str]) -> Dict:
        """Load configuration from file"""
        default_config = {
            "graph_storage_path": "data/knowledge_graph.gpickle",
            "entity_types": ["ORG", "PRODUCT", "GPE", "TECHNOLOGY", "REQUIREMENT"],
            "relationship_types": ["REQUIRES", "MENTIONS", "ADDRESSES", "SIMILAR_TO", "PART_OF"],
            "custom_entities": {
                "TECHNOLOGY": ["cloud", "AI", "machine learning", "blockchain", "IoT"],
                "REQUIREMENT": ["must", "shall", "required", "mandatory"]
            },
            "similarity_threshold": 0.75
        }
        
        if not config_path:
            return default_config
        
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
                # Merge with defaults
                for key, value in default_config.items():
                    if key not in config:
                        config[key] = value
            return config
        except Exception as e:
            logger.error(f"Error loading config: {str(e)}")
            return default_config
    
    def _load_graph(self):
        """Load existing graph from storage"""
        try:
            self.graph = nx.read_gpickle(self.graph_path)
            logger.info(f"Loaded existing graph with {len(self.graph.nodes)} nodes and {len(self.graph.edges)} edges")
        except Exception as e:
            logger.error(f"Error loading graph: {str(e)}")
            self.graph = nx.DiGraph()
    
    def save_graph(self):
        """Save graph to storage"""
        try:
            # Create directory if it doesn't exist
            self.graph_path.parent.mkdir(parents=True, exist_ok=True)
            
            nx.write_gpickle(self.graph, self.graph_path)
            logger.info(f"Saved graph with {len(self.graph.nodes)} nodes and {len(self.graph.edges)} edges")
        except Exception as e:
            logger.error(f"Error saving graph: {str(e)}")
    
    def process_rfp(self, rfp_document: Dict) -> str:
        """Process an RFP document and add to knowledge graph
        
        Args:
            rfp_document: Dictionary containing RFP document data
            
        Returns:
            ID of the RFP node in the graph
        """
        # Create RFP node
        rfp_id = f"rfp_{rfp_document.get('id', str(hash(rfp_document.get('filename', ''))))}"
        
        self.graph.add_node(rfp_id, 
                           type="RFP",
                           title=rfp_document.get("title", ""),
                           date=rfp_document.get("date", datetime.now().isoformat()),
                           client=rfp_document.get("client", ""),
                           metadata=rfp_document.get("metadata", {}))
        
        # Extract sections
        sections = rfp_document.get("sections", [])
        
        # Process each section
        for i, section in enumerate(sections):
            section_id = f"{rfp_id}_section_{i}"
            section_title = section.get("title", f"Section {i}")
            section_content = section.get("content", "")
            
            # Add section node
            self.graph.add_node(section_id,
                               type="SECTION",
                               title=section_title,
                               content=section_content[:500])  # Store preview of content
            
            # Connect section to RFP
            self.graph.add_edge(rfp_id, section_id, relationship="CONTAINS")
            
            # Extract entities and requirements
            self._extract_entities(section_id, section_content)
            self._extract_requirements(section_id, section_content)
        
        # Find similar RFPs
        self._find_similar_rfps(rfp_id)
        
        # Save updated graph
        self.save_graph()
        
        return rfp_id
    
    def process_response(self, response_document: Dict, related_rfp_id: Optional[str] = None) -> str:
        """Process a response document and add to knowledge graph
        
        Args:
            response_document: Dictionary containing response document data
            related_rfp_id: ID of the related RFP in the graph (optional)
            
        Returns:
            ID of the response node in the graph
        """
        # Create response node
        response_id = f"response_{response_document.get('id', str(hash(response_document.get('filename', ''))))}"
        
        self.graph.add_node(response_id, 
                           type="RESPONSE",
                           title=response_document.get("title", ""),
                           date=response_document.get("date", datetime.now().isoformat()),
                           client=response_document.get("client", ""),
                           outcome=response_document.get("outcome", "unknown"),
                           metadata=response_document.get("metadata", {}))
        
        # Link to RFP if provided
        if related_rfp_id and related_rfp_id in self.graph:
            self.graph.add_edge(response_id, related_rfp_id, relationship="RESPONDS_TO")
        
        # Extract sections
        sections = response_document.get("sections", [])
        
        # Process each section
        for i, section in enumerate(sections):
            section_id = f"{response_id}_section_{i}"
            section_title = section.get("title", f"Section {i}")
            section_content = section.get("content", "")
            
            # Add section node
            self.graph.add_node(section_id,
                               type="SECTION",
                               title=section_title,
                               content=section_content[:500])  # Store preview of content
            
            # Connect section to response
            self.graph.add_edge(response_id, section_id, relationship="CONTAINS")
            
            # Extract entities and solutions
            self._extract_entities(section_id, section_content)
            self._extract_solutions(section_id, section_content)
            
            # If we have a related RFP, try to link this section to RFP requirements
            if related_rfp_id and related_rfp_id in self.graph:
                self._link_to_requirements(section_id, section_content, related_rfp_id)
        
        # Save updated graph
        self.save_graph()
        
        return response_id
    
    def _extract_entities(self, section_id: str, content: str):
        """Extract entities from text and add to graph"""
        doc = self.nlp(content)
        
        # Process named entities
        for ent in doc.ents:
            if ent.label_ in self.config["entity_types"]:
                entity_id = f"entity_{ent.text.lower().replace(' ', '_')}_{ent.label_}"
                
                # Add entity if it doesn't exist
                if not self.graph.has_node(entity_id):
                    self.graph.add_node(entity_id,
                                       type=ent.label_,
                                       name=ent.text,
                                       mentions=1)
                else:
                    # Update mention count
                    self.graph.nodes[entity_id]["mentions"] += 1
                
                # Connect entity to section
                self.graph.add_edge(section_id, entity_id, relationship="MENTIONS")
    
    def _extract_requirements(self, section_id: str, content: str):
        """Extract requirements from RFP text"""
        # Split into sentences
        doc = self.nlp(content)
        
        for i, sent in enumerate(doc.sents):
            # Check for requirement indicators
            is_requirement = False
            for indicator in ["must", "shall", "required", "mandatory", "will"]:
                if indicator in sent.text.lower():
                    is_requirement = True
                    break
            
            if is_requirement:
                req_id = f"{section_id}_req_{i}"
                
                # Add requirement node
                self.graph.add_node(req_id,
                                   type="REQUIREMENT",
                                   text=sent.text,
                                   priority=self._estimate_priority(sent.text))
                
                # Connect requirement to section
                self.graph.add_edge(section_id, req_id, relationship="CONTAINS")
    
    def _extract_solutions(self, section_id: str, content: str):
        """Extract solution components from response text"""
        # Split into paragraphs
        paragraphs = content.split('\n\n')
        
        for i, para in enumerate(paragraphs):
            if len(para.strip()) < 50:  # Skip short paragraphs
                continue
                
            # Check if paragraph describes a solution
            solution_indicators = ["solution", "approach", "methodology", "implement", "provide", "deliver"]
            is_solution = any(indicator in para.lower() for indicator in solution_indicators)
            
            if is_solution:
                solution_id = f"{section_id}_solution_{i}"
                
                # Add solution node
                self.graph.add_node(solution_id,
                                   type="SOLUTION",
                                   text=para[:500],  # Store preview
                                   keywords=self._extract_keywords(para))
                
                # Connect solution to section
                self.graph.add_edge(section_id, solution_id, relationship="CONTAINS")
    
    def _estimate_priority(self, text: str) -> str:
        """Estimate priority of a requirement"""
        text_lower = text.lower()
        if any(term in text_lower for term in ["critical", "highest", "essential", "must"]):
            return "high"
        elif any(term in text_lower for term in ["should", "important"]):
            return "medium"
        else:
            return "low"
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract keywords from text"""
        doc = self.nlp(text)
        keywords = []
        
        for token in doc:
            if token.is_stop or token.is_punct or token.is_space:
                continue
            if token.pos_ in ["NOUN", "PROPN", "ADJ"] and len(token.text) > 3:
                keywords.append(token.text.lower())
        
        return list(set(keywords))[:10]  # Return up to 10 unique keywords
    
    def _find_similar_rfps(self, rfp_id: str):
        """Find similar RFPs in the graph"""
        # Get all RFP nodes
        rfp_nodes = [n for n, d in self.graph.nodes(data=True) if d.get("type") == "RFP" and n != rfp_id]
        
        if not rfp_nodes:
            return
        
        # Get entities mentioned in this RFP
        current_rfp_entities = set()
        for section_id in [n for n, _ in self.graph.out_edges(rfp_id)]:
            for _, entity_id in self.graph.out_edges(section_id):
                if self.graph.nodes[entity_id].get("type") in self.config["entity_types"]:
                    current_rfp_entities.add(entity_id)
        
        # Compare with other RFPs
        for other_rfp in rfp_nodes:
            other_rfp_entities = set()
            for section_id in [n for n, _ in self.graph.out_edges(other_rfp)]:
                for _, entity_id in self.graph.out_edges(section_id):
                    if self.graph.nodes[entity_id].get("type") in self.config["entity_types"]:
                        other_rfp_entities.add(entity_id)
            
            # Calculate Jaccard similarity
            if current_rfp_entities and other_rfp_entities:
                similarity = len(current_rfp_entities.intersection(other_rfp_entities)) / len(current_rfp_entities.union(other_rfp_entities))
                
                if similarity >= self.config["similarity_threshold"]:
                    # Add similarity edge
                    self.graph.add_edge(rfp_id, other_rfp, relationship="SIMILAR_TO", similarity=similarity)
    
    def _link_to_requirements(self, response_section_id: str, content: str, rfp_id: str):
        """Link response section to RFP requirements"""
        # Get all requirement nodes from the RFP
        requirements = []
        for section_id in [n for n, _ in self.graph.out_edges(rfp_id)]:
            for _, req_id in self.graph.out_edges(section_id):
                if self.graph.nodes[req_id].get("type") == "REQUIREMENT":
                    requirements.append((req_id, self.graph.nodes[req_id].get("text", "")))
        
        if not requirements:
            return
        
        # Create embeddings for response section
        response_doc = self.nlp(content)
        
        # Compare with each requirement
        for req_id, req_text in requirements:
            req_doc = self.nlp(req_text)
            
            # Calculate semantic similarity
            similarity = response_doc.similarity(req_doc)
            
            if similarity >= self.config["similarity_threshold"]:
                # Add addresses edge
                self.graph.add_edge(response_section_id, req_id, relationship="ADDRESSES", similarity=similarity)
    
    def query_similar_rfps(self, rfp_id: str, limit: int = 5) -> List[Dict]:
        """Query for similar RFPs
        
        Args:
            rfp_id: ID of the RFP to find similar documents for
            limit: Maximum number of results to return
            
        Returns:
            List of similar RFP dictionaries with similarity scores
        """
        similar_rfps = []
        
        # Check direct similarity links
        for _, similar_id, data in self.graph.out_edges(rfp_id, data=True):
            if data.get("relationship") == "SIMILAR_TO" and self.graph.nodes[similar_id].get("type") == "RFP":
                similar_rfps.append({
                    "id": similar_id,
                    "title": self.graph.nodes[similar_id].get("title", ""),
                    "client": self.graph.nodes[similar_id].get("client", ""),
                    "date": self.graph.nodes[similar_id].get("date", ""),
                    "similarity": data.get("similarity", 0)
                })
        
        # Sort by similarity and limit results
        similar_rfps.sort(key=lambda x: x["similarity"], reverse=True)
        return similar_rfps[:limit]
    
    def query_relevant_responses(self, rfp_id: str, limit: int = 10) -> List[Dict]:
        """Query for relevant previous responses based on an RFP
        
        Args:
            rfp_id: ID of the RFP to find relevant responses for
            limit: Maximum number of results to return
            
        Returns:
            List of relevant response sections with similarity scores
        """
        # Get requirements from this RFP
        requirements = []
        for section_id in [n for n, _ in self.graph.out_edges(rfp_id)]:
            for _, req_id in self.graph.out_edges(section_id):
                if self.graph.nodes[req_id].get("type") == "REQUIREMENT":
                    requirements.append(req_id)
        
        if not requirements:
            return []
        
        # Find response sections that address similar requirements
        relevant_sections = []
        
        for req_id in requirements:
            for response_section_id, _, data in self.graph.in_edges(req_id, data=True):
                if data.get("relationship") == "ADDRESSES" and self.graph.nodes[response_section_id].get("type") == "SECTION":
                    # Find the parent response
                    for response_id, _, _ in self.graph.in_edges(response_section_id):
                        if self.graph.nodes[response_id].get("type") == "RESPONSE":
                            relevant_sections.append({
                                "response_id": response_id,
                                "response_title": self.graph.nodes[response_id].get("title", ""),
                                "outcome": self.graph.nodes[response_id].get("outcome", "unknown"),
                                "section_id": response_section_id,
                                "section_title": self.graph.nodes[response_section_id].get("title", ""),
                                "section_content": self.graph.nodes[response_section_id].get("content", ""),
                                "requirement_id": req_id,
                                "requirement_text": self.graph.nodes[req_id].get("text", ""),
                                "similarity": data.get("similarity", 0)
                            })
        
        # Sort by similarity and limit results
        relevant_sections.sort(key=lambda x: x["similarity"], reverse=True)
        return relevant_sections[:limit]
    
    def export_to_dataframes(self) -> Dict[str, pd.DataFrame]:
        """Export graph to pandas DataFrames for analysis
        
        Returns:
            Dictionary of DataFrames for nodes and edges
        """
        # Create nodes DataFrame
        nodes_data = []
        for node_id, data in self.graph.nodes(data=True):
            node_dict = {"id": node_id}
            node_dict.update(data)
            nodes_data.append(node_dict)
        
        nodes_df = pd.DataFrame(nodes_data)
        
        # Create edges DataFrame
        edges_data = []
        for source, target, data in self.graph.edges(data=True):
            edge_dict = {
                "source": source,
                "target": target
            }
            edge_dict.update(data)
            edges_data.append(edge_dict)
        
        edges_df = pd.DataFrame(edges_data)
        
        return {
            "nodes": nodes_df,
            "edges": edges_df
        }