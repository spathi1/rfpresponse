from advanced_content_analysis import AdvancedContentAnalysis, create_default_config

# Example integration with existing document preprocessing system
class DocumentInventory:
    """Example of existing document inventory component"""
    
    def collect_documents(self, source_path):
        """Collect documents from a source path"""
        # Placeholder implementation
        print(f"Collecting documents from {source_path}")
        return ["document1.pdf", "document2.docx", "document3.html"]


class DocumentPreprocessor:
    """Example of existing document preprocessor component"""
    
    def process_document(self, document_path, options=None):
        """Process a document to extract text and basic structure"""
        # Placeholder implementation
        print(f"Processing document: {document_path}")
        return {
            "text": "Sample document content...",
            "metadata": {
                "filename": document_path,
                "format": document_path.split(".")[-1],
                "title": "Sample Document"
            }
        }


class MetadataExtractor:
    """Example of existing metadata extractor component"""
    
    def extract_metadata(self, document):
        """Extract metadata from a document"""
        # Placeholder implementation
        return {
            "title": "Sample Document",
            "author": "John Doe",
            "date": "2025-04-01",
            "keywords": ["sample", "document"]
        }


class CorpusTaxonomy:
    """Example of existing corpus taxonomy component"""
    
    def categorize_document(self, document, metadata):
        """Categorize a document using taxonomy"""
        # Placeholder implementation
        return ["category1", "category2"]


class LLMIntegration:
    """Example of existing LLM integration component (using Together.ai)"""
    
    def __init__(self, api_key):
        self.api_key = api_key
    
    def analyze_document(self, document):
        """Analyze a document with LLM"""
        # Placeholder implementation
        return {
            "summary": "This is a sample document...",
            "key_insights": ["Insight 1", "Insight 2"]
        }


class RFPDocumentSystem:
    """Example of the main document ingestion system"""
    
    def __init__(self, together_api_key=None):
        self.inventory = DocumentInventory()
        self.preprocessor = DocumentPreprocessor()
        self.metadata_extractor = MetadataExtractor()
        self.taxonomy = CorpusTaxonomy()
        self.llm = LLMIntegration(together_api_key) if together_api_key else None
        self.advanced_analysis = None  # Will be set if enabled
    
    def enable_advanced_analysis(self, config=None):
        """Enable the advanced content analysis module"""
        if config is None:
            config = create_default_config()
        
        self.advanced_analysis = AdvancedContentAnalysis(config=config)
        
        # Integrate with the document preprocessor
        from advanced_content_analysis import integrate_with_document_preprocessor
        self.preprocessor = integrate_with_document_preprocessor(
            self.advanced_analysis, 
            self.preprocessor
        )
        
        print("Advanced Content Analysis enabled")
    
    def process_document(self, document_path, options=None):
        """Process a document through the entire pipeline"""
        # Basic processing
        document = self.preprocessor.process_document(document_path, options)
        metadata = self.metadata_extractor.extract_metadata(document)
        categories = self.taxonomy.categorize_document(document, metadata)
        
        result = {
            "document": document,
            "metadata": metadata,
            "categories": categories
        }
        
        # LLM analysis if available
        if self.llm:
            llm_analysis = self.llm.analyze_document(document)
            result["llm_analysis"] = llm_analysis
        
        return result


# Usage example
def main():
    # Initialize the system without advanced analysis
    system = RFPDocumentSystem(together_api_key="your_together_api_key")
    
    # Process a document without advanced analysis
    print("Processing without advanced analysis:")
    result = system.process_document("sample.pdf")
    
    # Enable advanced analysis with custom configuration
    custom_config = create_default_config()
    custom_config["table_extraction"]["use_ai_model"] = True
    custom_config["language_detection"]["use_ai_model"] = True
    
    system.enable_advanced_analysis(config=custom_config)
    
    # Process the same document with advanced analysis
    print("\nProcessing with advanced analysis:")
    result_with_advanced = system.process_document("sample.pdf")
    
    # Advanced analysis results are now available in the result
    if "advanced_analysis" in result_with_advanced["document"]:
        advanced = result_with_advanced["document"]["advanced_analysis"]
        
        if "tables" in advanced and advanced["tables"]:
            print(f"Found {len(advanced['tables'])} tables")
            
        if "language" in advanced:
            print(f"Document language: {advanced['language'].primary_language}")
            
        if "structure" in advanced:
            sections = advanced["structure"].sections
            print(f"Document has {len(sections)} top-level sections")


if __name__ == "__main__":
    main()
