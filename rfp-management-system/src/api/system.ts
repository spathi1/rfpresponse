
// src/api/system.ts
import apiClient from './client/apiClient';

export const systemApi = {
  // Get system health status
  getHealthStatus: async () => {
    const response = await apiClient.get('/system/health');
    return response.data;
  },
  
  // Get system metrics
  getSystemMetrics: async (metricType: string, timeRange: string) => {
    const response = await apiClient.get('/system/metrics', {
      params: {
        metricType,
        timeRange,
      },
    });
    return response.data;
  },
  
  // Get active jobs
  getActiveJobs: async () => {
    const response = await apiClient.get('/system/jobs/active');
    return response.data;
  },
  
  // Get job history
  getJobHistory: async (
    page = 1,
    limit = 50,
    jobType?: string,
    status?: string,
    fromDate?: string,
    toDate?: string
  ) => {
    const response = await apiClient.get('/system/jobs/history', {
      params: {
        page,
        limit,
        jobType,
        status,
        fromDate,
        toDate,
      },
    });
    return response.data;
  },
  
  // Retry a failed job
  retryJob: async (jobId: string) => {
    const response = await apiClient.post(`/system/jobs/${jobId}/retry`);
    return response.data;
  },
  
  // Cancel an active job
  cancelJob: async (jobId: string) => {
    const response = await apiClient.post(`/system/jobs/${jobId}/cancel`);
    return response.data;
  },
  
  // Get system logs
  getSystemLogs: async (
    page = 1,
    limit = 100,
    level?: string,
    component?: string,
    fromDate?: string,
    toDate?: string
  ) => {
    const response = await apiClient.get('/system/logs', {
      params: {
        page,
        limit,
        level,
        component,
        fromDate,
        toDate,
      },
    });
    return response.data;
  },
  
  // Get system settings
  getSystemSettings: async () => {
    const response = await apiClient.get('/system/settings');
    return response.data;
  },
  
  // Update system settings
  updateSystemSettings: async (settings: any) => {
    const response = await apiClient.put('/system/settings', settings);
    return response.data;
  },
  
  // Run system maintenance task
  runMaintenanceTask: async (taskType: string) => {
    const response = await apiClient.post('/system/maintenance', {
      taskType,
    });
    return response.data;
  },
  
  // Get system backup status
  getBackupStatus: async () => {
    const response = await apiClient.get('/system/backup/status');
    return response.data;
  },
  
  // Create a new backup
  createBackup: async (includeDocuments = true) => {
    const response = await apiClient.post('/system/backup', {
      includeDocuments,
    });
    return response.data;
  },
  
  // Restore from backup
  restoreFromBackup: async (backupId: string) => {
    const response = await apiClient.post('/system/restore', {
      backupId,
    });
    return response.data;
  },
};
