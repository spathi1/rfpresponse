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
  } = useQuery(
    ['security', 'settings'],
    () => securityApi.getSecuritySettings(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
  
  const updateSettingsMutation = useMutation(
    (updatedSettings: any) => securityApi.updateSecuritySettings(updatedSettings),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['security', 'settings']);
        toast.success('Security settings updated successfully');
      },
      onError: (error: any) => {
        toast.error(`Failed to update security settings: ${error.message}`);
      },
    }
  );
  
  return {
    settings,
    isLoading,
    error,
    refetch,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isLoading,
  };
};

export const usePiiSettings = () => {
  const queryClient = useQueryClient();
  
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ['security', 'pii'],
    () => securityApi.getPiiSettings(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
  
  const updateSettingsMutation = useMutation(
    (updatedSettings: any) => securityApi.updatePiiSettings(updatedSettings),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['security', 'pii']);
        toast.success('PII detection settings updated successfully');
      },
      onError: (error: any) => {
        toast.error(`Failed to update PII detection settings: ${error.message}`);
      },
    }
  );
  
  return {
    settings,
    isLoading,
    error,
    refetch,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isLoading,
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
  } = useQuery(
    ['security', 'audit-logs', page, limit, userId, action, resourceType, fromDate, toDate],
    () => securityApi.getAuditLogs(page, limit, userId, action, resourceType, fromDate, toDate),
    {
      keepPreviousData: true,
    }
  );
  
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
  } = useQuery(
    ['security', 'sensitivity-levels'],
    () => securityApi.getSensitivityLevels(),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
  
  const createLevelMutation = useMutation(
    (level: any) => securityApi.createSensitivityLevel(level),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['security', 'sensitivity-levels']);
        toast.success('Sensitivity level created successfully');
      },
      onError: (error: any) => {
        toast.error(`Failed to create sensitivity level: ${error.message}`);
      },
    }
  );
  
  const updateLevelMutation = useMutation(
    (params: { id: string; updates: any }) =>
      securityApi.updateSensitivityLevel(params.id, params.updates),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['security', 'sensitivity-levels']);
        toast.success('Sensitivity level updated successfully');
      },
      onError: (error: any) => {
        toast.error(`Failed to update sensitivity level: ${error.message}`);
      },
    }
  );
  
  const deleteLevelMutation = useMutation(
    (id: string) => securityApi.deleteSensitivityLevel(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['security', 'sensitivity-levels']);
        toast.success('Sensitivity level deleted successfully');
      },
      onError: (error: any) => {
        toast.error(`Failed to delete sensitivity level: ${error.message}`);
      },
    }
  );
  
  return {
    levels: levels || [],
    isLoading,
    error,
    refetch,
    createLevel: createLevelMutation.mutate,
    isCreating: createLevelMutation.isLoading,
    updateLevel: updateLevelMutation.mutate,
    isUpdating: updateLevelMutation.isLoading,
    deleteLevel: deleteLevelMutation.mutate,
    isDeleting: deleteLevelMutation.isLoading,
  };
};

export const useComplianceReports = (reportType: string, period: string) => {
  const {
    data: reports,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ['security', 'compliance-reports', reportType, period],
    () => securityApi.getComplianceReports(reportType, period),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
  
  const generateReportMutation = useMutation(
    (params: { reportType: string; fromDate: string; toDate: string; format?: string }) =>
      securityApi.generateComplianceReport(
        params.reportType,
        params.fromDate,
        params.toDate,
        params.format
      ),
    {
      onSuccess: (data) => {
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
    }
  );
  
  return {
    reports: reports || [],
    isLoading,
    error,
    refetch,
    generateReport: generateReportMutation.mutate,
    isGenerating: generateReportMutation.isLoading,
  };
};




