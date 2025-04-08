// src/api/security.ts
import apiClient from './client/apiClient';
import { SensitivityLevel } from '../types/document.types';

export const securityApi = {
  // Get security settings
  getSecuritySettings: async () => {
    const response = await apiClient.get('/security/settings');
    return response.data;
  },
  
  // Update security settings
  updateSecuritySettings: async (settings: any) => {
    const response = await apiClient.put('/security/settings', settings);
    return response.data;
  },
  
  // Get PII detection settings
  getPiiSettings: async () => {
    const response = await apiClient.get('/security/pii');
    return response.data;
  },
  
  // Update PII detection settings
  updatePiiSettings: async (settings: any) => {
    const response = await apiClient.put('/security/pii', settings);
    return response.data;
  },
  
  // Get audit logs with pagination and filtering
  getAuditLogs: async (
    page = 1,
    limit = 50,
    userId?: string,
    action?: string,
    resourceType?: string,
    fromDate?: string,
    toDate?: string
  ) => {
    const response = await apiClient.get('/security/audit-logs', {
      params: {
        page,
        limit,
        userId,
        action,
        resourceType,
        fromDate,
        toDate,
      },
    });
    return response.data;
  },
  
  // Get sensitivity levels
  getSensitivityLevels: async () => {
    const response = await apiClient.get('/security/sensitivity-levels');
    return response.data;
  },
  
  // Create a sensitivity level
  createSensitivityLevel: async (level: Omit<SensitivityLevel, 'id'>) => {
    const response = await apiClient.post('/security/sensitivity-levels', level);
    return response.data;
  },
  
  // Update a sensitivity level
  updateSensitivityLevel: async (id: string, updates: Partial<SensitivityLevel>) => {
    const response = await apiClient.patch(`/security/sensitivity-levels/${id}`, updates);
    return response.data;
  },
  
  // Delete a sensitivity level
  deleteSensitivityLevel: async (id: string) => {
    const response = await apiClient.delete(`/security/sensitivity-levels/${id}`);
    return response.data;
  },
  
  // Get compliance reports
  getComplianceReports: async (reportType: string, period: string) => {
    const response = await apiClient.get('/security/compliance-reports', {
      params: {
        reportType,
        period,
      },
    });
    return response.data;
  },
  
  // Generate a new compliance report
  generateComplianceReport: async (
    reportType: string,
    fromDate: string,
    toDate: string,
    format = 'pdf'
  ) => {
    const response = await apiClient.post(
      '/security/compliance-reports/generate',
      {
        reportType,
        fromDate,
        toDate,
        format,
      },
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },
};

