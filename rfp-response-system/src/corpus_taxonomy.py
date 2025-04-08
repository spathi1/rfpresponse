from typing import Dict, List, Set, Tuple
import yaml
import json

class CorpusTaxonomy:
    def __init__(self, config_path: str = None):
        """
        Initialize corpus taxonomy
        
        Args:
            config_path: Path to YAML configuration file for taxonomy
        """
        self.taxonomy = {
            "industries": {},
            "document_types": {},
            "content_types": {},
            "topic_areas": {},
        }
        
        # Load base taxonomy if provided
        if config_path:
            with open(config_path, 'r') as file:
                config = yaml.safe_load(file)
                if 'taxonomy' in config:
                    self.taxonomy.update(config['taxonomy'])
    
    def generate_taxonomy(self, documents: List[Dict]) -> Dict:
        """
        Generate or update taxonomy based on document corpus
        
        Args:
            documents: List of processed documents with metadata
            
        Returns:
            Updated taxonomy structure
        """
        # Process each document to update taxonomy
        for doc in documents:
            metadata = doc.get('metadata', {})
            
            # Update industry taxonomy
            for industry_tag in metadata.get('industry_tags', []):
                self._update_taxonomy_entry('industries', industry_tag)
            
            # Update document type taxonomy
            doc_category = metadata.get('category', 'uncategorized')
            self._update_taxonomy_entry('document_types', doc_category)
            
            # Update content type taxonomy
            content_type = metadata.get('content_type', 'general')
            self._update_taxonomy_entry('content_types', content_type)
            
            # Update topic areas based on document keywords
            for keyword in metadata.get('keywords', []):
                self._add_topic(keyword, doc_category, metadata.get('industry_tags', []))
        
        # Return the updated taxonomy
        return self.taxonomy
    
    def _update_taxonomy_entry(self, taxonomy_type: str, entry_key: str) -> None:
        """Update a taxonomy entry with document count"""
        if taxonomy_type in self.taxonomy:
            if entry_key not in self.taxonomy[taxonomy_type]:
                self.taxonomy[taxonomy_type][entry_key] = {
                    "count": 1,
                    "subtypes": {}
                }
            else:
                self.taxonomy[taxonomy_type][entry_key]["count"] += 1
    
    def _add_topic(self, topic: str, doc_type: str, industries: List[str]) -> None:
        """Add or update a topic in the taxonomy"""
        if topic not in self.taxonomy["topic_areas"]:
            self.taxonomy["topic_areas"][topic] = {
                "count": 1,
                "document_types": {doc_type: 1},
                "industries": {industry: 1 for industry in industries}
            }
        else:
            # Update topic count
            self.taxonomy["topic_areas"][topic]["count"] += 1
            
            # Update document type count
            doc_types = self.taxonomy["topic_areas"][topic]["document_types"]
            doc_types[doc_type] = doc_types.get(doc_type, 0) + 1
            
            # Update industry counts
            industry_counts = self.taxonomy["topic_areas"][topic]["industries"]
            for industry in industries:
                industry_counts[industry] = industry_counts.get(industry, 0) + 1
    
    def generate_document_tags(self, document: Dict) -> List[str]:
        """
        Generate standardized tags for a document based on taxonomy
        
        Args:
            document: Document with metadata
            
        Returns:
            List of standardized tags
        """
        tags = []
        metadata = document.get('metadata', {})
        
        # Add industry tags
        for industry in metadata.get('industry_tags', []):
            if industry in self.taxonomy['industries']:
                tags.append(f"Industry:{industry}")
        
        # Add document type
        doc_category = metadata.get('category', 'uncategorized')
        if doc_category in self.taxonomy['document_types']:
            tags.append(f"DocType:{doc_category}")
        
        # Add content type
        content_type = metadata.get('content_type', 'general')
        if content_type in self.taxonomy['content_types']:
            tags.append(f"ContentType:{content_type}")
        
        # Add technical level
        tech_level = metadata.get('technical_level', 'medium')
        tags.append(f"TechLevel:{tech_level}")
        
        # Add topic tags from keywords
        for keyword in metadata.get('keywords', [])[:5]:  # Limit to top 5 keywords
            if keyword in self.taxonomy['topic_areas']:
                tags.append(f"Topic:{keyword}")
        
        # Add special tags
        if metadata.get('contains_pricing', False):
            tags.append("HasPricing")
            
        if metadata.get('contains_graphics', False):
            tags.append("HasGraphics")
        
        # Add custom subtype if available
        if 'document_subtype' in metadata:
            tags.append(f"Subtype:{metadata['document_subtype']}")
            
        return tags
    
    def export_taxonomy(self, output_path: str) -> None:
        """
        Export the taxonomy to a JSON file
        
        Args:
            output_path: File path to save the taxonomy JSON
        """
        with open(output_path, 'w', encoding='utf-8') as file:
            json.dump(self.taxonomy, file, indent=2)
    
    def get_related_topics(self, topic: str, limit: int = 5) -> List[str]:
        """
        Find related topics based on industry and document type overlap
        
        Args:
            topic: Topic to find relations for
            limit: Maximum number of related topics to return
            
        Returns:
            List of related topic names
        """
        if topic not in self.taxonomy["topic_areas"]:
            return []
            
        # Get topic's industries and document types
        topic_data = self.taxonomy["topic_areas"][topic]
        topic_industries = set(topic_data["industries"].keys())
        topic_doc_types = set(topic_data["document_types"].keys())
        
        # Calculate relatedness scores for other topics
        relatedness_scores = {}
        for other_topic, other_data in self.taxonomy["topic_areas"].items():
            if other_topic == topic:
                continue
                
            # Calculate industry overlap
            other_industries = set(other_data["industries"].keys())
            industry_overlap = len(topic_industries.intersection(other_industries))
            
            # Calculate document type overlap
            other_doc_types = set(other_data["document_types"].keys())
            doc_type_overlap = len(topic_doc_types.intersection(other_doc_types))
            
            # Calculate overall relatedness score
            relatedness_scores[other_topic] = (industry_overlap * 2) + doc_type_overlap
        
        # Sort by relatedness score and return top results
        related_topics = sorted(relatedness_scores.items(), 
                               key=lambda x: x[1], 
                               reverse=True)[:limit]
        
        return [topic for topic, score in related_topics]