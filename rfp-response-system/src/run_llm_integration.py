"""
Example script demonstrating how to use the LLM integration with the RFP document ingestion system.
"""

import os
import argparse
from llm_integration import (
    LLMConfig, 
    LLMClient, 
    LLMDocumentProcessor, 
    LLMTaxonomyEnhancer, 
    integrate_llm_with_ingestion
)

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="RFP Document Ingestion with LLM Enhancement")
    parser.add_argument("--config", required=True, help="Path to main configuration file")
    parser.add_argument("--llm-config", required=True, help="Path to LLM configuration file")
    parser.add_argument("--api-key", help="Together.ai API key (overrides config value)")
    args = parser.parse_args()
    
    # Set API key from environment variable or command line
    if args.api_key:
        os.environ["TOGETHER_API_KEY"] = args.api_key
    
    # Run the integrated ingestion process
    try:
        processed_count = integrate_llm_with_ingestion(args.config, args.llm_config)
        print(f"Successfully processed {processed_count} documents with LLM enhancement")
    except Exception as e:
        print(f"Error during LLM-enhanced document ingestion: {str(e)}")
        raise

if __name__ == "__main__":
    main()
