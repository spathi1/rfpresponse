# Recommendations for Secure Storage of Sensitive Information

This document provides recommendations for securely storing sensitive information
processed by the Security and Compliance module.

## 1. Encryption Recommendations

### 1.1 Data-at-Rest Encryption

All sensitive data at rest should be encrypted using industry-standard encryption:

```python
# Example implementation of data-at-rest encryption
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
import base64
import os

class DataEncryptor:
    def __init__(self, master_key=None, salt=None):
        # Generate or use provided master key
        if not master_key:
            self.master_key = os.urandom(32)  # 256-bit key
        else:
            self.master_key = master_key
            
        # Generate or use provided salt
        if not salt:
            self.salt = os.urandom(16)
        else:
            self.salt = salt
        
        # Derive key using PBKDF2
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=self.salt,
            iterations=100000,
        )
        
        derived_key = base64.urlsafe_b64encode(kdf.derive(self.master_key))
        self.cipher = Fernet(derived_key)
    
    def encrypt(self, data):
        """Encrypt data"""
        if isinstance(data, str):
            data = data.encode()
        return self.cipher.encrypt(data)
    
    def decrypt(self, encrypted_data):
        """Decrypt data"""
        return self.cipher.decrypt(encrypted_data)
```

### 1.2 Key Management

For secure key management:

1. **Separation of Keys**: Store encryption keys separate from encrypted data
2. **Key Rotation**: Implement automatic key rotation every 90 days
3. **Master Key Storage**: Store master keys in a hardware security module (HSM) or key vault
4. **Environment Isolation**: Use different keys for development, staging, and production

```python
# Example key rotation implementation
import datetime
import json
import os

class KeyManager:
    def __init__(self, key_storage_path, rotation_days=90):
        self.key_storage_path = key_storage_path
        self.rotation_days = rotation_days
        os.makedirs(key_storage_path, exist_ok=True)
        
        # Load or create keys
        self.keys = self._load_keys()
        if not self.keys or self._needs_rotation():
            self._rotate_keys()
    
    def _load_keys(self):
        key_file = os.path.join(self.key_storage_path, "keys.json")
        if os.path.exists(key_file):
            with open(key_file, 'r') as f:
                keys_data = json.load(f)
                # Convert date strings back to datetime objects
                keys_data["created"] = datetime.datetime.fromisoformat(keys_data["created"])
                return keys_data
        return None
    
    def _save_keys(self):
        key_file = os.path.join(self.key_storage_path, "keys.json")
        
        # Convert datetime to string for JSON serialization
        json_keys = {
            "current_key": self.keys["current_key"],
            "previous_key": self.keys["previous_key"],
            "created": self.keys["created"].isoformat()
        }
        
        with open(key_file, 'w') as f:
            json.dump(json_keys, f)
    
    def _needs_rotation(self):
        created_date = self.keys["created"]
        now = datetime.datetime.now()
        return (now - created_date).days >= self.rotation_days
    
    def _rotate_keys(self):
        # Preserve previous key for decrypting old data
        previous_key = self.keys["current_key"] if self.keys else None
        
        # Generate new key
        new_key = base64.urlsafe_b64encode(os.urandom(32)).decode()
        
        self.keys = {
            "current_key": new_key,
            "previous_key": previous_key,
            "created": datetime.datetime.now()
        }
        
        self._save_keys()
        
        # Log key rotation event
        print(f"Key rotated at {self.keys['created']}")
        
        return new_key
    
    def get_current_key(self):
        if self._needs_rotation():
            self._rotate_keys()
        return self.keys["current_key"]
    
    def get_previous_key(self):
        return self.keys["previous_key"]
```

## 2. Database Security Recommendations

When storing sensitive information in a database:

### 2.1 Database Encryption

```python
# Example SQLAlchemy model with encrypted fields
from sqlalchemy import Column, Integer, String, LargeBinary
from sqlalchemy.ext.declarative import declarative_base
from encryption_manager import DataEncryptor

Base = declarative_base()
encryptor = DataEncryptor()

class SecureDocument(Base):
    __tablename__ = 'secure_documents'
    
    id = Column(Integer, primary_key=True)
    document_id = Column(String, unique=True, nullable=False)
    title = Column(String)
    # Encrypted fields
    content_encrypted = Column(LargeBinary)
    metadata_encrypted = Column(LargeBinary)
    
    @property
    def content(self):
        if self.content_encrypted:
            return encryptor.decrypt(self.content_encrypted).decode()
        return None
    
    @content.setter
    def content(self, value):
        if value:
            self.content_encrypted = encryptor.encrypt(value.encode())
        else:
            self.content_encrypted = None
    
    @property
    def metadata(self):
        if self.metadata_encrypted:
            return json.loads(encryptor.decrypt(self.metadata_encrypted).decode())
        return {}
    
    @metadata.setter
    def metadata(self, value):
        if value:
            self.metadata_encrypted = encryptor.encrypt(json.dumps(value).encode())
        else:
            self.metadata_encrypted = None
```

### 2.2 Database Configuration

1. **Connection Security**: Always use TLS/SSL for database connections
2. **Access Controls**: Implement strict role-based access control
3. **Audit Logging**: Enable database-level audit logging
4. **Secure Configuration**: Disable unnecessary features and extensions

```python
# Example secure database connection
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

def get_secure_db_session():
    # Connection with SSL and minimal connection pool
    engine = create_engine(
        "postgresql+psycopg2://user:password@hostname/dbname",
        connect_args={
            "sslmode": "require",
            "sslrootcert": "/path/to/ca.pem",
            "sslcert": "/path/to/client.pem",
            "sslkey": "/path/to/client.key"
        },
        pool_size=5,
        max_overflow=10,
        pool_recycle=3600
    )
    
    Session = sessionmaker(bind=engine)
    return Session()
```

## 3. File Storage Recommendations

For file-based storage of sensitive information:

### 3.1 Secure File Structure

```
/secure_storage/
  ├── documents/
  │   ├── <document_id>.enc       # Encrypted document content
  │   └── <document_id>.meta.enc  # Encrypted metadata
  ├── audit_logs/
  │   ├── <timestamp>_<log_id>.log  # Tamper-proof logs
  │   └── verification_chain.hash   # Hash chain for verification
  ├── keys/
  │   ├── active/                 # Current encryption keys
  │   └── archive/                # Archived keys for decrypting old data
  └── config/
      └── security_config.yaml    # Configuration (with sensitive values encrypted)
```

### 3.2 Secure File Operations

```python
# Example of secure file operations
import os
import json
import shutil
from encryption_manager import DataEncryptor

class SecureFileStorage:
    def __init__(self, base_path, encryptor):
        self.base_path = base_path
        self.encryptor = encryptor
        
        # Create directory structure
        os.makedirs(os.path.join(base_path, "documents"), exist_ok=True)
        os.makedirs(os.path.join(base_path, "audit_logs"), exist_ok=True)
        
        # Set secure permissions
        self._secure_permissions(base_path)
    
    def _secure_permissions(self, path):
        """Set secure permissions on files and directories"""
        # For directories: 0o700 (rwx------)
        # For files: 0o600 (rw-------)
        if os.path.isdir(path):
            os.chmod(path, 0o700)
            for root, dirs, files in os.walk(path):
                for d in dirs:
                    os.chmod(os.path.join(root, d), 0o700)
                for f in files:
                    os.chmod(os.path.join(root, f), 0o600)
    
    def save_document(self, document_id, content, metadata):
        """Save document with encrypted content and metadata"""
        doc_path = os.path.join(self.base_path, "documents", f"{document_id}.enc")
        meta_path = os.path.join(self.base_path, "documents", f"{document_id}.meta.enc")
        
        # Encrypt content
        encrypted_content = self.encryptor.encrypt(content.encode())
        with open(doc_path, 'wb') as f:
            f.write(encrypted_content)
        
        # Encrypt metadata
        encrypted_metadata = self.encryptor.encrypt(json.dumps(metadata).encode())
        with open(meta_path, 'wb') as f:
            f.write(encrypted_metadata)
        
        # Set secure permissions
        os.chmod(doc_path, 0o600)
        os.chmod(meta_path, 0o600)
        
        return True
    
    def load_document(self, document_id):
        """Load and decrypt document"""
        doc_path = os.path.join(self.base_path, "documents", f"{document_id}.enc")
        meta_path = os.path.join(self.base_path, "documents", f"{document_id}.meta.enc")
        
        if not os.path.exists(doc_path) or not os.path.exists(meta_path):
            return None
        
        # Decrypt content
        with open(doc_path, 'rb') as f:
            encrypted_content = f.read()
        content = self.encryptor.decrypt(encrypted_content).decode()
        
        # Decrypt metadata
        with open(meta_path, 'rb') as f:
            encrypted_metadata = f.read()
        metadata = json.loads(self.encryptor.decrypt(encrypted_metadata).decode())
        
        return {
            "document_id": document_id,
            "content": content,
            "metadata": metadata
        }
    
    def securely_delete(self, file_path):
        """Securely delete a file by overwriting with random data before unlinking"""
        if not os.path.exists(file_path):
            return
            
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Overwrite with random data multiple times
        for _ in range(3):  # DOD 5220.22-M recommends at least 3 passes
            with open(file_path, 'wb') as f:
                f.write(os.urandom(file_size))
                f.flush()
                os.fsync(f.fileno())
        
        # Finally remove the file
        os.unlink(file_path)
```

## 4. Cloud Storage Recommendations

When storing sensitive information in cloud storage:

### 4.1 AWS S3 Configuration

```python
# Example of secure S3 storage
import boto3
from botocore.exceptions import ClientError

class SecureS3Storage:
    def __init__(self, bucket_name, encryptor, kms_key_id=None):
        self.bucket_name = bucket_name
        self.encryptor = encryptor
        
        # Configure S3 client with appropriate security settings
        self.s3 = boto3.client('s3', 
            config=boto3.session.Config(
                signature_version='s3v4',
                s3={'use_accelerate_endpoint': False}
            )
        )
        
        # KMS key for server-side encryption
        self.kms_key_id = kms_key_id
        
        # Ensure bucket exists and has proper security
        self._ensure_secure_bucket()
    
    def _ensure_secure_bucket(self):
        """Ensure bucket exists and has proper security configuration"""
        try:
            # Check if bucket exists
            self.s3.head_bucket(Bucket=self.bucket_name)
            
            # Configure default encryption on the bucket
            if self.kms_key_id:
                self.s3.put_bucket_encryption(
                    Bucket=self.bucket_name,
                    ServerSideEncryptionConfiguration={
                        'Rules': [
                            {
                                'ApplyServerSideEncryptionByDefault': {
                                    'SSEAlgorithm': 'aws:kms',
                                    'KMSMasterKeyID': self.kms_key_id
                                },
                                'BucketKeyEnabled': True
                            }
                        ]
                    }
                )
            else:
                self.s3.put_bucket_encryption(
                    Bucket=self.bucket_name,
                    ServerSideEncryptionConfiguration={
                        'Rules': [
                            {
                                'ApplyServerSideEncryptionByDefault': {
                                    'SSEAlgorithm': 'AES256'
                                }
                            }
                        ]
                    }
                )
            
            # Set up bucket policy to enforce HTTPS
            self.s3.put_bucket_policy(
                Bucket=self.bucket_name,
                Policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "EnforceHTTPS",
                            "Effect": "Deny",
                            "Principal": "*",
                            "Action": "s3:*",
                            "Resource": [
                                f"arn:aws:s3:::{self.bucket_name}",
                                f"arn:aws:s3:::{self.bucket_name}/*"
                            ],
                            "Condition": {
                                "Bool": {
                                    "aws:SecureTransport": "false"
                                }
                            }
                        }
                    ]
                })
            )
            
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                # Bucket doesn't exist, create it
                region = self.s3.meta.region_name
                self.s3.create_bucket(
                    Bucket=self.bucket_name,
                    CreateBucketConfiguration={
                        'LocationConstraint': region
                    }
                )
                # Then configure it
                self._ensure_secure_bucket()
            else:
                raise
    
    def save_document(self, document_id, content, metadata):
        """Save document with client-side encryption + server-side encryption"""
        # First encrypt with client-side encryption
        encrypted_content = self.encryptor.encrypt(content.encode())
        encrypted_metadata = self.encryptor.encrypt(json.dumps(metadata).encode())
        
        # Upload content with server-side encryption
        encryption_args = {}
        if self.kms_key_id:
            encryption_args = {
                'ServerSideEncryption': 'aws:kms',
                'SSEKMSKeyId': self.kms_key_id
            }
        else:
            encryption_args = {
                'ServerSideEncryption': 'AES256'
            }
        
        # Upload content
        self.s3.put_object(
            Bucket=self.bucket_name,
            Key=f"documents/{document_id}.enc",
            Body=encrypted_content,
            **encryption_args
        )
        
        # Upload metadata
        self.s3.put_object(
            Bucket=self.bucket_name,
            Key=f"documents/{document_id}.meta.enc",
            Body=encrypted_metadata,
            **encryption_args
        )
        
        return True
    
    def load_document(self, document_id):
        """Load and decrypt document from S3"""
        try:
            # Download encrypted content
            content_obj = self.s3.get_object(
                Bucket=self.bucket_name,
                Key=f"documents/{document_id}.enc"
            )
            encrypted_content = content_obj['Body'].read()
            
            # Download encrypted metadata
            meta_obj = self.s3.get_object(
                Bucket=self.bucket_name,
                Key=f"documents/{document_id}.meta.enc"
            )
            encrypted_metadata = meta_obj['Body'].read()
            
            # Decrypt
            content = self.encryptor.decrypt(encrypted_content).decode()
            metadata = json.loads(self.encryptor.decrypt(encrypted_metadata).decode())
            
            return {
                "document_id": document_id,
                "content": content,
                "metadata": metadata
            }
            
        except ClientError as e:
            if e.response['Error']['Code'] in ('NoSuchKey', '404'):
                return None
            raise
```

## 5. PII Storage Best Practices

Special considerations for storing PII:

### 5.1 Tokenization

Replace sensitive data with non-sensitive tokens:

```python
import hashlib
import uuid
import json

class PIITokenizer:
    def __init__(self, token_storage_path):
        self.token_storage_path = token_storage_path
        os.makedirs(token_storage_path, exist_ok=True)
        
        # Load or create token mapping
        self.token_map_file = os.path.join(token_storage_path, "token_map.json")
        self.token_map = self._load_token_map()
    
    def _load_token_map(self):
        if os.path.exists(self.token_map_file):
            with open(self.token_map_file, 'r') as f:
                return json.load(f)
        return {}
    
    def _save_token_map(self):
        with open(self.token_map_file, 'w') as f:
            json.dump(self.token_map, f, indent=2)
        # Set secure permissions
        os.chmod(self.token_map_file, 0o600)
    
    def tokenize(self, pii_value, pii_type):
        """Replace PII with a token"""
        # Create a unique hash for this PII value
        hash_value = hashlib.sha256(pii_value.encode()).hexdigest()
        
        # Check if we already have a token for this value
        if hash_value in self.token_map:
            return self.token_map[hash_value]["token"]
        
        # Generate a new token
        token = f"{pii_type[0:3].upper()}-{uuid.uuid4().hex[:8]}"
        
        # Store the mapping
        self.token_map[hash_value] = {
            "token": token,
            "type": pii_type,
            "created": datetime.datetime.now().isoformat()
        }
        
        # Save updated mappings
        self._save_token_map()
        
        return token
    
    def detokenize(self, token):
        """Retrieve original PII value from token"""
        # Find the hash associated with this token
        for hash_value, info in self.token_map.items():
            if info["token"] == token:
                # In a real implementation, you'd have encrypted PII values
                # that would be decrypted here
                # This example doesn't store the actual PII (which would be unsafe)
                return {
                    "token": token,
                    "pii_type": info["type"],
                    "created": info["created"]
                }
        
        return None
```

### 5.2 Zero-Knowledge Storage

Implement a zero-knowledge approach where sensitive data is encrypted client-side:

```python
import hashlib
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend

class ZeroKnowledgeStorage:
    def __init__(self, storage_service):
        """
        Initialize with any storage service that supports put/get operations
        """
        self.storage = storage_service
    
    def store_sensitive_data(self, data, user_secret):
        """
        Store data encrypted with a key derived from user_secret.
        The service never sees the actual data or user_secret.
        """
        # Generate a unique ID for the data
        data_id = hashlib.sha256(os.urandom(32)).hexdigest()
        
        # Derive encryption key from user_secret
        salt = os.urandom(16)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        key = kdf.derive(user_secret.encode())
        
        # Encrypt data with derived key
        encryptor = DataEncryptor(master_key=key, salt=salt)
        encrypted_data = encryptor.encrypt(data.encode())
        
        # Store salt and encrypted data
        self.storage.put(data_id, {
            "salt": base64.b64encode(salt).decode(),
            "data": base64.b64encode(encrypted_data).decode()
        })
        
        return data_id
    
    def retrieve_sensitive_data(self, data_id, user_secret):
        """
        Retrieve and decrypt data using user_secret.
        The service never sees the decrypted data or user_secret.
        """
        # Get the encrypted data and salt
        stored_item = self.storage.get(data_id)
        if not stored_item:
            return None
            
        salt = base64.b64decode(stored_item["salt"])
        encrypted_data = base64.b64decode(stored_item["data"])
        
        # Recreate the encryption key
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        key = kdf.derive(user_secret.encode())
        
        # Decrypt the data
        decryptor = DataEncryptor(master_key=key, salt=salt)
        try:
            decrypted_data = decryptor.decrypt(encrypted_data).decode()
            return decrypted_data
        except Exception:
            # Invalid user_secret
            return None
```

## 6. Compliance Considerations

### 6.1 GDPR Compliance

```python
class GDPRCompliantStorage:
    def __init__(self, storage_backend):
        self.storage = storage_backend
    
    def store_with_consent(self, user_id, data, consent_info):
        """Store data with accompanying consent information"""
        # Record consent metadata
        consent_record = {
            "user_id": user_id,
            "consent_given": True,
            "consent_timestamp": datetime.datetime.now().isoformat(),
            "consent_purpose": consent_info["purpose"],
            "retention_period": consent_info["retention_period"],
            "data_categories": consent_info["data_categories"]
        }
        
        # Calculate data expiration date
        retention_days = consent_info["retention_period"]
        expiration_date = (datetime.datetime.now() + 
                          datetime.timedelta(days=retention_days)).isoformat()
        
        # Store data with metadata
        self.storage.save_document(
            document_id=f"user_{user_id}",
            content=data,
            metadata={
                "consent": consent_record,
                "expiration_date": expiration_date
            }
        )
    
    def right_to_access(self, user_id):
        """Implement GDPR right to access"""
        # Retrieve all data for this user
        user_data = self.storage.load_document(f"user_{user_id}")
        
        if not user_data:
            return {"message": "No data found for this user"}
        
        # Include consent information
        return {
            "data": user_data["content"],
            "consent_info": user_data["metadata"]["consent"],
            "expiration_date": user_data["metadata"]["expiration_date"]
        }
    
    def right_to_be_forgotten(self, user_id):
        """Implement GDPR right to erasure"""
        # Permanently delete user data
        self.storage.securely_delete(f"user_{user_id}")
        
        # Record deletion for audit purposes
        deletion_record = {
            "user_id": user_id,
            "deletion_timestamp": datetime.datetime.now().isoformat(),
            "deletion_reason": "User requested deletion (GDPR)"
        }
        
        return {"success": True, "deletion_record": deletion_record}
```

## 7. Monitoring and Threat Detection

Implement monitoring for suspicious access patterns:

```python
import time
from collections import defaultdict, deque

class SecurityMonitor:
    def __init__(self, alert_threshold=5, time_window=300):
        # Track access by user, document, and IP
        self.user_access = defaultdict(lambda: deque(maxlen=100))
        self.doc_access = defaultdict(lambda: deque(maxlen=100))
        self.ip_access = defaultdict(lambda: deque(maxlen=100))
        
        # Alert thresholds
        self.alert_threshold = alert_threshold
        self.time_window = time_window  # in seconds
    
    def record_access(self, user_id, document_id, ip_address):
        """Record an access event and check for suspicious patterns"""
        current_time = time.time()
        
        # Record access timestamps
        self.user_access[user_id].append(current_time)
        self.doc_access[document_id].append(current_time)
        self.ip_access[ip_address].append(current_time)
        
        # Check for suspicious patterns
        alerts = []
        
        # 1. Too many accesses by one user in time window
        user_count = self._count_in_window(self.user_access[user_id], current_time)
        if user_count > self.alert_threshold:
            alerts.append({
                "type": "excessive_user_access",
                "user_id": user_id,
                "count": user_count,
                "window": self.time_window
            })
        
        # 2. Too many accesses to one document in time window
        doc_count = self._count_in_window(self.doc_access[document_id], current_time)
        if doc_count > self.alert_threshold:
            alerts.append({
                "type": "excessive_document_access",
                "document_id": document_id,
                "count": doc_count,
                "window": self.time_window
            })
        
        # 3. Too many accesses from one IP in time window
        ip_count = self._count_in_window(self.ip_access[ip_address], current_time)
        if ip_count > self.alert_threshold:
            alerts.append({
                "type": "excessive_ip_access",
                "ip_address": ip_address,
                "count": ip_count,
                "window": self.time_window
            })
        
        return alerts
    
    def _count_in_window(self, time_deque, current_time):
        """Count events in the time window"""
        window_start = current_time - self.time_window
        return sum(1 for t in time_deque if t >= window_start)
```

## 8. Summary of Best Practices

1. **Multiple Layers of Encryption**:
   - Data at rest: Encrypt stored data using AES-256
   - Data in transit: Use TLS 1.3 for all connections
   - Client-side encryption: Encrypt sensitive data before sending to server

2. **Key Management**:
   - Implement automatic key rotation
   - Store encryption keys separately from encrypted data
   - Use a hardware security module (HSM) for master keys when possible

3. **Access Controls**:
   - Implement principle of least privilege
   - Use multi-factor authentication for sensitive operations
   - Implement role-based access control

4. **Audit and Monitoring**:
   - Maintain tamper-proof audit logs
   - Monitor for suspicious access patterns
   - Implement real-time alerts for security events

5. **Compliance Features**:
   - Support data subject rights (access, erasure, portability)
   - Implement data minimization and purpose limitation
   - Support data retention policies and automatic expiration

6. **Secure Storage Options**:
   - Self-hosted encrypted file storage
   - Encrypted database storage
   - Secure cloud storage with client-side and server-side encryption
   - Zero-knowledge storage for highest sensitivity data