"""
Integration Code for Security and Compliance Module
==================================================

This file demonstrates how to integrate the Security and Compliance module
with the existing RFP document ingestion system.
"""

import asyncio
from typing import Dict, Any, Optional, List

# Import from existing RFP system - these are placeholders that would
# match your actual existing system
from rfp_system.document_inventory import DocumentInventory
from rfp_system.document_preprocessor import DocumentPreprocessor
from rfp_system.metadata_extractor import MetadataExtractor
from rfp_system.corpus_taxonomy import CorpusTaxonomy
from rfp_system.llm_integration import LLMService

# Import from Security and Compliance module
from security_compliance.module import (
    SecurityComplianceModule,
    Document,
    SensitivityLevel,
    RedactionMethod
)


class SecurityEnabledRFPSystem:
    """
    Integrates the security module with the existing RFP ingestion system.
    This class demonstrates how to use the security module as an optional
    enhancement to the current system.
    """
    
    def __init__(self, config_path: str = None):
        """
        Initialize the security-enabled RFP system.
        
        Args:
            config_path: Path to the security module configuration file
        """
        # Initialize the regular RFP system components
        self.document_inventory = DocumentInventory()
        self.document_preprocessor = DocumentPreprocessor()
        self.metadata_extractor = MetadataExtractor()
        self.corpus_taxonomy = CorpusTaxonomy()
        self.llm_service = LLMService()
        
        # Initialize the security module (optional)
        self.security_module = None
        if config_path:
            try:
                self.security_module = SecurityComplianceModule(config_path)
                print("Security and Compliance module initialized successfully")
            except Exception as e:
                print(f"Warning: Could not initialize Security module: {str(e)}")
                print("System will operate without security features")
    
    async def process_document(self, document_path: str, user_id: str, 
                              security_options: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Process a document through the RFP system with optional security features.
        
        Args:
            document_path: Path to the document to process
            user_id: ID of the user processing the document
            security_options: Optional security processing settings
            
        Returns:
            Dictionary with processing results
        """
        # Default security options
        default_options = {
            "enabled": True,
            "classify": True,
            "detect_pii": True,
            "redact_pii": False,
            "redaction_method": "mask"
        }
        
        # Merge with provided options
        options = {**default_options, **(security_options or {})}
        
        # --- Regular RFP Processing Pipeline ---
        
        # 1. Collect document from inventory
        document_data = self.document_inventory.collect(document_path)
        
        # 2. Preprocess the document (extract text and structure)
        processed_data = self.document_preprocessor.process(document_data)
        
        # 3. Extract metadata
        metadata = self.metadata_extractor.extract(processed_data)
        
        # 4. Organize with taxonomy
        taxonomy_data = self.corpus_taxonomy.categorize(processed_data, metadata)
        
        # 5. Enhance with LLM analysis
        llm_enhanced_data = self.llm_service.enhance(processed_data, metadata)
        
        # Create a complete document object
        document_id = metadata.get("document_id", f"doc_{document_path.split('/')[-1]}")
        
        # --- Security Processing (Optional) ---
        security_results = {}
        
        if self.security_module and options["enabled"]:
            try:
                # Convert to the format expected by the security module
                sec_document = Document(
                    id=document_id,
                    content=processed_data["text"],
                    metadata={
                        **metadata,
                        "taxonomy": taxonomy_data,
                        "llm_enhanced": llm_enhanced_data
                    }
                )
                
                # Process document through security pipeline
                redaction_method = RedactionMethod(options["redaction_method"])
                sec_document = await self.security_module.process_document(
                    document=sec_document,
                    user_id=user_id,
                    classify=options["classify"],
                    detect_pii=options["detect_pii"],
                    redact_pii=options["redact_pii"],
                    redaction_method=redaction_method
                )
                
                # Extract security results
                security_results = {
                    "sensitivity_level": sec_document.sensitivity_level.value 
                        if sec_document.sensitivity_level else None,
                    "pii_detected": len(sec_document.pii_matches) > 0,
                    "pii_count": len(sec_document.pii_matches),
                    "pii_types": list(set(m.pii_type.value for m in sec_document.pii_matches)),
                    "redacted_content": sec_document.redacted_content
                }
                
                # Update metadata with security information
                metadata["security"] = {
                    "sensitivity_level": security_results["sensitivity_level"],
                    "pii_detected": security_results["pii_detected"],
                    "processed_timestamp": metadata.get("processed_timestamp")
                }
                
            except Exception as e:
                print(f"Error in security processing: {str(e)}")
                security_results = {
                    "error": str(e),
                    "status": "Security processing failed"
                }
        
        # Combine results
        return {
            "document_id": document_id,
            "metadata": metadata,
            "taxonomy": taxonomy_data,
            "llm_enhanced_data": llm_enhanced_data,
            "security": security_results,
            "status": "processed"
        }
    
    def get_api_router(self):
        """
        Get the FastAPI router for the security module if available.
        
        Returns:
            The API router or None if security module is not enabled
        """
        if self.security_module:
            return self.security_module.create_api_router()
        return None
    
    async def update_security_config(self, config: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Update the security module configuration.
        
        Args:
            config: New configuration settings
            user_id: ID of the user updating the configuration
            
        Returns:
            Dictionary with update status
        """
        if not self.security_module:
            return {
                "success": False,
                "message": "Security module is not enabled"
            }
        
        try:
            # Convert dict to ModuleConfig
            from security_compliance.module import ModuleConfig
            config_obj = ModuleConfig(**config)
            
            # Update configuration via API
            response = await self.security_module.create_api_router().update_config(
                config=config_obj,
                user_info={"user_id": user_id}
            )
            
            return {
                "success": response.success,
                "message": response.message,
                "data": response.data
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Failed to update configuration: {str(e)}"
            }


# Example usage of the integrated system
async def example_workflow():
    """Example workflow demonstrating how to use the integrated system."""
    
    # Initialize the system with security module
    system = SecurityEnabledRFPSystem("security_config.yaml")
    
    # Process a document with default security options
    result = await system.process_document(
        document_path="/path/to/rfp_document.pdf",
        user_id="user123"
    )
    
    print(f"Document processed with ID: {result['document_id']}")
    
    if "security" in result and "sensitivity_level" in result["security"]:
        print(f"Classified as: {result['security']['sensitivity_level']}")
        
        if result["security"]["pii_detected"]:
            print(f"Detected {result['security']['pii_count']} PII instances")
            print(f"PII types: {', '.join(result['security']['pii_types'])}")
    
    # Process another document with custom security options
    custom_options = {
        "classify": True,
        "detect_pii": True,
        "redact_pii": True,
        "redaction_method": "tokenize"
    }
    
    result = await system.process_document(
        document_path="/path/to/another_document.docx",
        user_id="user123",
        security_options=custom_options
    )
    
    print(f"Document processed with ID: {result['document_id']}")
    print(f"Redacted content available: {'redacted_content' in result['security']}")
    
    # Update security configuration
    update_result = await system.update_security_config(
        config={
            "sensitivity_classification": {
                "enabled": True,
                "default_level": "internal"
            },
            "pii_detection": {
                "enabled": True,
                "confidence_threshold": 0.8
            }
        },
        user_id="admin_user"
    )
    
    print(f"Configuration update: {update_result['message']}")


# Run the example
if __name__ == "__main__":
    asyncio.run(example_workflow())