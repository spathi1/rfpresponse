// src/types/analytics.types.ts
import { DocumentStatus, SensitivityLevel } from './document.types';
export interface AnalyticsData {
    documentStats: DocumentStats;
    userActivity: UserActivity[];
    processingMetrics: ProcessingMetrics;
    contentAnalytics: ContentAnalytics;
    timeRangeMetrics: TimeRangeMetrics[];
  }
  
  export interface DocumentStats {
    totalDocuments: number;
    documentsByStatus: { [key in DocumentStatus]: number };
    documentsByType: { [key: string]: number };
    documentsUploadedToday: number;
    averageProcessingTime: number;
  }
  
  export interface UserActivity {
    userId: string;
    userName: string;
    actionsPerformed: number;
    documentsUploaded: number;
    documentsViewed: number;
    searchesPerformed: number;
    lastActive: string;
  }
  
  export interface ProcessingMetrics {
    averageUploadToProcessingTime: number;
    processingSuccessRate: number;
    errorsInLastDay: number;
    currentProcessingQueue: number;
  }
  
  export interface ContentAnalytics {
    topIndustries: { name: string; count: number }[];
    topDocumentTypes: { name: string; count: number }[];
    averageDocumentSize: number;
    averagePageCount: number;
    sensitivityLevelDistribution: { [key in SensitivityLevel]: number };
  }
  
  export interface TimeRangeMetrics {
    timeRange: string;
    documentsUploaded: number;
    usersActive: number;
    searchesPerformed: number;
  }