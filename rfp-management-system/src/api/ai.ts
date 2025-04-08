// src/api/ai.ts
import apiClient from './client/apiClient';

export const aiApi = {
  // Get AI integration settings
  getAiSettings: async () => {
    const response = await apiClient.get('/ai/settings');
    return response.data;
  },
  
  // Update AI integration settings
  updateAiSettings: async (settings: any) => {
    const response = await apiClient.put('/ai/settings', settings);
    return response.data;
  },
  
  // Run AI analysis on a document
  analyzeDocument: async (documentId: string, analysisTypes: string[]) => {
    const response = await apiClient.post(`/ai/analyze/${documentId}`, {
      analysisTypes,
    });
    return response.data;
  },
  
  // Get AI analysis results
  getAnalysisResults: async (documentId: string) => {
    const response = await apiClient.get(`/ai/results/${documentId}`);
    return response.data;
  },
  
  // Generate document summary
  generateSummary: async (documentId: string, maxLength?: number) => {
    const response = await apiClient.post(`/ai/summary/${documentId}`, {
      maxLength,
    });
    return response.data;
  },
  
  // Extract document entities
  extractEntities: async (documentId: string, entityTypes?: string[]) => {
    const response = await apiClient.post(`/ai/entities/${documentId}`, {
      entityTypes,
    });
    return response.data;
  },
  
  // Generate document tags
  generateTags: async (documentId: string, maxTags?: number) => {
    const response = await apiClient.post(`/ai/tags/${documentId}`, {
      maxTags,
    });
    return response.data;
  },
  
  // Classify document
  classifyDocument: async (documentId: string, taxonomyId?: string) => {
    const response = await apiClient.post(`/ai/classify/${documentId}`, {
      taxonomyId,
    });
    return response.data;
  },
  
  // Compare documents
  compareDocuments: async (documentIds: string[]) => {
    const response = await apiClient.post('/ai/compare', {
      documentIds,
    });
    return response.data;
  },
  
  // Get model usage statistics
  getModelUsage: async (fromDate?: string, toDate?: string) => {
    const response = await apiClient.get('/ai/usage', {
      params: {
        fromDate,
        toDate,
      },
    });
    return response.data;
  },
};

export default aiApi;