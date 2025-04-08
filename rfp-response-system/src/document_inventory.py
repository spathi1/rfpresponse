import os
import re
import yaml
from pathlib import Path
from typing import Dict, List, Tuple
import magic  # For MIME type detection

class DocumentInventory:
    def __init__(self, config_path: str):
        # Load configuration 
        with open(config_path, 'r') as file:
            self.config = yaml.safe_load(file)
        
        self.base_directory = Path(self.config['document_directory'])
        self.industry_types = self.config.get('industry_types', [])
        self.document_date_range = self.config.get('document_date_range', {})
        
    def collect_documents(self) -> List[Dict]:
        """Recursively scan the directory and collect document information"""
        documents = []
        
        # Walk through all files in the base directory
        for root, _, files in os.walk(self.base_directory):
            for filename in files:
                file_path = Path(root) / filename
                
                # Skip hidden files and directories
                if any(part.startswith('.') for part in file_path.parts):
                    continue
                
                # Check if file extension is supported
                if file_path.suffix.lower() in ['.docx', '.pdf', '.pptx', '.md', '.txt']:
                    # Get basic file information
                    doc_info = self._get_document_info(file_path)
                    
                    # Apply filters from configuration
                    if self._passes_filters(doc_info):
                        documents.append(doc_info)
        
        return documents
    
    def _get_document_info(self, file_path: Path) -> Dict:
        """Extract basic document information"""
        mime_type = magic.from_file(str(file_path), mime=True)
        
        # Get relative path to maintain portability
        rel_path = file_path.relative_to(self.base_directory)
        
        # Determine document category based on path or content
        category = self._infer_document_category(file_path)
        
        # Define basic document info
        return {
            'path': str(file_path),
            'relative_path': str(rel_path),
            'filename': file_path.name,
            'extension': file_path.suffix.lower(),
            'mime_type': mime_type,
            'size_bytes': file_path.stat().st_size,
            'modified_date': file_path.stat().st_mtime,
            'category': category,
            'industry_tags': self._infer_industry_tags(file_path)
        }
    
    def _infer_document_category(self, file_path: Path) -> str:
        """Infer document category based on path and naming conventions"""
        path_str = str(file_path).lower()
        
        # Map folder names and keywords to document categories
        category_mappings = {
            'rfp': 'past_rfp_response',
            'response': 'past_rfp_response',
            'compliance': 'compliance_document',
            'solution': 'solution_brief',
            'product': 'product_spec',
            'spec': 'product_spec',
            'legal': 'legal_document',
            'financial': 'financial_document',
            'technical': 'technical_document'
        }
        
        for keyword, category in category_mappings.items():
            if keyword in path_str:
                return category
                
        # Default category if no match is found
        return 'uncategorized'
    
    def _infer_industry_tags(self, file_path: Path) -> List[str]:
        """Infer industry tags based on directory structure or filename patterns"""
        path_str = str(file_path).lower()
        industry_tags = []
        
        # Check if file contains any industry keywords
        for industry in self.industry_types:
            if industry.lower() in path_str:
                industry_tags.append(industry)
        
        return industry_tags
    
    def _passes_filters(self, doc_info: Dict) -> bool:
        """Check if document passes configured filters"""
        # Apply date range filter if specified
        if self.document_date_range:
            date_min = self.document_date_range.get('min')
            date_max = self.document_date_range.get('max')
            
            if date_min and doc_info['modified_date'] < date_min:
                return False
            if date_max and doc_info['modified_date'] > date_max:
                return False
        
        # Apply industry filter if specified
        if self.industry_types and not any(tag in self.industry_types for tag in doc_info['industry_tags']):
            # Only filter by industry if industry types are specified in config
            if self.industry_types:
                return False
        
        return True