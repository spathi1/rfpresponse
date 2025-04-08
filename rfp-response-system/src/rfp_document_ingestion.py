import os
import json
import logging
import yaml
from pathlib import Path
from typing import Dict, List, Optional
import argparse
from datetime import datetime

# Import our modules
from document_inventory import DocumentInventory
from document_preprocessor import DocumentPreprocessor
from metadata_extractor import MetadataExtractor
from corpus_taxonomy import CorpusTaxonomy

class RFPDocumentIngestionSystem:
    """Main class for the Document Ingestion & Preprocessing Module"""
    
    def __init__(self, config_path: str):
        """
        Initialize the document ingestion system
        
        Args:
            config_path: Path to configuration file
        """
        # Configure logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger('RFPIngestionSystem')
        
        # Load configuration
        self.logger.info(f"Loading configuration from {config_path}")
        with open(config_path, 'r') as file:
            self.config = yaml.safe_load(file)
            
        # Initialize processing components
        self.inventory = DocumentInventory(config_path)
        
        chunk_strategy = self.config.get('preprocessing', {}).get('chunk_strategy', 'section')
        self.preprocessor = DocumentPreprocessor(chunk_strategy=chunk_strategy)
        
        self.metadata_extractor = MetadataExtractor(self.config)
        
        self.taxonomy = CorpusTaxonomy(config_path)
        
        # Create output directory if needed
        self.output_directory = Path(self.config.get('output_directory', 'processed_documents'))
        os.makedirs(self.output_directory, exist_ok=True)
        
        # Set up ingestion tracking
        self.processed_count = 0
        self.failed_count = 0
        self.processing_start_time = None
        
    def ingest_documents(self) -> int:
        """
        Main method to ingest and process all documents
        
        Returns:
            Number of documents successfully processed
        """
        self.processing_start_time = datetime.now()
        self.logger.info("Starting document ingestion process")
        
        # Collect documents from inventory
        self.logger.info("Collecting documents from configured directory")
        documents = self.inventory.collect_documents()
        self.logger.info(f"Found {len(documents)} documents to process")
        
        processed_documents = []
        
        # Process each document
        for doc_info in documents:
            try:
                self.logger.info(f"Processing document: {doc_info['filename']}")
                
                # Preprocess document
                doc_info = self.preprocessor.preprocess_document(doc_info)
                
                # Extract metadata
                doc_info = self.metadata_extractor.extract_metadata(doc_info)
                
                # Save processed document
                self._save_processed_document(doc_info)
                
                processed_documents.append(doc_info)
                self.processed_count += 1
                
            except Exception as e:
                self.logger.error(f"Error processing document {doc_info['filename']}: {str(e)}")
                self.failed_count += 1
        
        # Generate and save taxonomy
        self.logger.info("Generating taxonomy from processed documents")
        taxonomy = self.taxonomy.generate_taxonomy(processed_documents)
        
        # Save taxonomy to the output directory
        taxonomy_path = self.output_directory / 'taxonomy.json'
        self.taxonomy.export_taxonomy(str(taxonomy_path))
        
        # Create summary report
        self._create_summary_report(processed_documents)
        
        processing_time = (datetime.now() - self.processing_start_time).total_seconds()
        self.logger.info(f"Document ingestion completed. Processed {self.processed_count} documents in {processing_time:.2f} seconds")
        self.logger.info(f"Failed to process {self.failed_count} documents")
        
        return self.processed_count
    
    def _save_processed_document(self, doc_info: Dict) -> None:
        """Save processed document to JSON file"""
        # Create a filename-safe document ID
        doc_id = os.path.splitext(doc_info['filename'])[0]
        doc_id = ''.join(c if c.isalnum() else '_' for c in doc_id)
        
        # Create output path
        output_path = self.output_directory / f"{doc_id}.json"
        
        # Remove the full text to reduce file size
        output_doc = doc_info.copy()
        
        # Optionally keep full text based on configuration
        if not self.config.get('preprocessing', {}).get('keep_full_text', False):
            if 'content' in output_doc:
                if 'full_text' in output_doc['content']:
                    output_doc['content']['full_text'] = f"[Text removed. Original length: {len(doc_info['content']['full_text'])} characters]"
        
        # Generate taxonomy tags
        output_doc['taxonomy_tags'] = self.taxonomy.generate_document_tags(doc_info)
        
        # Save to file
        with open(output_path, 'w', encoding='utf-8') as file:
            json.dump(output_doc, file, indent=2)
    
    def _create_summary_report(self, processed_documents: List[Dict]) -> None:
        """Create a summary report of the ingestion process"""
        industry_counts = {}
        document_type_counts = {}
        
        # Collect statistics
        for doc in processed_documents:
            # Count by industry
            for industry in doc['metadata'].get('industry_tags', ['unspecified']):
                industry_counts[industry] = industry_counts.get(industry, 0) + 1
                
            # Count by document type
            doc_type = doc['metadata'].get('category', 'uncategorized')
            document_type_counts[doc_type] = document_type_counts.get(doc_type, 0) + 1
        
        # Create report
        report = {
            "ingestion_summary": {
                "timestamp": datetime.now().isoformat(),
                "total_documents_found": self.processed_count + self.failed_count,
                "documents_processed": self.processed_count,
                "documents_failed": self.failed_count,
                "processing_time_seconds": (datetime.now() - self.processing_start_time).total_seconds()
            },
            "document_statistics": {
                "by_industry": industry_counts,
                "by_document_type": document_type_counts
            }
        }
        
        # Save report
        report_path = self.output_directory / 'ingestion_report.json'
        with open(report_path, 'w', encoding='utf-8') as file:
            json.dump(report, file, indent=2)

# Command-line interface
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RFP Document Ingestion System")
    parser.add_argument("--config", required=True, help="Path to configuration file")
    args = parser.parse_args()
    
    # Run ingestion system
    ingestion_system = RFPDocumentIngestionSystem(args.config)
    processed_count = ingestion_system.ingest_documents()
    
    print(f"Processed {processed_count} documents successfully.")