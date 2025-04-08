
// src/api/integration.ts
import apiClient from './client/apiClient';

export const integrationApi = {
  // Get available integrations
  getAvailableIntegrations: async () => {
    const response = await apiClient.get('/integrations/available');
    return response.data;
  },
  
  // Get active integrations
  getActiveIntegrations: async () => {
    const response = await apiClient.get('/integrations/active');
    return response.data;
  },
  
  // Get integration details
  getIntegrationDetails: async (integrationId: string) => {
    const response = await apiClient.get(`/integrations/${integrationId}`);
    return response.data;
  },
  
  // Activate an integration
  activateIntegration: async (integrationId: string, config: any) => {
    const response = await apiClient.post(`/integrations/${integrationId}/activate`, config);
    return response.data;
  },
  
  // Update integration configuration
  updateIntegrationConfig: async (integrationId: string, config: any) => {
    const response = await apiClient.put(`/integrations/${integrationId}/config`, config);
    return response.data;
  },
  
  // Deactivate an integration
  deactivateIntegration: async (integrationId: string) => {
    const response = await apiClient.post(`/integrations/${integrationId}/deactivate`);
    return response.data;
  },
  
  // Test integration connection
  testIntegrationConnection: async (integrationId: string) => {
    const response = await apiClient.post(`/integrations/${integrationId}/test`);
    return response.data;
  },
  
  // Get integration logs
  getIntegrationLogs: async (
    integrationId: string,
    page = 1,
    limit = 50,
    level?: string,
    fromDate?: string,
    toDate?: string
  ) => {
    const response = await apiClient.get(`/integrations/${integrationId}/logs`, {
      params: {
        page,
        limit,
        level,
        fromDate,
        toDate,
      },
    });
    return response.data;
  },
  
  // Sync data with integration
  syncWithIntegration: async (integrationId: string, direction: 'push' | 'pull' | 'both', options?: any) => {
    const response = await apiClient.post(`/integrations/${integrationId}/sync`, {
      direction,
      options,
    });
    return response.data;
  },
  
  // Get webhook settings
  getWebhookSettings: async () => {
    const response = await apiClient.get('/integrations/webhooks');
    return response.data;
  },
  
  // Create a webhook
  createWebhook: async (webhook: any) => {
    const response = await apiClient.post('/integrations/webhooks', webhook);
    return response.data;
  },
  
  // Update a webhook
  updateWebhook: async (webhookId: string, updates: any) => {
    const response = await apiClient.put(`/integrations/webhooks/${webhookId}`, updates);
    return response.data;
  },
  
  // Delete a webhook
  deleteWebhook: async (webhookId: string) => {
    const response = await apiClient.delete(`/integrations/webhooks/${webhookId}`);
    return response.data;
  },
  
  // Get webhook events
  getWebhookEvents: async (
    webhookId: string,
    page = 1,
    limit = 50,
    status?: string,
    fromDate?: string,
    toDate?: string
  ) => {
    const response = await apiClient.get(`/integrations/webhooks/${webhookId}/events`, {
      params: {
        page,
        limit,
        status,
        fromDate,
        toDate,
      },
    });
    return response.data;
  },
};
