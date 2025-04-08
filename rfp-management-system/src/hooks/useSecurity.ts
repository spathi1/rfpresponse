// src/hooks/useSecurity.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { securityApi } from '../api/securiy';
import { toast } from 'react-toastify';

export const useSecuritySettings = () => {
  const queryClient = useQueryClient();
  
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['security', 'settings'],
    queryFn: () => securityApi.getSecuritySettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const updateSettingsMutation = useMutation({
    mutationFn: (updatedSettings: any) => securityApi.updateSecuritySettings(updatedSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['security', 'settings']});
      toast.success('Security settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update security settings: ${error.message}`);
    },
  });
  
  return {
    settings,
    isLoading,
    error,
    refetch,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
  };
};

export const usePiiSettings = () => {
  const queryClient = useQueryClient();
  
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['security', 'pii'],
    queryFn: () => securityApi.getPiiSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const updateSettingsMutation = useMutation({
    mutationFn: (updatedSettings: any) => securityApi.updatePiiSettings(updatedSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['security', 'pii']});
      toast.success('PII detection settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update PII detection settings: ${error.message}`);
    },
  });
  
  return {
    settings,
    isLoading,
    error,
    refetch,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
  };
};

export const useAuditLogs = (
  page = 1,
  limit = 50,
  userId?: string,
  action?: string,
  resourceType?: string,
  fromDate?: string,
  toDate?: string
) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['security', 'audit-logs', page, limit, userId, action, resourceType, fromDate, toDate],
    queryFn: () => securityApi.getAuditLogs(page, limit, userId, action, resourceType, fromDate, toDate),
    placeholderData: (oldData) => oldData, // This is the equivalent to keepPreviousData in v5
  });
  
  return {
    logs: data?.logs || [],
    totalCount: data?.totalCount || 0,
    isLoading,
    error,
    refetch,
  };
};

export const useSensitivityLevels = () => {
  const queryClient = useQueryClient();
  
  const {
    data: levels,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['security', 'sensitivity-levels'],
    queryFn: () => securityApi.getSensitivityLevels(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  const createLevelMutation = useMutation({
    mutationFn: (level: any) => securityApi.createSensitivityLevel(level),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['security', 'sensitivity-levels']});
      toast.success('Sensitivity level created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create sensitivity level: ${error.message}`);
    },
  });
  
  const updateLevelMutation = useMutation({
    mutationFn: (params: { id: string; updates: any }) =>
      securityApi.updateSensitivityLevel(params.id, params.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['security', 'sensitivity-levels']});
      toast.success('Sensitivity level updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update sensitivity level: ${error.message}`);
    },
  });
  
  const deleteLevelMutation = useMutation({
    mutationFn: (id: string) => securityApi.deleteSensitivityLevel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['security', 'sensitivity-levels']});
      toast.success('Sensitivity level deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete sensitivity level: ${error.message}`);
    },
  });
  
  return {
    levels: levels || [],
    isLoading,
    error,
    refetch,
    createLevel: createLevelMutation.mutate,
    isCreating: createLevelMutation.isPending,
    updateLevel: updateLevelMutation.mutate,
    isUpdating: updateLevelMutation.isPending,
    deleteLevel: deleteLevelMutation.mutate,
    isDeleting: deleteLevelMutation.isPending,
  };
};

export const useComplianceReports = (reportType: string, period: string) => {
  const {
    data: reports,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['security', 'compliance-reports', reportType, period],
    queryFn: () => securityApi.getComplianceReports(reportType, period),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  const generateReportMutation = useMutation({
    mutationFn: (params: { reportType: string; fromDate: string; toDate: string; format?: string }) =>
      securityApi.generateComplianceReport(
        params.reportType,
        params.fromDate,
        params.toDate,
        params.format
      ),
    onSuccess: (data: any) => {
      // Create a download link for the blob
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `compliance-report-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      link.remove();
      
      toast.success('Compliance report generated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to generate compliance report: ${error.message}`);
    },
  });
  
  return {
    reports: reports || [],
    isLoading,
    error,
    refetch,
    generateReport: generateReportMutation.mutate,
    isGenerating: generateReportMutation.isPending,
  };
};