
// src/hooks/useAnalytics.ts
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics/analytics';

export const useAnalyticsOverview = (timeRange: 'day' | 'week' | 'month' | 'year' = 'week') => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['analytics', 'overview', timeRange],
    queryFn: () => analyticsApi.getAnalyticsOverview(timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  return {
    data,
    isLoading,
    error,
    refetch,
  };
};

export const useDocumentStats = (timeRange: 'day' | 'week' | 'month' | 'year' = 'week') => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['analytics', 'documents', timeRange],
    queryFn: () => analyticsApi.getDocumentStats(timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  return {
    data,
    isLoading,
    error,
    refetch,
  };
};

export const useUserActivity = (timeRange: 'day' | 'week' | 'month' | 'year' = 'week') => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['analytics', 'users', timeRange],
    queryFn: () => analyticsApi.getUserActivity(timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  return {
    data,
    isLoading,
    error,
    refetch,
  };
};

export const useProcessingMetrics = (timeRange: 'day' | 'week' | 'month' | 'year' = 'week') => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['analytics', 'processing', timeRange],
    queryFn: () => analyticsApi.getProcessingMetrics(timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  return {
    data,
    isLoading,
    error,
    refetch,
  };
};

export const useContentAnalytics = () => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['analytics', 'content'],
    queryFn: () => analyticsApi.getContentAnalytics(),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
  
  return {
    data,
    isLoading,
    error,
    refetch,
  };
};

export const useTimeSeriesData = (
  metric: 'uploads' | 'users' | 'searches' | 'processing',
  timeRange: 'day' | 'week' | 'month' | 'year' = 'week',
  interval: 'hour' | 'day' | 'week' | 'month' = 'day'
) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['analytics', 'timeseries', metric, timeRange, interval],
    queryFn: () => analyticsApi.getTimeSeriesData(metric, timeRange, interval),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  return {
    data,
    isLoading,
    error,
    refetch,
  };
};
