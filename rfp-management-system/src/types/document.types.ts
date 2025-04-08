// src/types/document.types.ts
export interface Document {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
  lastModifiedAt: string;
  lastModifiedBy: string;
  status: DocumentStatus;
  metadata: DocumentMetadata;
  collections: string[];
  tags: string[];
  versions: DocumentVersion[];
  sensitivityLevel: SensitivityLevel;
  piiDetected: boolean;
  permissions: DocumentPermission[];
}

export interface DocumentMetadata {
  author?: string;
  company?: string;
  industry?: string[];
  documentType?: string;
  createdAt?: string;
  pageCount?: number;
  wordCount?: number;
  language?: string;
  summary?: string;
  keywords?: string[];
  taxonomyCategories?: { [key: string]: string[] };
  customFields?: { [key: string]: any };
}

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  createdAt: string;
  createdBy: string;
  fileName: string;
  fileSize: number;
  changeDescription?: string;
}

export interface DocumentPermission {
  userId: string;
  userName: string;
  accessLevel: 'view' | 'edit' | 'admin';
  grantedAt: string;
  grantedBy: string;
}

export type DocumentStatus = 
  | 'uploading'
  | 'processing'
  | 'processed'
  | 'error'
  | 'archived';

export type SensitivityLevel = 
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted';

export interface DocumentCollection {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  createdBy: string;
  documentCount: number;
  parentId?: string;
  children?: DocumentCollection[];
}