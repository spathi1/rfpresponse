// src/hooks/useIntegration.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { integrationApi } from '../api/integration';
import { toast } from 'react-toastify';

export const useIntegrations = () => {
  const queryClient = useQueryClient();
  
  const {
    data: availableIntegrations,
    isLoading: isLoadingAvailable,
    error: availableError,
  } = useQuery({
    queryKey: ['integrations', 'available'],
    queryFn: () => integrationApi.getAvailableIntegrations(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  const {
    data: activeIntegrations,
    isLoading: isLoadingActive,
    error: activeError,
    refetch: refetchActive,
  } = useQuery({
    queryKey: ['integrations', 'active'],
    queryFn: () => integrationApi.getActiveIntegrations(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const getIntegrationDetails = (integrationId: string) => {
    return useQuery({
      queryKey: ['integrations', integrationId],
      queryFn: () => integrationApi.getIntegrationDetails(integrationId),
      enabled: !!integrationId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
  
  const activateIntegrationMutation = useMutation({
    mutationFn: (params: { integrationId: string; config: any }) =>
      integrationApi.activateIntegration(params.integrationId, params.config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', 'active'] });
      toast.success('Integration activated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to activate integration: ${error.message}`);
    },
  });
  
  const updateIntegrationConfigMutation = useMutation({
    mutationFn: (params: { integrationId: string; config: any }) =>
      integrationApi.updateIntegrationConfig(params.integrationId, params.config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Integration configuration updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update integration configuration: ${error.message}`);
    },
  });
  
  const deactivateIntegrationMutation = useMutation({
    mutationFn: (integrationId: string) => 
      integrationApi.deactivateIntegration(integrationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', 'active'] });
      toast.success('Integration deactivated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to deactivate integration: ${error.message}`);
    },
  });
  
  const testIntegrationMutation = useMutation({
    mutationFn: (integrationId: string) => 
      integrationApi.testIntegrationConnection(integrationId),
    onSuccess: () => {
      toast.success('Integration test completed successfully');
    },
    onError: (error: any) => {
      toast.error(`Integration test failed: ${error.message}`);
    },
  });
  
  const syncIntegrationMutation = useMutation({
    mutationFn: (params: { integrationId: string; direction: 'push' | 'pull' | 'both'; options?: any }) =>
      integrationApi.syncWithIntegration(params.integrationId, params.direction, params.options),
    onSuccess: () => {
      toast.success('Integration sync initiated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to sync integration: ${error.message}`);
    },
  });
  
  return {
    availableIntegrations: availableIntegrations || [],
    activeIntegrations: activeIntegrations || [],
    isLoadingAvailable,
    isLoadingActive,
    availableError,
    activeError,
    refetchActive,
    getIntegrationDetails,
    activateIntegration: activateIntegrationMutation.mutate,
    isActivating: activateIntegrationMutation.isPending,
    updateIntegrationConfig: updateIntegrationConfigMutation.mutate,
    isUpdating: updateIntegrationConfigMutation.isPending,
    deactivateIntegration: deactivateIntegrationMutation.mutate,
    isDeactivating: deactivateIntegrationMutation.isPending,
    testIntegration: testIntegrationMutation.mutate,
    isTesting: testIntegrationMutation.isPending,
    syncIntegration: syncIntegrationMutation.mutate,
    isSyncing: syncIntegrationMutation.isPending,
  };
};

export const useIntegrationLogs = (
  integrationId: string,
  page = 1,
  limit = 50,
  level?: string,
  fromDate?: string,
  toDate?: string
) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['integrations', integrationId, 'logs', page, limit, level, fromDate, toDate],
    queryFn: () => integrationApi.getIntegrationLogs(integrationId, page, limit, level, fromDate, toDate),
    enabled: !!integrationId,
    placeholderData: (prev) => prev, // This replaces keepPreviousData in v5
  });
  
  return {
    logs: data?.logs || [],
    totalCount: data?.totalCount || 0,
    isLoading,
    error,
    refetch,
  };
};

export const useWebhooks = () => {
  const queryClient = useQueryClient();
  
  const {
    data: webhookSettings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['integrations', 'webhooks'],
    queryFn: () => integrationApi.getWebhookSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const createWebhookMutation = useMutation({
    mutationFn: (webhook: any) => integrationApi.createWebhook(webhook),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', 'webhooks'] });
      toast.success('Webhook created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create webhook: ${error.message}`);
    },
  });
  
  const updateWebhookMutation = useMutation({
    mutationFn: (params: { webhookId: string; updates: any }) =>
      integrationApi.updateWebhook(params.webhookId, params.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', 'webhooks'] });
      toast.success('Webhook updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update webhook: ${error.message}`);
    },
  });
  
  const deleteWebhookMutation = useMutation({
    mutationFn: (webhookId: string) => integrationApi.deleteWebhook(webhookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', 'webhooks'] });
      toast.success('Webhook deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete webhook: ${error.message}`);
    },
  });
  
  return {
    webhooks: webhookSettings?.webhooks || [],
    isLoading,
    error,
    refetch,
    createWebhook: createWebhookMutation.mutate,
    isCreating: createWebhookMutation.isPending,
    updateWebhook: updateWebhookMutation.mutate,
    isUpdating: updateWebhookMutation.isPending,
    deleteWebhook: deleteWebhookMutation.mutate,
    isDeleting: deleteWebhookMutation.isPending,
  };
};

export const useWebhookEvents = (
  webhookId: string,
  page = 1,
  limit = 50,
  status?: string,
  fromDate?: string,
  toDate?: string
) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['integrations', 'webhooks', webhookId, 'events', page, limit, status, fromDate, toDate],
    queryFn: () => integrationApi.getWebhookEvents(webhookId, page, limit, status, fromDate, toDate),
    enabled: !!webhookId,
    placeholderData: (prev) => prev, // This replaces keepPreviousData in v5
  });
  
  return {
    events: data?.events || [],
    totalCount: data?.totalCount || 0,
    isLoading,
    error,
    refetch,
  };
};