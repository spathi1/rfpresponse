
// src/hooks/useTaxonomy.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taxonomyApi } from '../api/taxonomy/taxonomy';
import { TaxonomyCategory, TaxonomyTerm } from '../api/taxonomy/taxonomy.types';
import { toast } from 'react-toastify';

export const useTaxonomyCategories = () => {
  const queryClient = useQueryClient();
  
  // Fetch all categories
  const {
    data: categories,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ['taxonomy', 'categories'],
    () => taxonomyApi.getCategories(),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
  
  // Create category mutation
  const createMutation = useMutation(
    (category: Omit<TaxonomyCategory, 'id'>) => taxonomyApi.createCategory(category),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['taxonomy', 'categories']);
        toast.success('Category created successfully');
      },
      onError: (error: any) => {
        toast.error(`Failed to create category: ${error.message}`);
      },
    }
  );
  
  // Update category mutation
  const updateMutation = useMutation(
    (params: { id: string; updates: Partial<TaxonomyCategory> }) =>
      taxonomyApi.updateCategory(params.id, params.updates),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['taxonomy', 'categories']);
        toast.success('Category updated successfully');
      },
      onError: (error: any) => {
        toast.error(`Failed to update category: ${error.message}`);
      },
    }
  );
  
  // Delete category mutation
  const deleteMutation = useMutation(
    (id: string) => taxonomyApi.deleteCategory(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['taxonomy', 'categories']);
        toast.success('Category deleted successfully');
      },
      onError: (error: any) => {
        toast.error(`Failed to delete category: ${error.message}`);
      },
    }
  );
  
  return {
    categories: categories || [],
    isLoading,
    error,
    refetch,
    createCategory: createMutation.mutate,
    isCreating: createMutation.isLoading,
    updateCategory: updateMutation.mutate,
    isUpdating: updateMutation.isLoading,
    deleteCategory: deleteMutation.mutate,
    isDeleting: deleteMutation.isLoading,
  };
};

export const useTaxonomyTerms = (categoryId: string) => {
  const queryClient = useQueryClient();
  
  // Fetch terms for a category
  const {
    data: terms,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ['taxonomy', 'terms', categoryId],
    () => taxonomyApi.getTerms(categoryId),
    {
      enabled: !!categoryId, // Only run if categoryId is provided
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
  
  // Create term mutation
  const createMutation = useMutation(
    (term: Omit<TaxonomyTerm, 'id'>) => taxonomyApi.createTerm(term),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['taxonomy', 'terms', categoryId]);
        toast.success('Term created successfully');
      },
      onError: (error: any) => {
        toast.error(`Failed to create term: ${error.message}`);
      },
    }
  );
  
  // Update term mutation
  const updateMutation = useMutation(
    (params: { id: string; updates: Partial<TaxonomyTerm> }) =>
      taxonomyApi.updateTerm(params.id, params.updates),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['taxonomy', 'terms', categoryId]);
        toast.success('Term updated successfully');
      },
      onError: (error: any) => {
        toast.error(`Failed to update term: ${error.message}`);
      },
    }
  );
  
  // Delete term mutation
  const deleteMutation = useMutation(
    (id: string) => taxonomyApi.deleteTerm(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['taxonomy', 'terms', categoryId]);
        toast.success('Term deleted successfully');
      },
      onError: (error: any) => {
        toast.error(`Failed to delete term: ${error.message}`);
      },
    }
  );
  
  return {
    terms: terms || [],
    isLoading,
    error,
    refetch,
    createTerm: createMutation.mutate,
    isCreating: createMutation.isLoading,
    updateTerm: updateMutation.mutate,
    isUpdating: updateMutation.isLoading,
    deleteTerm: deleteMutation.mutate,
    isDeleting: deleteMutation.isLoading,
  };
};
