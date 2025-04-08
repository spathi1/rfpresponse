// src/hooks/useSystem.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemApi } from '../api/system';
import { toast } from 'react-toastify';

export const useSystemHealth = () => {
  const {
    data: healthStatus,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['system', 'health'],
    queryFn: () => systemApi.getHealthStatus(),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
  
  return {
    healthStatus,
    isLoading,
    error,
    refetch,
  };
};

export const useSystemMetrics = (metricType: string, timeRange: string) => {
  const {
    data: metrics,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['system', 'metrics', metricType, timeRange],
    queryFn: () => systemApi.getSystemMetrics(metricType, timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  return {
    metrics,
    isLoading,
    error,
    refetch,
  };
};

export const useSystemJobs = () => {
  const queryClient = useQueryClient();
  
  const {
    data: activeJobs,
    isLoading: isLoadingActiveJobs,
    error: activeJobsError,
    refetch: refetchActiveJobs,
  } = useQuery({
    queryKey: ['system', 'jobs', 'active'],
    queryFn: () => systemApi.getActiveJobs(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
  
  const getJobHistory = (
    page = 1,
    limit = 50,
    jobType?: string,
    status?: string,
    fromDate?: string,
    toDate?: string
  ) => {
    return useQuery({
      queryKey: ['system', 'jobs', 'history', page, limit, jobType, status, fromDate, toDate],
      queryFn: () => systemApi.getJobHistory(page, limit, jobType, status, fromDate, toDate),
      placeholderData: (oldData) => oldData,
    });
  };
  
  const retryJobMutation = useMutation({
    mutationFn: (jobId: string) => systemApi.retryJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'jobs'] });
      toast.success('Job retry initiated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to retry job: ${error.message}`);
    },
  });
  
  const cancelJobMutation = useMutation({
    mutationFn: (jobId: string) => systemApi.cancelJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'jobs'] });
      toast.success('Job cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to cancel job: ${error.message}`);
    },
  });
  
  return {
    activeJobs: activeJobs || [],
    isLoadingActiveJobs,
    activeJobsError,
    refetchActiveJobs,
    getJobHistory,
    retryJob: retryJobMutation.mutate,
    isRetrying: retryJobMutation.isPending,
    cancelJob: cancelJobMutation.mutate,
    isCancelling: cancelJobMutation.isPending,
  };
};

export const useSystemLogs = (
  page = 1,
  limit = 100,
  level?: string,
  component?: string,
  fromDate?: string,
  toDate?: string
) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['system', 'logs', page, limit, level, component, fromDate, toDate],
    queryFn: () => systemApi.getSystemLogs(page, limit, level, component, fromDate, toDate),
    placeholderData: (oldData) => oldData,
  });
  
  return {
    logs: data?.logs || [],
    totalCount: data?.totalCount || 0,
    isLoading,
    error,
    refetch,
  };
};

export const useSystemSettings = () => {
  const queryClient = useQueryClient();
  
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['system', 'settings'],
    queryFn: () => systemApi.getSystemSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const updateSettingsMutation = useMutation({
    mutationFn: (updatedSettings: any) => systemApi.updateSystemSettings(updatedSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'settings'] });
      toast.success('System settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update system settings: ${error.message}`);
    },
  });
  
  const runMaintenanceTaskMutation = useMutation({
    mutationFn: (taskType: string) => systemApi.runMaintenanceTask(taskType),
    onSuccess: () => {
      toast.success('Maintenance task started successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to start maintenance task: ${error.message}`);
    },
  });
  
  return {
    settings,
    isLoading,
    error,
    refetch,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
    runMaintenanceTask: runMaintenanceTaskMutation.mutate,
    isRunningMaintenance: runMaintenanceTaskMutation.isPending,
  };
};

export const useSystemBackup = () => {
  const queryClient = useQueryClient();
  
  const {
    data: backupStatus,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['system', 'backup', 'status'],
    queryFn: () => systemApi.getBackupStatus(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fixed type definition for createBackup function
  const createBackupMutation = useMutation({
    mutationFn: (includeDocuments: boolean = true): Promise<void> => {
      return systemApi.createBackup(includeDocuments);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'backup'] });
      toast.success('Backup created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create backup: ${error.message}`);
    },
  });
  
  const restoreFromBackupMutation = useMutation({
    mutationFn: (backupId: string) => systemApi.restoreFromBackup(backupId),
    onSuccess: () => {
      toast.success('Restore initiated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to restore from backup: ${error.message}`);
    },
  });
  
  return {
    backupStatus,
    isLoading,
    error,
    refetch,
    createBackup: createBackupMutation.mutate,
    isCreatingBackup: createBackupMutation.isPending,
    restoreFromBackup: restoreFromBackupMutation.mutate,
    isRestoring: restoreFromBackupMutation.isPending,
  };
};