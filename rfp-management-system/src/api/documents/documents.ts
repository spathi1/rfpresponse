// src/api/documents.ts
import apiClient from '../client/apiClient';
import { Document, DocumentCollection, DocumentStatus, DocumentVersion } from '../../types/document.types';
import { SearchQuery, SearchResult } from '../../types/search.types';

// Document API endpoints
export const documentsApi = {
  // Get documents with pagination and filtering
  getDocuments: async (
    page = 1,
    limit = 25,
    status?: DocumentStatus,
    collections?: string[],
    sortBy = 'uploadedAt',
    sortOrder = 'desc'
  ) => {
    const response = await apiClient.get('/documents', {
      params: {
        page,
        limit,
        status,
        collections: collections?.join(','),
        sortBy,
        sortOrder,
      },
    });
    return response.data;
  },
  
  // Get a single document by ID
  getDocument: async (id: string) => {
    const response = await apiClient.get(`/documents/${id}`);
    return response.data;
  },
  
  // Upload a new document
  uploadDocument: async (file: File, metadata: any) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));
    
    const response = await apiClient.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        // You can use this to track upload progress
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 100)
        );
        console.log(`Upload progress: ${percentCompleted}%`);
      },
    });
    
    return response.data;
  },
  
  // Update document metadata
  updateDocument: async (id: string, updates: Partial<Document>) => {
    const response = await apiClient.patch(`/documents/${id}`, updates);
    return response.data;
  },
  
  // Delete a document
  deleteDocument: async (id: string) => {
    const response = await apiClient.delete(`/documents/${id}`);
    return response.data;
  },
  
  // Get document versions
  getDocumentVersions: async (id: string) => {
    const response = await apiClient.get(`/documents/${id}/versions`);
    return response.data;
  },
  
  // Create a new document version
  createDocumentVersion: async (id: string, file: File, changeDescription?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (changeDescription) {
      formData.append('changeDescription', changeDescription);
    }
    
    const response = await apiClient.post(`/documents/${id}/versions`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
  
  // Get document content
  getDocumentContent: async (id: string, version?: number) => {
    const response = await apiClient.get(`/documents/${id}/content`, {
      params: { version },
      responseType: 'blob',
    });
    
    return response.data;
  },
  
  // Get document collections
  getCollections: async () => {
    const response = await apiClient.get('/collections');
    return response.data;
  },
  
  // Create a new collection
  createCollection: async (collection: Omit<DocumentCollection, 'id' | 'createdAt' | 'createdBy' | 'documentCount'>) => {
    const response = await apiClient.post('/collections', collection);
    return response.data;
  },
  
  // Update a collection
  updateCollection: async (id: string, updates: Partial<DocumentCollection>) => {
    const response = await apiClient.patch(`/collections/${id}`, updates);
    return response.data;
  },
  
  // Delete a collection
  deleteCollection: async (id: string) => {
    const response = await apiClient.delete(`/collections/${id}`);
    return response.data;
  },
  
  // Add document to collection
  addToCollection: async (documentId: string, collectionId: string) => {
    const response = await apiClient.post(`/documents/${documentId}/collections`, {
      collectionId,
    });
    return response.data;
  },
  
  // Remove document from collection
  removeFromCollection: async (documentId: string, collectionId: string) => {
    const response = await apiClient.delete(`/documents/${documentId}/collections/${collectionId}`);
    return response.data;
  },
};

