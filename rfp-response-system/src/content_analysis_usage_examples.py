# Example 1: Basic Usage
from advanced_content_analysis import AdvancedContentAnalysis, create_default_config

# Initialize with default configuration
analyzer = AdvancedContentAnalysis()

# Process a document
results = analyzer.process_document("rfp_document.pdf")

# Access table extraction results
if "tables" in results:
    for i, table in enumerate(results["tables"]):
        print(f"Table {i+1} with {len(table.rows)} rows and {len(table.headers) if table.headers else 0} columns")
        # Convert to CSV
        csv_data = table.to_csv()
        with open(f"table_{i+1}.csv", "w") as f:
            f.write(csv_data)

# Access language detection results
if "language" in results:
    language_info = results["language"]
    print(f"Primary language: {language_info.primary_language} (confidence: {language_info.confidence:.2f})")
    
    if language_info.section_languages:
        print("Section languages:")
        for section, lang in language_info.section_languages.items():
            print(f"  {section}: {lang}")
            
    if language_info.encoding_issues:
        print("Encoding issues detected:")
        for issue in language_info.encoding_issues:
            print(f"  - {issue}")

# Access document structure
if "structure" in results:
    doc_structure = results["structure"]
    print(f"Document title: {doc_structure.title}")
    print(f"Top-level sections: {len(doc_structure.sections)}")
    
    # Generate a table of contents
    toc = doc_structure.generate_table_of_contents()
    print("\nTable of Contents:")
    for item in toc:
        indent = "  " * (item["level"] - 1)
        print(f"{indent}{item['section_number'] or ''} {item['title']}")
    
    # Save structure as JSON
    with open("document_structure.json", "w") as f:
        f.write(doc_structure.to_json())

# Save all results
analyzer.save_results(results, "analysis_results.json", format="json")


# Example 2: Custom Configuration
import yaml

# Load custom configuration from file
with open("advanced_analysis_config.yaml", "r") as f:
    config = yaml.safe_load(f)

# Initialize with custom configuration
analyzer = AdvancedContentAnalysis(config=config)

# Process multiple documents with batch processing
documents = [
    "rfp_document1.pdf",
    "rfp_document2.docx",
    "rfp_document3.html"
]

results_by_document = {}
for doc in documents:
    results = analyzer.process_document(doc)
    results_by_document[doc] = results

# Save batch results
import json
with open("batch_results.json", "w") as f:
    # Convert to serializable format
    serializable_results = {}
    for doc, result in results_by_document.items():
        serializable_results[doc] = {
            "tables": [table.__dict__ for table in result.get("tables", [])],
            "language": result.get("language").__dict__ if "language" in result else None,
            "structure": result.get("structure").to_dict() if "structure" in result else None
        }
    json.dump(serializable_results, f, indent=2)


# Example 3: Using Table Extraction Only
from advanced_content_analysis import AdvancedContentAnalysis, TableExtractor

# Create a custom configuration with only table extraction enabled
config = {
    "table_extraction": {
        "enabled": True,
        "use_ai_model": False,
        "enable_fallback": True,
        "formats": ["pdf", "docx", "html"]
    },
    "language_detection": {
        "enabled": False
    },
    "section_detection": {
        "enabled": False
    }
}

# Initialize with custom configuration
analyzer = AdvancedContentAnalysis(config=config)

# Process a document
results = analyzer.process_document("rfp_with_tables.pdf")

# Access and convert tables
if "tables" in results:
    for i, table in enumerate(results["tables"]):
        # Convert to various formats
        csv_data = table.to_csv()
        json_data = table.to_json()
        df = table.to_dataframe()
        
        # Example: Perform analysis on the table data using pandas
        if df is not None and not df.empty:
            print(f"Table {i+1} statistics:")
            print(df.describe())
            
            # Example: Save as Excel
            df.to_excel(f"table_{i+1}.xlsx", index=False)


# Example 4: Programmatic Integration with Existing Pipeline
from existing_system import DocumentPreprocessor, RFPDocumentSystem
from advanced_content_analysis import integrate_with_document_preprocessor, AdvancedContentAnalysis

# Initialize your existing system
document_system = RFPDocumentSystem()

# Initialize the Advanced Content Analysis module
config = create_default_config()
advanced_analysis = AdvancedContentAnalysis(config=config)

# Integrate with the existing document preprocessor
document_system.preprocessor = integrate_with_document_preprocessor(
    advanced_analysis,
    document_system.preprocessor
)

# Now the document system will automatically include advanced analysis
# when processing documents
document = document_system.process_document("rfp_document.pdf")

# Access the advanced analysis results
advanced_results = document.get("advanced_analysis", {})


# Example 5: Working with Multiple Languages
# Configure specifically for multilingual support
multilingual_config = create_default_config()
multilingual_config["language_detection"]["section_detection"] = True
multilingual_config["language_detection"]["min_section_length"] = 50
multilingual_config["language_detection"]["supported_languages"] = [
    "en", "fr", "de", "es", "it", "zh", "ja", "ko", "ar", "ru"
]

analyzer = AdvancedContentAnalysis(config=multilingual_config)

# Process a multilingual document
results = analyzer.process_document("multilingual_rfp.pdf")

# Check language information
if "language" in results:
    language_info = results["language"]
    print(f"Primary language: {language_info.primary_language}")
    
    # Check for mixed language content
    if language_info.section_languages:
        print("\nDocument contains multiple languages:")
        for section, lang in language_info.section_languages.items():
            print(f"  {section}: {lang}")
        
        # Example: Extract content by language
        if "structure" in results:
            doc_structure = results["structure"]
            
            # Find sections in specific languages
            english_sections = []
            french_sections = []
            
            for section in doc_structure.sections:
                section_key = f"paragraph_{section.start_index}"
                if section_key in language_info.section_languages:
                    if language_info.section_languages[section_key] == "en":
                        english_sections.append(section)
                    elif language_info.section_languages[section_key] == "fr":
                        french_sections.append(section)
            
            print(f"\nFound {len(english_sections)} English sections and {len(french_sections)} French sections")


# Example 6: Creating a Hierarchical Document Structure
from advanced_content_analysis import DocumentSection, DocumentStructure

# Manual creation of document structure (for demonstration)
root_section = DocumentSection(
    title="RFP Requirements",
    content="This section contains the main requirements.",
    level=1,
    section_number="1"
)

subsection1 = DocumentSection(
    title="Technical Requirements",
    content="Details of technical requirements...",
    level=2,
    section_number="1.1",
    parent=root_section
)

subsection2 = DocumentSection(
    title="Business Requirements",
    content="Details of business requirements...",
    level=2,
    section_number="1.2",
    parent=root_section
)

# Add children to parent
root_section.children = [subsection1, subsection2]

# Create document structure
doc_structure = DocumentStructure(
    title="Sample RFP Document",
    sections=[root_section]
)

# Generate a table of contents
toc = doc_structure.generate_table_of_contents()
print("Table of Contents:")
for item in toc:
    indent = "  " * (item["level"] - 1)
    print(f"{indent}{item['section_number']} {item['title']}")

# Convert to JSON for storage
json_structure = doc_structure.to_json()
print(f"\nJSON Structure (sample):\n{json_structure[:200]}...")
