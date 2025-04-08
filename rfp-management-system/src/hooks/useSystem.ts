
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
  } = useQuery(
    ['system', 'jobs', 'active'],
    () => systemApi.getActiveJobs(),
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 60 * 1000, // Refetch every minute
    }
  );
  
  const getJobHistory = (
    page = 1,
    limit = 50,
    jobType?: string,
    status?: string,
    fromDate?: string,
    toDate?: string
  ) => {
    return useQuery(
      ['system', 'jobs', 'history', page, limit, jobType, status, fromDate, toDate],
      () => systemApi.getJobHistory(page, limit, jobType, status, fromDate, toDate),
      {
        keepPreviousData: true,
      }
    );
  };
  
  const retryJobMutation = useMutation(
    (jobId: string) => systemApi.retryJob(jobId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['system', 'jobs'] });
        toast.success('Job retry initiated successfully');
      },
      onError: (error: any) => {
        toast.error(`Failed to retry job: ${error.message}`);
      },
    }
  );
  
  const cancelJobMutation = useMutation(
    (jobId: string) => systemApi.cancelJob(jobId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['system', 'jobs'] });
        toast.success('Job cancelled successfully');
      },
      onError: (error: any) => {
        toast.error(`Failed to cancel job: ${error.message}`);
      },
    }
  );
  
  return {
    activeJobs: activeJobs || [],
    isLoadingActiveJobs,
    activeJobsError,
    refetchActiveJobs,
    getJobHistory,
    retryJob: retryJobMutation.mutate,
    isRetrying: retryJobMutation.isLoading,
    cancelJob: cancelJobMutation.mutate,
    isCancelling: cancelJobMutation.isLoading,
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
  } = useQuery(
    ['system', 'logs', page, limit, level, component, fromDate, toDate],
    () => systemApi.getSystemLogs(page, limit, level, component, fromDate, toDate),
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

export const useSystemSettings = () => {
  const queryClient = useQueryClient();
  
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ['system', 'settings'],
    () => systemApi.getSystemSettings(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
  
  const updateSettingsMutation = useMutation(
    (updatedSettings: any) => systemApi.updateSystemSettings(updatedSettings),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['system', 'settings'] });
        toast.success('System settings updated successfully');
      },
      onError: (error: any) => {
        toast.error(`Failed to update system settings: ${error.message}`);
      },
    }
  );
  
  const runMaintenanceTaskMutation = useMutation(
    (taskType: string) => systemApi.runMaintenanceTask(taskType),
    {
      onSuccess: () => {
        toast.success('Maintenance task started successfully');
      },
      onError: (error: any) => {
        toast.error(`Failed to start maintenance task: ${error.message}`);
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
    runMaintenanceTask: runMaintenanceTaskMutation.mutate,
    isRunningMaintenance: runMaintenanceTaskMutation.isLoading,
  };
};

export const useSystemBackup = () => {
  const queryClient = useQueryClient();
  
  const {
    data: backupStatus,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ['system', 'backup', 'status'],
    () => systemApi.getBackupStatus(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
  
  const createBackupMutation = useMutation(
    (includeDocuments = true) => systemApi.createBackup(includeDocuments),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['system', 'backup'] });
        toast.success('Backup created successfully');
      },
      onError: (error: any) => {
        toast.error(`Failed to create backup: ${error.message}`);
      },
    }
  );
  
  const restoreFromBackupMutation = useMutation(
    (backupId: string) => systemApi.restoreFromBackup(backupId),
    {
      onSuccess: () => {
        toast.success('Restore initiated successfully');
      },
      onError: (error: any) => {
        toast.error(`Failed to restore from backup: ${error.message}`);
      },
    }
  );
  
  return {
    backupStatus,
    isLoading,
    error,
    refetch,
    createBackup: createBackupMutation.mutate,
    isCreatingBackup: createBackupMutation.isLoading,
    restoreFromBackup: restoreFromBackupMutation.mutate,
    isRestoring: restoreFromBackupMutation.isLoading,
  };
};
