// src/hooks/useSearch.ts
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { searchApi } from '../api/search/search';
import { SearchQuery, SavedSearch } from '../types/search.types';
import { toast } from 'react-toastify';

export const useSearch = (searchQuery: SearchQuery) => {
  // Execute search
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => searchApi.search(searchQuery),
    placeholderData: keepPreviousData,
    enabled: !!searchQuery.query, // Only search if there's a query
  });
  
  return {
    results: data?.results || [],
    totalCount: data?.totalCount || 0,
    isLoading,
    error,
    refetch,
  };
};

export const useSavedSearches = () => {
  const queryClient = useQueryClient();
  
  // Fetch saved searches
  const {
    data: savedSearches,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['savedSearches'],
    queryFn: () => searchApi.getSavedSearches(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Save search mutation
  const saveMutation = useMutation({
    mutationFn: (params: { name: string; query: SearchQuery }) =>
      searchApi.saveSearch(params.name, params.query),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] });
      toast.success('Search saved successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to save search: ${error.message}`);
    },
  });
  
  // Update saved search mutation
  const updateMutation = useMutation({
    mutationFn: (params: { id: string; name: string; query: SearchQuery }) =>
      searchApi.updateSavedSearch(params.id, params.name, params.query),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] });
      toast.success('Saved search updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update saved search: ${error.message}`);
    },
  });
  
  // Delete saved search mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => searchApi.deleteSavedSearch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] });
      toast.success('Saved search deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete saved search: ${error.message}`);
    },
  });
  
  return {
    savedSearches: savedSearches || [],
    isLoading,
    error,
    refetch,
    saveSearch: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    updateSavedSearch: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteSavedSearch: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};

export const useRecentSearches = () => {
  // Fetch recent searches
  const {
    data: recentSearches,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['recentSearches'],
    queryFn: () => searchApi.getRecentSearches(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
  
  return {
    recentSearches: recentSearches || [],
    isLoading,
    error,
  };
};

export const useSearchSuggestions = (term: string) => {
  // Fetch search suggestions
  const {
    data: suggestions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['searchSuggestions', term],
    queryFn: () => searchApi.getSuggestions(term),
    enabled: term.length > 2, // Only fetch if term is at least 3 characters
    staleTime: 1 * 60 * 1000, // 1 minute
  });
  
  return {
    suggestions: suggestions || [],
    isLoading,
    error,
  };
};
