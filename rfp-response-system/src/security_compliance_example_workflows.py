"""
Example Security and Compliance Module Workflows
===============================================

This file demonstrates various workflows for using the Security and Compliance module.
"""

import asyncio
import json
from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse
from typing import Dict, Any, List

from security_compliance.module import (
    SecurityComplianceModule,
    Document,
    SensitivityLevel,
    PIIType,
    RedactionMethod,
    ClassificationRequest,
    PIIScanRequest,
    RedactionRequest,
    AuditLogRequest,
    EventType
)


# ============================================================
# Workflow 1: Basic Document Processing
# ============================================================

async def workflow_document_processing():
    """
    Basic workflow for processing a document through the security pipeline.
    """
    # Initialize the module
    security_module = SecurityComplianceModule("security_config.yaml")
    
    # Sample document
    document = Document(
        id="doc123",
        content="This is a sample document containing an email address: john.doe@example.com " +
                "and a phone number: 555-123-4567. Please contact us at your convenience. " +
                "This document is classified as CONFIDENTIAL.",
        metadata={
            "title": "Sample Document",
            "author": "Jane Smith",
            "created_date": "2025-03-15"
        }
    )
    
    # Process the document with all security features
    processed_doc = await security_module.process_document(
        document=document,
        user_id="user456",
        classify=True,
        detect_pii=True,
        redact_pii=True,
        redaction_method=RedactionMethod.MASK
    )
    
    # Print results
    print(f"Document ID: {processed_doc.id}")
    print(f"Sensitivity Level: {processed_doc.sensitivity_level}")
    print(f"PII Detected: {len(processed_doc.pii_matches)} instances")
    
    print("\nPII Matches:")
    for match in processed_doc.pii_matches:
        print(f"  - Type: {match.pii_type.value}")
        print(f"    Value: {match.value}")
        print(f"    Redacted: {match.redacted_value}")
        print(f"    Confidence: {match.confidence}")
    
    print("\nRedacted Content:")
    print(processed_doc.redacted_content)


# ============================================================
# Workflow 2: API Usage
# ============================================================

async def workflow_api_usage():
    """
    Workflow demonstrating how to use the module's API endpoints.
    """
    # Initialize FastAPI app
    app = FastAPI(title="RFP Security API")
    
    # Initialize the security module
    security_module = SecurityComplianceModule("security_config.yaml")
    
    # Add the security API router to the FastAPI app
    app.include_router(security_module.create_api_router())
    
    # Example of API request handlers
    @app.post("/example/classify-document")
    async def example_classify_document(document_id: str, level: str, user_id: str):
        # Create a classification request
        request = ClassificationRequest(
            document_id=document_id,
            sensitivity_level=SensitivityLevel(level),
            justification="Manual classification by user",
            override_existing=True
        )
        
        # Call the API endpoint
        api_router = security_module.create_api_router()
        response = await api_router.classify_document(
            request=request,
            user_info={"user_id": user_id}
        )
        
        return response
    
    @app.post("/example/scan-document")
    async def example_scan_document(document_id: str, user_id: str):
        # Create a PII scan request
        request = PIIScanRequest(
            document_id=document_id,
            pii_types=[PIIType.EMAIL, PIIType.PHONE, PIIType.SSN],
            confidence_threshold=0.6
        )
        
        # Call the API endpoint
        api_router = security_module.create_api_router()
        response = await api_router.scan_pii(
            request=request,
            user_info={"user_id": user_id}
        )
        
        return response
    
    @app.post("/example/redact-document")
    async def example_redact_document(document_id: str, method: str, user_id: str):
        # Create a redaction request
        request = RedactionRequest(
            document_id=document_id,
            redaction_method=RedactionMethod(method),
            pii_types=[PIIType.EMAIL, PIIType.PHONE, PIIType.SSN]
        )
        
        # Call the API endpoint
        api_router = security_module.create_api_router()
        response = await api_router.redact_pii(
            request=request,
            user_info={"user_id": user_id}
        )
        
        return response
    
    @app.get("/example/audit-logs")
    async def example_get_audit_logs(user_id: str):
        # Create an audit log request
        request = AuditLogRequest(
            start_time=None,  # No time limits
            end_time=None,
            event_types=[EventType.CLASSIFICATION, EventType.PII_DETECTION, EventType.REDACTION],
            document_ids=[],  # All documents
            user_ids=[user_id],  # Only for this user
            limit=10,
            offset=0
        )
        
        # Call the API endpoint
        api_router = security_module.create_api_router()
        response = await api_router.get_audit_logs(
            request=request,
            user_info={"user_id": user_id}
        )
        
        return response
    
    # Note: In a real application, you would run the FastAPI app with uvicorn
    print("API router configured with security endpoints")
    

# ============================================================
# Workflow 3: Document Classification
# ============================================================

async def workflow_document_classification():
    """
    Workflow focused on document sensitivity classification.
    """
    # Initialize the module
    security_module = SecurityComplianceModule("security_config.yaml")
    
    # Sample documents with different content
    documents = [
        Document(
            id="doc_public",
            content="This is a public press release announcing our new product.",
            metadata={"title": "Press Release"}
        ),
        Document(
            id="doc_internal",
            content="This document is for internal use only. Please do not share outside the company.",
            metadata={"title": "Team Meeting Notes"}
        ),
        Document(
            id="doc_confidential",
            content="CONFIDENTIAL: This document contains sensitive information about our strategy.",
            metadata={"title": "Strategic Plan"}
        ),
        Document(
            id="doc_restricted",
            content="TOP SECRET - RESTRICTED ACCESS: This document contains merger details.",
            metadata={"title": "Merger Plan"}
        )
    ]
    
    # Process each document - only classify, no PII detection
    for document in documents:
        classified_doc = await security_module.process_document(
            document=document,
            user_id="classifier_user",
            classify=True,
            detect_pii=False,
            redact_pii=False
        )
        
        print(f"Document ID: {classified_doc.id}")
        print(f"Title: {classified_doc.metadata['title']}")
        print(f"Sensitivity Level: {classified_doc.sensitivity_level}")
        print("----")
    
    # Manual classification override
    manual_request = ClassificationRequest(
        document_id="doc_public",
        sensitivity_level=SensitivityLevel.CONFIDENTIAL,
        justification="Contains embargoed information",
        override_existing=True
    )
    
    api_router = security_module.create_api_router()
    response = await api_router.classify_document(
        request=manual_request,
        user_info={"user_id": "supervisor_user"}
    )
    
    print("Manual Classification Override:")
    print(f"Success: {response.success}")
    print(f"Message: {response.message}")
    if response.data:
        print(f"New Level: {response.data['sensitivity_level']}")


# ============================================================
# Workflow 4: PII Detection and Redaction
# ============================================================

async def workflow_pii_detection():
    """
    Workflow focused on PII detection and redaction.
    """
    # Initialize the module
    security_module = SecurityComplianceModule("security_config.yaml")
    
    # Sample document with various PII
    document = Document(
        id="doc_with_pii",
        content=(
            "Customer Information:\n"
            "Name: John A. Smith\n"
            "Email: john.smith@example.com\n"
            "Phone: (555) 123-4567\n"
            "Address: 123 Main St, Anytown, CA 90210\n"
            "SSN: 123-45-6789\n"
            "DOB: 01/15/1980\n"
            "Credit Card: 4111-1111-1111-1111\n"
            "Bank Account: ACCT#: 12345678\n"
            "Medical Record: MRN-1234567\n"
        ),
        metadata={"title": "Customer Record"}
    )
    
    # 1. Only detect PII, no redaction
    processed_doc = await security_module.process_document(
        document=document,
        user_id="pii_detector",
        classify=False,
        detect_pii=True,
        redact_pii=False
    )
    
    print("PII Detection Results:")
    print(f"Document ID: {processed_doc.id}")
    print(f"PII Detected: {len(processed_doc.pii_matches)} instances")
    
    print("\nPII Matches:")
    for match in processed_doc.pii_matches:
        print(f"  - Type: {match.pii_type.value}")
        print(f"    Value: {match.value}")
        print(f"    Confidence: {match.confidence}")
    
    # 2. Try different redaction methods
    redaction_methods = [
        RedactionMethod.COMPLETE,
        RedactionMethod.MASK,
        RedactionMethod.TOKENIZE,
        RedactionMethod.ENCRYPT
    ]
    
    print("\nRedaction Examples:")
    for method in redaction_methods:
        redacted_doc = await security_module.process_document(
            document=document.copy(),
            user_id="pii_redactor",
            classify=False,
            detect_pii=True,
            redact_pii=True,
            redaction_method=method
        )
        
        print(f"\nRedaction Method: {method.value}")
        print("Redacted Content:")
        print(redacted_doc.redacted_content)
        print("----")


# ============================================================
# Workflow 5: Audit Logging and Compliance Reporting
# ============================================================

async def workflow_audit_logging():
    """
    Workflow focused on audit logging and compliance reporting.
    """
    # Initialize the module
    security_module = SecurityComplianceModule("security_config.yaml")
    
    # 1. Generate some activity to log
    document = Document(
        id="audit_test_doc",
        content="This is a test document for audit logging.",
        metadata={"title": "Audit Test"}
    )
    
    # Process the document to generate logs
    await security_module.process_document(
        document=document,
        user_id="audit_user",
        classify=True,
        detect_pii=True,
        redact_pii=True
    )
    
    # 2. Query the audit logs
    logs = await security_module.audit_logger.query_logs(
        event_types=[
            EventType.DOCUMENT_ACCESS,
            EventType.CLASSIFICATION,
            EventType.PII_DETECTION,
            EventType.REDACTION
        ],
        document_ids=["audit_test_doc"]
    )
    
    print("Audit Log Entries:")
    for log in logs:
        print(f"  - ID: {log.id}")
        print(f"    Timestamp: {log.timestamp}")
        print(f"    Event Type: {log.event_type.value}")
        print(f"    User: {log.user_id}")
        print(f"    Action: {log.action}")
        print(f"    Details: {log.details}")
        print("    ----")
    
    # 3. Generate a compliance report (simplified example)
    report = {
        "report_id": "COMP-2025-04",
        "generated_at": "2025-04-06T10:00:00",
        "report_type": "PII Processing Audit",
        "period": {
            "start": "2025-04-01T00:00:00",
            "end": "2025-04-06T23:59:59"
        },
        "summary": {
            "total_documents": 1,
            "documents_with_pii": 1,
            "pii_instances": len(document.pii_matches),
            "pii_types_detected": list(set(m.pii_type.value for m in document.pii_matches)),
            "redaction_events": sum(1 for log in logs if log.event_type == EventType.REDACTION)
        },
        "events": [
            {
                "timestamp": log.timestamp.isoformat(),
                "event_type": log.event_type.value,
                "user_id": log.user_id,
                "document_id": log.document_id,
                "action": log.action,
                "success": log.success
            }
            for log in logs
        ]
    }
    
    print("\nCompliance Report:")
    print(json.dumps(report, indent=2))
    
    # 4. Verify log integrity (tamper-proof check)
    integrity_results = await security_module.audit_logger.verify_logs(logs)
    
    print("\nLog Integrity Verification:")
    all_valid = all(integrity_results.values())
    print(f"All logs valid: {all_valid}")
    
    if not all_valid:
        for log_id, is_valid in integrity_results.items():
            if not is_valid:
                print(f"Warning: Log {log_id} may have been tampered with!")


# ============================================================
# Main Entry Point
# ============================================================

async def run_all_workflows():
    """Run all example workflows."""
    print("=== Workflow 1: Basic Document Processing ===")
    await workflow_document_processing()
    
    print("\n=== Workflow 2: API Usage ===")
    await workflow_api_usage()
    
    print("\n=== Workflow 3: Document Classification ===")
    await workflow_document_classification()
    
    print("\n=== Workflow 4: PII Detection and Redaction ===")
    await workflow_pii_detection()
    
    print("\n=== Workflow 5: Audit Logging and Compliance Reporting ===")
    await workflow_audit_logging()


if __name__ == "__main__":
    asyncio.run(run_all_workflows())
