// src/api/analytics.ts
import apiClient from '../client/apiClient';
import { AnalyticsData } from '../../types/analytics.types';

export const analyticsApi = {
  // Get overview analytics data
  getAnalyticsOverview: async (timeRange: 'day' | 'week' | 'month' | 'year' = 'week') => {
    const response = await apiClient.get('/analytics/overview', {
      params: { timeRange },
    });
    return response.data;
  },
  
  // Get document statistics
  getDocumentStats: async (timeRange: 'day' | 'week' | 'month' | 'year' = 'week') => {
    const response = await apiClient.get('/analytics/documents', {
      params: { timeRange },
    });
    return response.data;
  },
  
  // Get user activity data
  getUserActivity: async (timeRange: 'day' | 'week' | 'month' | 'year' = 'week') => {
    const response = await apiClient.get('/analytics/users', {
      params: { timeRange },
    });
    return response.data;
  },
  
  // Get processing metrics
  getProcessingMetrics: async (timeRange: 'day' | 'week' | 'month' | 'year' = 'week') => {
    const response = await apiClient.get('/analytics/processing', {
      params: { timeRange },
    });
    return response.data;
  },
  
  // Get content analytics
  getContentAnalytics: async () => {
    const response = await apiClient.get('/analytics/content');
    return response.data;
  },
  
  // Get time series data
  getTimeSeriesData: async (
    metric: 'uploads' | 'users' | 'searches' | 'processing',
    timeRange: 'day' | 'week' | 'month' | 'year' = 'week',
    interval: 'hour' | 'day' | 'week' | 'month' = 'day'
  ) => {
    const response = await apiClient.get('/analytics/timeseries', {
      params: { metric, timeRange, interval },
    });
    return response.data;
  },
  
  // Export analytics data
  exportAnalytics: async (format: 'csv' | 'json' | 'pdf' = 'csv') => {
    const response = await apiClient.get('/analytics/export', {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },
};
