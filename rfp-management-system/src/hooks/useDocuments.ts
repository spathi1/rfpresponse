// src/hooks/useDocuments.ts
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { documentsApi } from '../api/documents/documents';
import { Document, DocumentStatus } from '../types/document.types';
import { addRecentDocument } from '../store/slices/documentsSlice';
import { toast } from 'react-toastify';

export const useDocuments = (
  page = 1,
  limit = 25,
  status?: DocumentStatus,
  collections?: string[],
  sortBy = 'uploadedAt',
  sortOrder = 'desc'
) => {
  const queryClient = useQueryClient();
  
  // Fetch documents with pagination and filtering
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['documents', page, limit, status, collections, sortBy, sortOrder],
    queryFn: () => documentsApi.getDocuments(page, limit, status, collections, sortBy, sortOrder),
    placeholderData: keepPreviousData,
  });
  
  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: (params: { file: File; metadata: any }) =>
      documentsApi.uploadDocument(params.file, params.metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document uploaded successfully');
    },
    onError: (error: any) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });
  
  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });
  
  // Update document mutation
  const updateMutation = useMutation({
    mutationFn: (params: { id: string; updates: Partial<Document> }) =>
      documentsApi.updateDocument(params.id, params.updates),
    onSuccess: (updatedDocument) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.setQueryData(['document', updatedDocument.id], updatedDocument);
      toast.success('Document updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });
  
  return {
    documents: data?.documents || [],
    totalCount: data?.totalCount || 0,
    isLoading,
    error,
    refetch,
    uploadDocument: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    deleteDocument: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    updateDocument: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
};

export const useDocument = (id: string) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  
  // Fetch single document
  const {
    data: document,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['document', id],
    queryFn: () => documentsApi.getDocument(id),
    enabled: !!id, // Only run query if id is provided
  });

  // Handle success case separately
  useEffect(() => {
    if (document) {
      // Add to recent documents in Redux store
      dispatch(addRecentDocument(document));
    }
  }, [document, dispatch]);
  
  // Fetch document versions
  const {
    data: versions,
    isLoading: isLoadingVersions,
  } = useQuery({
    queryKey: ['document', id, 'versions'],
    queryFn: () => documentsApi.getDocumentVersions(id),
    enabled: !!id, // Only run query if id is provided
  });
  
  // Create new version mutation
  const createVersionMutation = useMutation({
    mutationFn: (params: { file: File; changeDescription?: string }) =>
      documentsApi.createDocumentVersion(id, params.file, params.changeDescription),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id, 'versions'] });
      toast.success('New version created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create version: ${error.message}`);
    },
  });
  
  return {
    document,
    isLoading,
    error,
    refetch,
    versions,
    isLoadingVersions,
    createVersion: createVersionMutation.mutate,
    isCreatingVersion: createVersionMutation.isPending,
  };
};

export const useCollections = () => {
  const queryClient = useQueryClient();
  
  // Fetch collections
  const {
    data: collections,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['collections'],
    queryFn: () => documentsApi.getCollections(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Create collection mutation
  const createMutation = useMutation({
    mutationFn: (collection: Omit<any, 'id' | 'createdAt' | 'createdBy' | 'documentCount'>) =>
      documentsApi.createCollection(collection),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create collection: ${error.message}`);
    },
  });
  
  // Update collection mutation
  const updateMutation = useMutation({
    mutationFn: (params: { id: string; updates: Partial<any> }) =>
      documentsApi.updateCollection(params.id, params.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update collection: ${error.message}`);
    },
  });
  
  // Delete collection mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.deleteCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete collection: ${error.message}`);
    },
  });
  
  return {
    collections: collections || [],
    isLoading,
    error,
    refetch,
    createCollection: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateCollection: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteCollection: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};









