"""
Security and Compliance Module for RFP Document Ingestion System
================================================================

This module implements robust security features while maintaining flexibility:
1. Document sensitivity classification
2. PII detection and optional redaction
3. Comprehensive audit logging

Author: Claude
Date: April 6, 2025
"""

import datetime
import hashlib
import json
import logging
import os
import re
import threading
import time
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple, Union

import yaml
from cryptography.fernet import Fernet
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field


# ============================================================
# CONSTANTS AND ENUMERATIONS
# ============================================================

class SensitivityLevel(str, Enum):
    """Document sensitivity classification levels."""
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"


class PIIType(str, Enum):
    """Types of Personally Identifiable Information (PII)."""
    NAME = "name"
    EMAIL = "email"
    PHONE = "phone"
    ADDRESS = "address"
    SSN = "ssn"
    DOB = "dob"
    CREDIT_CARD = "credit_card"
    BANK_ACCOUNT = "bank_account"
    PASSPORT = "passport"
    DRIVER_LICENSE = "driver_license"
    IP_ADDRESS = "ip_address"
    HEALTH_INFO = "health_info"
    FINANCIAL_INFO = "financial_info"
    CUSTOM = "custom"


class RedactionMethod(str, Enum):
    """Methods for redacting sensitive information."""
    COMPLETE = "complete"     # Complete removal
    MASK = "mask"             # Replace with asterisks or X's
    TOKENIZE = "tokenize"     # Replace with a token
    ENCRYPT = "encrypt"       # Encrypt the information


class EventType(str, Enum):
    """Types of events to be logged."""
    DOCUMENT_ACCESS = "document_access"
    DOCUMENT_MODIFY = "document_modify"
    CLASSIFICATION = "classification"
    PII_DETECTION = "pii_detection"
    REDACTION = "redaction"
    CONFIGURATION = "configuration"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    ERROR = "error"
    OTHER = "other"


# ============================================================
# DATA MODELS
# ============================================================

@dataclass
class PIIMatch:
    """Represents a matched PII instance in the document."""
    pii_type: PIIType
    value: str
    start_pos: int
    end_pos: int
    confidence: float
    redacted_value: Optional[str] = None
    redaction_method: Optional[RedactionMethod] = None


@dataclass
class Document:
    """Represents a document with its content and metadata."""
    id: str
    content: str
    metadata: Dict[str, Any]
    sensitivity_level: Optional[SensitivityLevel] = None
    pii_matches: List[PIIMatch] = field(default_factory=list)
    redacted_content: Optional[str] = None


@dataclass
class AuditLogEntry:
    """Represents an entry in the audit log."""
    id: str
    timestamp: datetime.datetime
    event_type: EventType
    user_id: str
    document_id: Optional[str]
    action: str
    details: Dict[str, Any]
    ip_address: Optional[str] = None
    success: bool = True
    hash_value: Optional[str] = None  # For tamper-proofing


class ModuleConfig(BaseModel):
    """Configuration for the Security and Compliance module."""
    enabled: bool = True
    sensitivity_classification: Dict[str, Any] = Field(default_factory=lambda: {
        "enabled": True,
        "default_level": SensitivityLevel.INTERNAL,
        "use_llm": True,
        "rule_patterns": {},
        "custom_schemes": {}
    })
    pii_detection: Dict[str, Any] = Field(default_factory=lambda: {
        "enabled": True,
        "default_redaction": RedactionMethod.MASK,
        "confidence_threshold": 0.7,
        "detection_types": [t.value for t in PIIType],
        "custom_patterns": {}
    })
    audit_logging: Dict[str, Any] = Field(default_factory=lambda: {
        "enabled": True,
        "tamper_proof": True,
        "retention_days": 365,
        "log_events": [t.value for t in EventType],
        "export_format": "json"
    })
    llm: Dict[str, Any] = Field(default_factory=lambda: {
        "provider": "together.ai",
        "model": "togethercomputer/llama-2-70b-chat",
        "api_key": "",
        "timeout": 10,
        "max_retries": 3
    })
    api: Dict[str, Any] = Field(default_factory=lambda: {
        "enabled": True,
        "rate_limit": 100,  # requests per minute
        "auth_required": True
    })
    encryption: Dict[str, Any] = Field(default_factory=lambda: {
        "enabled": True,
        "key_rotation_days": 90
    })
    storage: Dict[str, Any] = Field(default_factory=lambda: {
        "type": "file",  # can be "file", "database", "s3"
        "path": "./secure_storage",
        "connection_string": "",
        "bucket_name": ""
    })


class SecurityEvent(BaseModel):
    """Represents a security event for API responses."""
    event_id: str
    timestamp: datetime.datetime
    event_type: str
    document_id: Optional[str] = None
    user_id: str
    action: str
    success: bool
    details: Dict[str, Any] = {}


class APIResponse(BaseModel):
    """Standard API response format."""
    success: bool
    message: str
    data: Optional[Any] = None
    errors: List[str] = []


class ClassificationRequest(BaseModel):
    """Request to classify a document."""
    document_id: str
    sensitivity_level: SensitivityLevel
    justification: Optional[str] = None
    override_existing: bool = False


class PIIScanRequest(BaseModel):
    """Request to scan a document for PII."""
    document_id: str
    pii_types: List[PIIType] = []  # Empty means all types
    confidence_threshold: Optional[float] = None


class RedactionRequest(BaseModel):
    """Request to redact PII from a document."""
    document_id: str
    redaction_method: RedactionMethod
    pii_types: List[PIIType] = []  # Empty means all types
    custom_tokens: Dict[str, str] = {}  # For tokenization


class AuditLogRequest(BaseModel):
    """Request to retrieve audit logs."""
    start_time: Optional[datetime.datetime] = None
    end_time: Optional[datetime.datetime] = None
    event_types: List[EventType] = []
    document_ids: List[str] = []
    user_ids: List[str] = []
    limit: int = 100
    offset: int = 0


# ============================================================
# INTERFACES AND BASE CLASSES
# ============================================================

class LLMProvider(ABC):
    """Abstract base class for LLM providers."""
    
    @abstractmethod
    async def classify_sensitivity(self, document: Document) -> SensitivityLevel:
        """Classify document sensitivity using LLM."""
        pass
    
    @abstractmethod
    async def detect_pii(self, document: Document) -> List[PIIMatch]:
        """Detect PII in document using LLM."""
        pass


class StorageProvider(ABC):
    """Abstract base class for storage providers."""
    
    @abstractmethod
    async def save_document(self, document: Document) -> bool:
        """Save a document to storage."""
        pass
    
    @abstractmethod
    async def load_document(self, document_id: str) -> Optional[Document]:
        """Load a document from storage."""
        pass
    
    @abstractmethod
    async def save_audit_log(self, log_entry: AuditLogEntry) -> bool:
        """Save an audit log entry."""
        pass
    
    @abstractmethod
    async def query_audit_logs(self, query: Dict[str, Any]) -> List[AuditLogEntry]:
        """Query audit logs based on criteria."""
        pass


# ============================================================
# API IMPLEMENTATION
# ============================================================

class SecurityAPIRouter:
    """Implements the REST API for the Security and Compliance module."""
    
    def __init__(self, security_module: 'SecurityComplianceModule'):
        """Initialize the API router with the security module."""
        self.security_module = security_module
        self.router = APIRouter(prefix="/security", tags=["security"])
        self._setup_routes()
    
    def _setup_routes(self):
        """Set up the API routes."""
        # Document Classification
        self.router.post("/classify", response_model=APIResponse)(self.classify_document)
        
        # PII Detection
        self.router.post("/scan-pii", response_model=APIResponse)(self.scan_pii)
        
        # Redaction
        self.router.post("/redact", response_model=APIResponse)(self.redact_pii)
        
        # Audit Logs
        self.router.post("/audit-logs", response_model=APIResponse)(self.get_audit_logs)
        
        # Configuration
        self.router.get("/config", response_model=APIResponse)(self.get_config)
        self.router.put("/config", response_model=APIResponse)(self.update_config)
    
    async def classify_document(self, request: ClassificationRequest, user_info: Dict = Depends()):
        """Classify a document's sensitivity level."""
        try:
            # Get user ID from token
            user_id = user_info.get("user_id", "anonymous")
            
            # Load the document
            document = await self.security_module.storage_provider.load_document(request.document_id)
            if not document:
                return APIResponse(
                    success=False,
                    message=f"Document {request.document_id} not found",
                    errors=["Document not found"]
                )
            
            # Check if manual override is allowed
            if document.sensitivity_level and not request.override_existing:
                return APIResponse(
                    success=False,
                    message=f"Document already classified as {document.sensitivity_level}",
                    errors=["Document already classified"]
                )
            
            # Update sensitivity level
            document.sensitivity_level = request.sensitivity_level
            
            # Log the classification
            await self.security_module.audit_logger.log(
                user_id=user_id,
                event_type=EventType.CLASSIFICATION,
                document_id=document.id,
                action="manual_classification",
                details={
                    "level": request.sensitivity_level.value,
                    "justification": request.justification
                }
            )
            
            # Save the updated document
            await self.security_module.storage_provider.save_document(document)
            
            return APIResponse(
                success=True,
                message=f"Document classified as {request.sensitivity_level.value}",
                data={"document_id": document.id, "sensitivity_level": request.sensitivity_level.value}
            )
            
        except Exception as e:
            return APIResponse(
                success=False,
                message="Classification failed",
                errors=[str(e)]
            )
    
    async def scan_pii(self, request: PIIScanRequest, user_info: Dict = Depends()):
        """Scan a document for PII."""
        try:
            # Get user ID from token
            user_id = user_info.get("user_id", "anonymous")
            
            # Load the document
            document = await self.security_module.storage_provider.load_document(request.document_id)
            if not document:
                return APIResponse(
                    success=False,
                    message=f"Document {request.document_id} not found",
                    errors=["Document not found"]
                )
            
            # Set PII types to scan for
            pii_types = request.pii_types or [t for t in PIIType]
            
            # Override confidence threshold if provided
            original_threshold = self.security_module.pii_detector.confidence_threshold
            if request.confidence_threshold is not None:
                self.security_module.pii_detector.confidence_threshold = request.confidence_threshold
            
            # Detect PII
            document.pii_matches = await self.security_module.pii_detector.detect(document)
            
            # Reset confidence threshold
            if request.confidence_threshold is not None:
                self.security_module.pii_detector.confidence_threshold = original_threshold
            
            # Filter by requested types
            if pii_types:
                document.pii_matches = [
                    match for match in document.pii_matches
                    if match.pii_type in pii_types
                ]
            
            # Log the PII scan
            await self.security_module.audit_logger.log(
                user_id=user_id,
                event_type=EventType.PII_DETECTION,
                document_id=document.id,
                action="scan_pii",
                details={
                    "pii_count": len(document.pii_matches),
                    "pii_types": [t.value for t in pii_types]
                }
            )
            
            # Save the updated document
            await self.security_module.storage_provider.save_document(document)
            
            # Format response
            pii_results = [
                {
                    "type": match.pii_type.value,
                    "value": match.value,
                    "confidence": match.confidence,
                    "position": {"start": match.start_pos, "end": match.end_pos}
                }
                for match in document.pii_matches
            ]
            
            return APIResponse(
                success=True,
                message=f"Found {len(pii_results)} PII instances",
                data={
                    "document_id": document.id,
                    "pii_count": len(pii_results),
                    "pii_instances": pii_results
                }
            )
            
        except Exception as e:
            return APIResponse(
                success=False,
                message="PII scan failed",
                errors=[str(e)]
            )
    
    async def redact_pii(self, request: RedactionRequest, user_info: Dict = Depends()):
        """Redact PII from a document."""
        try:
            # Get user ID from token
            user_id = user_info.get("user_id", "anonymous")
            
            # Load the document
            document = await self.security_module.storage_provider.load_document(request.document_id)
            if not document:
                return APIResponse(
                    success=False,
                    message=f"Document {request.document_id} not found",
                    errors=["Document not found"]
                )
            
            # Check if document has PII matches
            if not document.pii_matches:
                return APIResponse(
                    success=False,
                    message="No PII detected in document",
                    errors=["No PII to redact"]
                )
            
            # Filter by requested types if specified
            if request.pii_types:
                filtered_matches = [
                    match for match in document.pii_matches
                    if match.pii_type in request.pii_types
                ]
                if not filtered_matches:
                    return APIResponse(
                        success=False,
                        message=f"No PII of requested types found",
                        errors=["No matching PII to redact"]
                    )
                document.pii_matches = filtered_matches
            
            # Redact the document
            document.redacted_content = await self.security_module.redactor.redact(
                document, request.redaction_method
            )
            
            # Log the redaction
            await self.security_module.audit_logger.log(
                user_id=user_id,
                event_type=EventType.REDACTION,
                document_id=document.id,
                action="redact_pii",
                details={
                    "method": request.redaction_method.value,
                    "pii_types": [t.value for t in request.pii_types] if request.pii_types else "all"
                }
            )
            
            # Save the updated document
            await self.security_module.storage_provider.save_document(document)
            
            return APIResponse(
                success=True,
                message=f"PII redacted using {request.redaction_method.value} method",
                data={
                    "document_id": document.id,
                    "redaction_method": request.redaction_method.value,
                    "redacted_count": len(document.pii_matches)
                }
            )
            
        except Exception as e:
            return APIResponse(
                success=False,
                message="Redaction failed",
                errors=[str(e)]
            )
    
    async def get_audit_logs(self, request: AuditLogRequest, user_info: Dict = Depends()):
        """Retrieve audit logs based on criteria."""
        try:
            # Get user ID from token
            user_id = user_info.get("user_id", "anonymous")
            
            # Query the logs
            logs = await self.security_module.audit_logger.query_logs(
                start_time=request.start_time,
                end_time=request.end_time,
                event_types=request.event_types,
                document_ids=request.document_ids,
                user_ids=request.user_ids,
                limit=request.limit,
                offset=request.offset
            )
            
            # Convert logs to API format
            events = [
                SecurityEvent(
                    event_id=log.id,
                    timestamp=log.timestamp,
                    event_type=log.event_type.value,
                    document_id=log.document_id,
                    user_id=log.user_id,
                    action=log.action,
                    success=log.success,
                    details=log.details
                )
                for log in logs
            ]
            
            # Log this audit log access
            await self.security_module.audit_logger.log(
                user_id=user_id,
                event_type=EventType.DOCUMENT_ACCESS,
                action="retrieve_audit_logs",
                details={
                    "query": {
                        "event_types": [et.value for et in request.event_types] if request.event_types else "all",
                        "document_ids": request.document_ids or "all",
                        "user_ids": request.user_ids or "all",
                        "start_time": request.start_time.isoformat() if request.start_time else "any",
                        "end_time": request.end_time.isoformat() if request.end_time else "any",
                        "limit": request.limit,
                        "offset": request.offset
                    },
                    "results_count": len(events)
                }
            )
            
            return APIResponse(
                success=True,
                message=f"Retrieved {len(events)} audit log entries",
                data={
                    "events": events,
                    "total_count": len(events),
                    "has_more": len(events) == request.limit
                }
            )
            
        except Exception as e:
            return APIResponse(
                success=False,
                message="Failed to retrieve audit logs",
                errors=[str(e)]
            )
    
    async def get_config(self, user_info: Dict = Depends()):
        """Get the current module configuration."""
        try:
            # Get user ID from token
            user_id = user_info.get("user_id", "anonymous")
            
            # Log the config access
            await self.security_module.audit_logger.log(
                user_id=user_id,
                event_type=EventType.CONFIGURATION,
                action="get_config",
            )
            
            # Remove sensitive information
            config_dict = self.security_module.config.dict()
            if "api_key" in config_dict.get("llm", {}):
                config_dict["llm"]["api_key"] = "***REDACTED***"
            
            return APIResponse(
                success=True,
                message="Configuration retrieved",
                data=config_dict
            )
            
        except Exception as e:
            return APIResponse(
                success=False,
                message="Failed to retrieve configuration",
                errors=[str(e)]
            )
    
    async def update_config(self, config: ModuleConfig, user_info: Dict = Depends()):
        """Update the module configuration."""
        try:
            # Get user ID from token
            user_id = user_info.get("user_id", "anonymous")
            
            # Record current config for diff
            old_config = self.security_module.config.dict()
            
            # Update the configuration
            self.security_module.config = config
            
            # Reinitialize components with new config
            self.security_module._init_providers()
            self.security_module._init_components()
            
            # Log the config update
            await self.security_module.audit_logger.log(
                user_id=user_id,
                event_type=EventType.CONFIGURATION,
                action="update_config",
                details={
                    "changed_sections": [
                        k for k in config.dict().keys()
                        if config.dict()[k] != old_config.get(k)
                    ]
                }
            )
            
            return APIResponse(
                success=True,
                message="Configuration updated",
                data={"status": "Configuration updated successfully"}
            )
            
        except Exception as e:
            return APIResponse(
                success=False,
                message="Failed to update configuration",
                errors=[str(e)]
            )


# ============================================================
# IMPLEMENTATION CLASSES
# ============================================================

class SecurityComplianceModule:
    """Main module class that orchestrates security and compliance features."""
    
    def __init__(self, config_path: str = None):
        """Initialize the module with configuration."""
        self.config = self._load_config(config_path)
        self._init_providers()
        self._init_components()
        self.logger = logging.getLogger("security_compliance")
    
    def _load_config(self, config_path: str = None) -> ModuleConfig:
        """Load configuration from file or use defaults."""
        if not config_path or not os.path.exists(config_path):
            return ModuleConfig()
        
        with open(config_path, 'r') as f:
            if config_path.endswith('.yaml') or config_path.endswith('.yml'):
                config_dict = yaml.safe_load(f)
            else:
                config_dict = json.load(f)
        
        return ModuleConfig(**config_dict)
    
    def _init_providers(self):
        """Initialize LLM and storage providers based on configuration."""
        # Initialize LLM provider
        llm_config = self.config.llm
        if llm_config["provider"] == "together.ai":
            self.llm_provider = TogetherAIProvider(llm_config)
        else:
            # Fallback to a generic LLM provider
            self.llm_provider = GenericLLMProvider(llm_config)
        
        # Initialize storage provider
        storage_config = self.config.storage
        if storage_config["type"] == "file":
            self.storage_provider = FileStorageProvider(storage_config)
        elif storage_config["type"] == "database":
            self.storage_provider = DatabaseStorageProvider(storage_config)
        elif storage_config["type"] == "s3":
            self.storage_provider = S3StorageProvider(storage_config)
        else:
            # Fallback to file storage
            self.storage_provider = FileStorageProvider(storage_config)
    
    def _init_components(self):
        """Initialize the main components of the module."""
        self.classifier = SensitivityClassifier(
            self.config.sensitivity_classification,
            self.llm_provider
        )
        
        self.pii_detector = PIIDetector(
            self.config.pii_detection,
            self.llm_provider
        )
        
        self.redactor = PIIRedactor(self.config.pii_detection)
        
        self.audit_logger = AuditLogger(
            self.config.audit_logging,
            self.storage_provider
        )
    
    async def process_document(self, document: Document, user_id: str, 
                              classify: bool = True, detect_pii: bool = True,
                              redact_pii: bool = False, 
                              redaction_method: RedactionMethod = RedactionMethod.MASK) -> Document:
        """Process a document through the security pipeline."""
        if not self.config.enabled:
            return document
        
        # Track the document processing
        await self.audit_logger.log(
            user_id=user_id,
            event_type=EventType.DOCUMENT_ACCESS,
            document_id=document.id,
            action="process_document",
            details={"classify": classify, "detect_pii": detect_pii, "redact_pii": redact_pii}
        )
        
        # Classify document sensitivity
        if classify and self.config.sensitivity_classification["enabled"]:
            try:
                document.sensitivity_level = await self.classifier.classify(document)
                
                await self.audit_logger.log(
                    user_id=user_id,
                    event_type=EventType.CLASSIFICATION,
                    document_id=document.id,
                    action="classify_sensitivity",
                    details={"level": document.sensitivity_level}
                )
            except Exception as e:
                await self.audit_logger.log(
                    user_id=user_id,
                    event_type=EventType.ERROR,
                    document_id=document.id,
                    action="classify_sensitivity",
                    details={"error": str(e)},
                    success=False
                )
                self.logger.error(f"Classification error for document {document.id}: {str(e)}")
        
        # Detect PII
        if detect_pii and self.config.pii_detection["enabled"]:
            try:
                document.pii_matches = await self.pii_detector.detect(document)
                
                await self.audit_logger.log(
                    user_id=user_id,
                    event_type=EventType.PII_DETECTION,
                    document_id=document.id,
                    action="detect_pii",
                    details={"pii_count": len(document.pii_matches)}
                )
                
                # Redact PII if requested
                if redact_pii and document.pii_matches:
                    document.redacted_content = await self.redactor.redact(
                        document, redaction_method
                    )
                    
                    await self.audit_logger.log(
                        user_id=user_id,
                        event_type=EventType.REDACTION,
                        document_id=document.id,
                        action="redact_pii",
                        details={"method": redaction_method.value}
                    )
            except Exception as e:
                await self.audit_logger.log(
                    user_id=user_id,
                    event_type=EventType.ERROR,
                    document_id=document.id,
                    action="pii_operations",
                    details={"error": str(e)},
                    success=False
                )
                self.logger.error(f"PII operation error for document {document.id}: {str(e)}")
        
        # Save the processed document
        await self.storage_provider.save_document(document)
        
        return document
    
    def create_api_router(self) -> APIRouter:
        """Create a FastAPI router for the module's API endpoints."""
        return SecurityAPIRouter(self).router


class SensitivityClassifier:
    """Handles document sensitivity classification."""
    
    def __init__(self, config: Dict[str, Any], llm_provider: LLMProvider):
        """Initialize the classifier with configuration."""
        self.config = config
        self.llm_provider = llm_provider
        self.default_level = SensitivityLevel(config["default_level"])
        self.rule_patterns = config["rule_patterns"]
        self.use_llm = config["use_llm"]
    
    async def classify(self, document: Document) -> SensitivityLevel:
        """Classify a document's sensitivity level."""
        if not self.config["enabled"]:
            return self.default_level
        
        # Try rule-based classification first
        rule_result = self._apply_rules(document)
        if rule_result:
            return rule_result
        
        # Use LLM for classification if configured
        if self.use_llm:
            try:
                llm_result = await self.llm_provider.classify_sensitivity(document)
                return llm_result
            except Exception as e:
                logging.error(f"LLM classification error: {str(e)}")
        
        # Fallback to default level
        return self.default_level
    
    def _apply_rules(self, document: Document) -> Optional[SensitivityLevel]:
        """Apply rule-based patterns to classify document."""
        for level, patterns in self.rule_patterns.items():
            sensitivity_level = SensitivityLevel(level)
            for pattern in patterns:
                if re.search(pattern, document.content, re.IGNORECASE):
                    return sensitivity_level
        
        return None
    
    async def manual_classify(self, document_id: str, level: SensitivityLevel, 
                             user_id: str, justification: str = None) -> bool:
        """Manually classify a document with justification."""
        # Implementation would retrieve document, update classification, and log
        return True


class PIIDetector:
    """Detects PII in documents using patterns and LLM."""
    
    def __init__(self, config: Dict[str, Any], llm_provider: LLMProvider):
        """Initialize the PII detector with configuration."""
        self.config = config
        self.llm_provider = llm_provider
        self.confidence_threshold = config["confidence_threshold"]
        self.detection_types = [PIIType(t) for t in config["detection_types"]]
        self.custom_patterns = config["custom_patterns"]
        
        # Compile common PII regex patterns
        self.patterns = self._compile_patterns()
    
    def _compile_patterns(self) -> Dict[PIIType, List[re.Pattern]]:
        """Compile regex patterns for PII detection."""
        patterns = {
            PIIType.EMAIL: [
                re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
            ],
            PIIType.PHONE: [
                re.compile(r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b'),  # US format
                re.compile(r'\b\+\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b')  # International
            ],
            PIIType.SSN: [
                re.compile(r'\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b')
            ],
            PIIType.CREDIT_CARD: [
                re.compile(r'\b(?:\d{4}[-.\s]?){3}\d{4}\b')
            ],
            PIIType.DOB: [
                re.compile(r'\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b')
            ]
        }
        
        # Add custom patterns
        for pii_type, custom_patterns in self.custom_patterns.items():
            if pii_type not in patterns:
                patterns[PIIType(pii_type)] = []
            
            for pattern in custom_patterns:
                patterns[PIIType(pii_type)].append(re.compile(pattern))
        
        return patterns
    
    async def detect(self, document: Document) -> List[PIIMatch]:
        """Detect PII in a document."""
        if not self.config["enabled"]:
            return []
        
        pii_matches = []
        
        # Rule-based detection
        for pii_type, pattern_list in self.patterns.items():
            if pii_type not in self.detection_types:
                continue
                
            for pattern in pattern_list:
                for match in pattern.finditer(document.content):
                    pii_matches.append(PIIMatch(
                        pii_type=pii_type,
                        value=match.group(),
                        start_pos=match.start(),
                        end_pos=match.end(),
                        confidence=0.95  # High confidence for regex matches
                    ))
        
        # LLM-based detection for more complex PII types
        complex_types = [PIIType.NAME, PIIType.ADDRESS, PIIType.HEALTH_INFO, PIIType.FINANCIAL_INFO]
        detected_complex = [t for t in complex_types if t in self.detection_types]
        
        if detected_complex:
            try:
                llm_matches = await self.llm_provider.detect_pii(document)
                for match in llm_matches:
                    if match.confidence >= self.confidence_threshold:
                        pii_matches.append(match)
            except Exception as e:
                logging.error(f"LLM PII detection error: {str(e)}")
        
        return pii_matches


class PIIRedactor:
    """Redacts PII in documents using various methods."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize the redactor with configuration."""
        self.config = config
        self.default_method = RedactionMethod(config["default_redaction"])
        
        # Initialize encryption if needed
        if self.default_method == RedactionMethod.ENCRYPT:
            self.encryption_key = Fernet.generate_key()
            self.cipher_suite = Fernet(self.encryption_key)
    
    async def redact(self, document: Document, 
                    method: RedactionMethod = None) -> str:
        """Redact PII in a document using the specified method."""
        if not self.config["enabled"] or not document.pii_matches:
            return document.content
        
        method = method or self.default_method
        content = document.content
        
        # Sort matches by position in reverse order to avoid offset changes
        matches = sorted(document.pii_matches, key=lambda m: m.start_pos, reverse=True)
        
        for match in matches:
            redacted_value = self._apply_redaction(match.value, method)
            match.redacted_value = redacted_value
            match.redaction_method = method
            
            # Replace in content
            content = content[:match.start_pos] + redacted_value + content[match.end_pos:]
        
        return content
    
    def _apply_redaction(self, value: str, method: RedactionMethod) -> str:
        """Apply the specific redaction method to a value."""
        if method == RedactionMethod.COMPLETE:
            return "[REDACTED]"
        
        elif method == RedactionMethod.MASK:
            # Keep first and last character, mask the rest
            if len(value) <= 2:
                return "X" * len(value)
            return value[0] + "X" * (len(value) - 2) + value[-1]
        
        elif method == RedactionMethod.TOKENIZE:
            # Replace with a token that can be reversed if needed
            token = hashlib.sha256(value.encode()).hexdigest()[:8]
            return f"[TOKEN:{token}]"
        
        elif method == RedactionMethod.ENCRYPT:
            # Encrypt the value
            encrypted = self.cipher_suite.encrypt(value.encode()).decode()
            return f"[ENCRYPTED:{encrypted[:10]}...]"
        
        # Fallback
        return "[REDACTED]"


class AuditLogger:
    """Handles comprehensive audit logging of security events."""
    
    def __init__(self, config: Dict[str, Any], storage_provider: StorageProvider):
        """Initialize the audit logger with configuration."""
        self.config = config
        self.storage_provider = storage_provider
        self.log_events = [EventType(t) for t in config["log_events"]]
        self.tamper_proof = config["tamper_proof"]
        self.retention_days = config["retention_days"]
        
        # Initialize logging
        self.logger = logging.getLogger("audit_logger")
        
        # Store previous hash for tamper-proofing
        self.previous_hash = None
        self.hash_lock = threading.Lock()
    
    async def log(self, user_id: str, event_type: EventType, action: str, 
                 document_id: str = None, details: Dict[str, Any] = None,
                 ip_address: str = None, success: bool = True) -> AuditLogEntry:
        """Log a security event."""
        if not self.config["enabled"] or event_type not in self.log_events:
            return None
        
        timestamp = datetime.datetime.now()
        log_id = str(uuid.uuid4())
        
        # Create the log entry
        log_entry = AuditLogEntry(
            id=log_id,
            timestamp=timestamp,
            event_type=event_type,
            user_id=user_id,
            document_id=document_id,
            action=action,
            details=details or {},
            ip_address=ip_address,
            success=success
        )
        
        # Add tamper-proof hash if enabled
        if self.tamper_proof:
            with self.hash_lock:
                log_entry.hash_value = self._compute_hash(log_entry, self.previous_hash)
                self.previous_hash = log_entry.hash_value
        
        # Save to storage
        await self.storage_provider.save_audit_log(log_entry)
        
        # Also log to standard logging
        log_msg = f"EVENT: {event_type.value}, USER: {user_id}, ACTION: {action}"
        if document_id:
            log_msg += f", DOCUMENT: {document_id}"
        if not success:
            self.logger.warning(log_msg)
        else:
            self.logger.info(log_msg)
        
        return log_entry
    
    def _compute_hash(self, log_entry: AuditLogEntry, previous_hash: str = None) -> str:
        """Compute a tamper-proof hash for the log entry."""
        # Create a string representation of the log entry
        entry_str = (
            f"{log_entry.id}|{log_entry.timestamp}|{log_entry.event_type}|"
            f"{log_entry.user_id}|{log_entry.document_id or ''}|{log_entry.action}|"
            f"{json.dumps(log_entry.details, sort_keys=True)}|{log_entry.success}"
        )
        
        # Include previous hash if available for chain of custody
        if previous_hash:
            entry_str = f"{previous_hash}|{entry_str}"
        
        # Compute hash
        return hashlib.sha256(entry_str.encode()).hexdigest()
    
    async def query_logs(self, start_time: datetime.datetime = None, 
                        end_time: datetime.datetime = None,
                        event_types: List[EventType] = None,
                        document_ids: List[str] = None,
                        user_ids: List[str] = None,
                        limit: int = 100, offset: int = 0) -> List[AuditLogEntry]:
        """Query audit logs based on criteria."""
        if not self.config["enabled"]:
            return []
        
        query = {}
        
        if start_time:
            query["start_time"] = start_time
        
        if end_time:
            query["end_time"] = end_time
        
        if event_types:
            query["event_types"] = event_types
        
        if document_ids:
            query["document_ids"] = document_ids
        
        if user_ids:
            query["user_ids"] = user_ids
        
        query["limit"] = limit
        query["offset"] = offset
        
        return await self.storage_provider.query_audit_logs(query)
    
    async def verify_logs(self, logs: List[AuditLogEntry]) -> Dict[str, bool]:
        """Verify the integrity of a sequence of logs."""
        if not self.tamper_proof:
            return {log.id: True for log in logs}
        
        result = {}
        previous_hash = None
        
        for log in sorted(logs, key=lambda x: x.timestamp):
            computed_hash = self._compute_hash(log, previous_hash)
            result[log.id] = (computed_hash == log.hash_value)
            previous_hash = log.hash_value
        
        return result


# ============================================================
# IMPLEMENTATION OF PROVIDERS
# ============================================================

class GenericLLMProvider(LLMProvider):
    """Generic LLM provider implementation that can be configured for different backends."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize the generic LLM provider."""
        self.config = config
        self.provider = config["provider"]
        self.model = config["model"]
        self.api_key = config["api_key"]
        self.timeout = config.get("timeout", 10)
        self.max_retries = config.get("max_retries", 3)
    
    async def classify_sensitivity(self, document: Document) -> SensitivityLevel:
        """Classify document sensitivity using configured LLM."""
        # Simplified implementation for demonstration
        # In a real implementation, this would call the appropriate API based on provider
        
        # Fallback to rule-based classification if LLM is unavailable
        keywords = {
            SensitivityLevel.PUBLIC: ["public", "press release", "announcement"],
            SensitivityLevel.INTERNAL: ["internal", "staff", "team", "employees only"],
            SensitivityLevel.CONFIDENTIAL: ["confidential", "sensitive", "private"],
            SensitivityLevel.RESTRICTED: ["restricted", "highly confidential", "top secret"]
        }
        
        # Simple keyword matching as fallback
        for level, terms in keywords.items():
            for term in terms:
                if term.lower() in document.content.lower():
                    return level
        
        # Default level
        return SensitivityLevel.INTERNAL
    
    async def detect_pii(self, document: Document) -> List[PIIMatch]:
        """Detect PII in document using configured LLM."""
        # Simplified implementation for demonstration
        # Real implementation would use the configured LLM API
        
        # Fallback to simple pattern matching
        pii_matches = []
        
        # Simple patterns for demonstration
        patterns = {
            PIIType.EMAIL: r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            PIIType.PHONE: r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b',
            PIIType.SSN: r'\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b',
        }
        
        for pii_type, pattern in patterns.items():
            for match in re.finditer(pattern, document.content):
                pii_matches.append(PIIMatch(
                    pii_type=pii_type,
                    value=match.group(),
                    start_pos=match.start(),
                    end_pos=match.end(),
                    confidence=0.8  # Medium confidence for fallback detection
                ))
        
        return pii_matches

class FileStorageProvider(StorageProvider):
    """Storage provider implementation using local file system."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize the file storage provider."""
        self.config = config
        self.base_path = config["path"]
        
        # Create directories if they don't exist
        os.makedirs(os.path.join(self.base_path, "documents"), exist_ok=True)
        os.makedirs(os.path.join(self.base_path, "audit_logs"), exist_ok=True)
    
    async def save_document(self, document: Document) -> bool:
        """Save a document to file storage."""
        try:
            file_path = os.path.join(self.base_path, "documents", f"{document.id}.json")
            
            # Convert document to dict for serialization
            doc_dict = {
                "id": document.id,
                "content": document.content,
                "metadata": document.metadata,
                "sensitivity_level": document.sensitivity_level.value if document.sensitivity_level else None,
                "redacted_content": document.redacted_content,
                "pii_matches": [
                    {
                        "pii_type": match.pii_type.value,
                        "value": match.value,
                        "start_pos": match.start_pos,
                        "end_pos": match.end_pos,
                        "confidence": match.confidence,
                        "redacted_value": match.redacted_value,
                        "redaction_method": match.redaction_method.value if match.redaction_method else None
                    }
                    for match in document.pii_matches
                ]
            }
            
            with open(file_path, 'w') as f:
                json.dump(doc_dict, f, indent=2)
            
            return True
        except Exception as e:
            logging.error(f"Error saving document {document.id}: {str(e)}")
            return False
    
    async def load_document(self, document_id: str) -> Optional[Document]:
        """Load a document from file storage."""
        try:
            file_path = os.path.join(self.base_path, "documents", f"{document_id}.json")
            
            if not os.path.exists(file_path):
                return None
            
            with open(file_path, 'r') as f:
                doc_dict = json.load(f)
            
            # Convert dict back to Document object
            document = Document(
                id=doc_dict["id"],
                content=doc_dict["content"],
                metadata=doc_dict["metadata"],
                sensitivity_level=SensitivityLevel(doc_dict["sensitivity_level"]) if doc_dict["sensitivity_level"] else None,
                redacted_content=doc_dict["redacted_content"]
            )
            
            # Convert PIIMatch dicts back to objects
            document.pii_matches = [
                PIIMatch(
                    pii_type=PIIType(match["pii_type"]),
                    value=match["value"],
                    start_pos=match["start_pos"],
                    end_pos=match["end_pos"],
                    confidence=match["confidence"],
                    redacted_value=match["redacted_value"],
                    redaction_method=RedactionMethod(match["redaction_method"]) if match["redaction_method"] else None
                )
                for match in doc_dict["pii_matches"]
            ]
            
            return document
        except Exception as e:
            logging.error(f"Error loading document {document_id}: {str(e)}")
            return None
    
    async def save_audit_log(self, log_entry: AuditLogEntry) -> bool:
        """Save an audit log entry."""
        try:
            # Create a filename with timestamp for chronological ordering
            timestamp_str = log_entry.timestamp.strftime("%Y%m%d%H%M%S")
            file_path = os.path.join(
                self.base_path, "audit_logs", 
                f"{timestamp_str}_{log_entry.id}.json"
            )
            
            # Convert log entry to dict for serialization
            log_dict = {
                "id": log_entry.id,
                "timestamp": log_entry.timestamp.isoformat(),
                "event_type": log_entry.event_type.value,
                "user_id": log_entry.user_id,
                "document_id": log_entry.document_id,
                "action": log_entry.action,
                "details": log_entry.details,
                "ip_address": log_entry.ip_address,
                "success": log_entry.success,
                "hash_value": log_entry.hash_value
            }
            
            with open(file_path, 'w') as f:
                json.dump(log_dict, f, indent=2)
            
            return True
        except Exception as e:
            logging.error(f"Error saving audit log {log_entry.id}: {str(e)}")
            return False
    
    async def query_audit_logs(self, query: Dict[str, Any]) -> List[AuditLogEntry]:
        """Query audit logs based on criteria."""
        logs = []
        
        try:
            logs_dir = os.path.join(self.base_path, "audit_logs")
            
            # Get all log files
            log_files = sorted([f for f in os.listdir(logs_dir) if f.endswith('.json')])
            
            for file_name in log_files:
                file_path = os.path.join(logs_dir, file_name)
                
                with open(file_path, 'r') as f:
                    log_dict = json.load(f)
                
                # Apply filters
                if self._matches_criteria(log_dict, query):
                    log_entry = AuditLogEntry(
                        id=log_dict["id"],
                        timestamp=datetime.datetime.fromisoformat(log_dict["timestamp"]),
                        event_type=EventType(log_dict["event_type"]),
                        user_id=log_dict["user_id"],
                        document_id=log_dict["document_id"],
                        action=log_dict["action"],
                        details=log_dict["details"],
                        ip_address=log_dict["ip_address"],
                        success=log_dict["success"],
                        hash_value=log_dict["hash_value"]
                    )
                    logs.append(log_entry)
                
                # Apply limit and offset
                if len(logs) >= query.get("offset", 0) + query.get("limit", 100):
                    break
            
            # Apply offset and limit
            offset = query.get("offset", 0)
            limit = query.get("limit", 100)
            return logs[offset:offset+limit]
            
        except Exception as e:
            logging.error(f"Error querying audit logs: {str(e)}")
            return []
    
    def _matches_criteria(self, log_dict: Dict[str, Any], query: Dict[str, Any]) -> bool:
        """Check if a log entry matches the query criteria."""
        # Check start_time
        if "start_time" in query:
            log_time = datetime.datetime.fromisoformat(log_dict["timestamp"])
            if log_time < query["start_time"]:
                return False
        
        # Check end_time
        if "end_time" in query:
            log_time = datetime.datetime.fromisoformat(log_dict["timestamp"])
            if log_time > query["end_time"]:
                return False
        
        # Check event_types
        if "event_types" in query and query["event_types"]:
            if log_dict["event_type"] not in [et.value for et in query["event_types"]]:
                return False
        
        # Check document_ids
        if "document_ids" in query and query["document_ids"]:
            if not log_dict["document_id"] or log_dict["document_id"] not in query["document_ids"]:
                return False
        
        # Check user_ids
        if "user_ids" in query and query["user_ids"]:
            if log_dict["user_id"] not in query["user_ids"]:
                return False
        
        return True


class DatabaseStorageProvider(StorageProvider):
    """Storage provider implementation using a database."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize the database storage provider."""
        self.config = config
        self.connection_string = config["connection_string"]
        
        # This is a placeholder - in a real implementation, 
        # you would initialize your database connection here
        self.db = None
    
    async def save_document(self, document: Document) -> bool:
        """Save a document to the database."""
        # Placeholder implementation
        return True
    
    async def load_document(self, document_id: str) -> Optional[Document]:
        """Load a document from the database."""
        # Placeholder implementation
        return None
    
    async def save_audit_log(self, log_entry: AuditLogEntry) -> bool:
        """Save an audit log entry to the database."""
        # Placeholder implementation
        return True
    
    async def query_audit_logs(self, query: Dict[str, Any]) -> List[AuditLogEntry]:
        """Query audit logs from the database based on criteria."""
        # Placeholder implementation
        return []


class S3StorageProvider(StorageProvider):
    """Storage provider implementation using AWS S3."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize the S3 storage provider."""
        self.config = config
        self.bucket_name = config["bucket_name"]
        
        # This is a placeholder - in a real implementation, 
        # you would initialize your S3 client here
        self.s3_client = None
    
    async def save_document(self, document: Document) -> bool:
        """Save a document to S3."""
        # Placeholder implementation
        return True
    
    async def load_document(self, document_id: str) -> Optional[Document]:
        """Load a document from S3."""
        # Placeholder implementation
        return None
    
    async def save_audit_log(self, log_entry: AuditLogEntry) -> bool:
        """Save an audit log entry to S3."""
        # Placeholder implementation
        return True
    
    async def query_audit_logs(self, query: Dict[str, Any]) -> List[AuditLogEntry]:
        """Query audit logs from S3 based on criteria."""
        # Placeholder implementation
        return []


class TogetherAIProvider(LLMProvider):
    """LLM provider implementation for Together.ai."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize the Together.ai provider."""
        self.config = config
        self.api_key = config["api_key"]
        self.model = config["model"]
        self.timeout = config.get("timeout", 10)
        self.max_retries = config.get("max_retries", 3)
        
        # Import Together.ai client if available
        try:
            import together
            self.client = together
            self.client.api_key = self.api_key
        except ImportError:
            logging.warning("Together.ai package not found, using mock implementation")
            self.client = None
    
    async def classify_sensitivity(self, document: Document) -> SensitivityLevel:
        """Classify document sensitivity using Together.ai."""
        if not self.client:
            return SensitivityLevel.INTERNAL
        
        # Create prompt for sensitivity classification
        prompt = f"""
        Your task is to classify the sensitivity level of the following document content.
        
        Document content:
        ---
        {document.content[:1000]}  # Limit to first 1000 chars for efficiency
        ---
        
        Classify the sensitivity as one of:
        - PUBLIC: Content that can be shared with the general public
        - INTERNAL: Content for internal use only
        - CONFIDENTIAL: Sensitive content with restricted access
        - RESTRICTED: Highly sensitive content with very limited access
        
        Output only the classification without explanation.
        """
        
        # Call LLM
        for attempt in range(self.max_retries):
            try:
                response = self.client.Completion.create(
                    model=self.model,
                    prompt=prompt,
                    max_tokens=10,
                    temperature=0.1
                )
                
                output = response.choices[0].text.strip().upper()
                
                # Map to SensitivityLevel
                for level in SensitivityLevel:
                    if level.value.upper() in output:
                        return level
                
                # Default if no match
                return SensitivityLevel.INTERNAL
                
            except Exception as e:
                logging.error(f"Together.ai API error (attempt {attempt+1}): {str(e)}")
                if attempt == self.max_retries - 1:
                    raise
                time.sleep(1)  # Wait before retry
    
    async def detect_pii(self, document: Document) -> List[PIIMatch]:
        """Detect PII in document using Together.ai."""
        if not self.client:
            return []
        
        # Create prompt for PII detection
        prompt = f"""
        Your task is to identify personally identifiable information (PII) in the following document.
        
        Document content:
        ---
        {document.content[:3000]}  # Limit to first 3000 chars for efficiency
        ---
        
        For each PII instance you find, provide:
        1. Type (NAME, ADDRESS, HEALTH_INFO, FINANCIAL_INFO)
        2. The exact text
        3. Start position in the document (as best you can)
        4. End position in the document (as best you can)
        5. Confidence score (0.0 to 1.0)
        
        Output each finding on a new line with format:
        TYPE|TEXT|START|END|CONFIDENCE
        """
        
        # Call LLM
        for attempt in range(self.max_retries):
            try:
                response = self.client.Completion.create(
                    model=self.model,
                    prompt=prompt,
                    max_tokens=300,
                    temperature=0.1
                )
                
                output = response.choices[0].text.strip()
                
                # Parse response
                pii_matches = []
                for line in output.split('\n'):
                    if '|' not in line:
                        continue
                    
                    parts = line.split('|')
                    if len(parts) != 5:
                        continue
                    
                    try:
                        pii_type = PIIType(parts[0].strip().lower())
                        text = parts[1].strip()
                        start = int(parts[2].strip())
                        end = int(parts[3].strip())
                        confidence = float(parts[4].strip())
                        
                        pii_matches.append(PIIMatch(
                            pii_type=pii_type,
                            value=text,
                            start_pos=start,
                            end_pos=end,
                            confidence=confidence
                        ))
                    except (ValueError, KeyError):
                        continue
                
                return pii_matches
                
            except Exception as e:
                logging.error(f"Together.ai API error (attempt {attempt+1}): {str(e)}")
                if attempt == self.max_retries - 1:
                    raise
                time.sleep(1)  # Wait before retry