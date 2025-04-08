python src/rfp_document_ingestion.py --config config/config.yaml

python rfp_document_ingestion.py --config path/to/config.yaml


python run_llm_integration.py --config/config.yaml --config/llm_config.json --api-key your_together_api_key

 Processing Options
You can modify the configuration file to change processing options:

Change chunk_strategy to control how documents are divided (by section, paragraph, or heading)
Set recursive_search to false to avoid searching subdirectories
Adjust date ranges to filter documents by modification date
Set keep_full_text to true if you need to retain the complete document text (increases output size)



Best Practices
6.1 Document Organization

Organize source documents into industry-specific folders to improve automatic categorization
Use consistent naming conventions with industry and document type indicators
Consider creating separate directories for different document types (e.g., /past_rfps, /compliance, /product_specs)

6.2 Performance Optimization

For large document collections, process in batches by setting up multiple configurations
Disable full text retention in output to save storage space
Adjust chunk size parameters based on your retrieval needs

6.3 Customization

Modify regex patterns in the metadata extractor for industry-specific requirements
Add new document type handlers by extending the _extract_from_X methods
Enhance taxonomy generation with custom categorization rules


The LLM integration is highly configurable through a separate JSON configuration file. You can:

Select LLM Provider - Currently supports Together.ai with structure for future providers
Choose Specific Models - Different tasks can use different models based on their needs
Adjust Parameters - Control temperature, token limits, and other generation parameters
Enable/Disable Tasks - Turn specific enhancements on or off as needed




## Installation Instructions

### Basic Installation

1. Create a new virtual environment:

```bash
python -m venv advanced_analysis_env
source advanced_analysis_env/bin/activate  # Linux/Mac
# or
advanced_analysis_env\Scripts\activate  # Windows
```

2. Install core dependencies:

```bash
pip install pandas numpy pyyaml langid langdetect beautifulsoup4 pytesseract
```

3. Install AI dependencies:

```bash
pip install torch transformers
# or for CUDA support
pip install torch==1.13.1+cu117 -f https://download.pytorch.org/whl/torch_stable.html
pip install transformers
```

4. Install document format-specific dependencies as needed:

```bash
# For PDF processing
pip install pdfplumber pdf2image tabula-py PyMuPDF

# For Office documents
pip install python-docx python-pptx openpyxl xlrd
```

5. Install integration-specific dependencies as needed:

```bash
# Together.ai
pip install together

# Database
pip install sqlalchemy psycopg2-binary

# Cloud storage
pip install boto3
```

### Using requirements.txt

Alternatively, you can install all dependencies using the provided requirements.txt file:

```bash
pip install -r requirements.txt
```

### System Dependencies

#### Tesseract OCR
For table extraction from images and PDFs, Tesseract OCR is required:

- **Linux**:
  ```bash
  sudo apt-get update
  sudo apt-get install tesseract-ocr
  sudo apt-get install tesseract-ocr-eng  # English language data
  ```

- **MacOS**:
  ```bash
  brew install tesseract
  ```

- **Windows**:
  Download and install from: https://github.com/UB-Mannheim/tesseract/wiki

#### PDF Tools
For PDF processing, additional system dependencies may be required:

- **Linux**:
  ```bash
  sudo apt-get install poppler-utils
  ```

- **MacOS**:
  ```bash
  brew install poppler
  ```

- **Windows**:
  Download and install poppler binaries

## Configuration

1. Create a configuration file (YAML format) as shown in the examples.

2. Set any required environment variables for API keys:
   ```bash
   export TOGETHER_API_KEY="your_together_api_key"
   export AWS_ACCESS_KEY="your_aws_access_key"
   export AWS_SECRET_KEY="your_aws_secret_key"
   ```

## Installation Verification

To verify your installation, run the provided test script:

```bash
python -m advanced_content_analysis.test
```

This will check that all required dependencies are installed and functioning correctly.

## Troubleshooting

If you encounter issues with PyTorch or Transformers, ensure you have the correct version for your CUDA installation:

```bash
# Check CUDA version
nvidia-smi

# Install matching PyTorch version
# For CUDA 11.7:
pip install torch==1.13.1+cu117 -f https://download.pytorch.org/whl/torch_stable.html
```

For issues with PDF processing libraries, ensure poppler is correctly installed and in your PATH.