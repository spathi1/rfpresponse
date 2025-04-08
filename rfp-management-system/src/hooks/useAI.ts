// src/hooks/useAi.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../api/ai';
import { toast } from 'react-toastify';

export const useAiSettings = () => {
  const queryClient = useQueryClient();
  
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['ai', 'settings'],
    queryFn: () => aiApi.getAiSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const updateSettingsMutation = useMutation({
    mutationFn: (updatedSettings: any) => aiApi.updateAiSettings(updatedSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'settings'] });
      toast.success('AI settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update AI settings: ${error.message}`);
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

export const useDocumentAnalysis = (documentId: string) => {
  const queryClient = useQueryClient();
  
  const {
    data: analysisResults,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['ai', 'analysis', documentId],
    queryFn: () => aiApi.getAnalysisResults(documentId),
    enabled: !!documentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  const analyzeDocumentMutation = useMutation({
    mutationFn: (analysisTypes: string[]) => aiApi.analyzeDocument(documentId, analysisTypes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'analysis', documentId] });
      toast.success('Document analysis completed successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to analyze document: ${error.message}`);
    },
  });
  
  const generateSummaryMutation = useMutation({
    mutationFn: (maxLength?: number) => aiApi.generateSummary(documentId, maxLength),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'analysis', documentId] });
      toast.success('Document summary generated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to generate summary: ${error.message}`);
    },
  });
  
  const extractEntitiesMutation = useMutation({
    mutationFn: (entityTypes?: string[]) => aiApi.extractEntities(documentId, entityTypes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'analysis', documentId] });
      toast.success('Entities extracted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to extract entities: ${error.message}`);
    },
  });
  
  const generateTagsMutation = useMutation({
    mutationFn: (maxTags?: number) => aiApi.generateTags(documentId, maxTags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'analysis', documentId] });
      toast.success('Tags generated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to generate tags: ${error.message}`);
    },
  });
  
  const classifyDocumentMutation = useMutation({
    mutationFn: (taxonomyId?: string) => aiApi.classifyDocument(documentId, taxonomyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'analysis', documentId] });
      toast.success('Document classified successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to classify document: ${error.message}`);
    },
  });
  
  return {
    analysisResults,
    isLoading,
    error,
    refetch,
    analyzeDocument: analyzeDocumentMutation.mutate,
    isAnalyzing: analyzeDocumentMutation.isPending,
    generateSummary: generateSummaryMutation.mutate,
    isGeneratingSummary: generateSummaryMutation.isPending,
    extractEntities: extractEntitiesMutation.mutate,
    isExtractingEntities: extractEntitiesMutation.isPending,
    generateTags: generateTagsMutation.mutate,
    isGeneratingTags: generateTagsMutation.isPending,
    classifyDocument: classifyDocumentMutation.mutate,
    isClassifying: classifyDocumentMutation.isPending,
  };
};

export const useDocumentComparison = () => {
  const compareMutation = useMutation({
    mutationFn: (documentIds: string[]) => aiApi.compareDocuments(documentIds),
    onSuccess: () => {
      toast.success('Document comparison completed successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to compare documents: ${error.message}`);
    },
  });
  
  return {
    compareDocuments: compareMutation.mutate,
    isComparing: compareMutation.isPending,
    comparisonResult: compareMutation.data,
    error: compareMutation.error,
  };
};

export const useModelUsage = (fromDate?: string, toDate?: string) => {
  const {
    data: usageData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['ai', 'usage', fromDate, toDate],
    queryFn: () => aiApi.getModelUsage(fromDate, toDate),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  return {
    usageData,
    isLoading,
    error,
    refetch,
  };
};
