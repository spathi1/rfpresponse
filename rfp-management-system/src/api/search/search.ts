// src/api/search.ts
import apiClient from '../client/apiClient';
import { SearchQuery, SearchResult, SavedSearch } from '../../types/search.types'; // Import search.types from your project's directory

export const searchApi = {
  // Perform a search
  search: async (searchQuery: SearchQuery) => {
    const response = await apiClient.post('/search', searchQuery);
    return response.data;
  },
  
  // Get suggested search terms based on partial input
  getSuggestions: async (term: string) => {
    const response = await apiClient.get('/search/suggestions', {
      params: { term },
    });
    return response.data;
  },
  
  // Get saved searches for the current user
  getSavedSearches: async () => {
    const response = await apiClient.get('/search/saved');
    return response.data;
  },
  
  // Save a search
  saveSearch: async (name: string, query: SearchQuery) => {
    const response = await apiClient.post('/search/saved', {
      name,
      query,
    });
    return response.data;
  },
  
  // Update a saved search
  updateSavedSearch: async (id: string, name: string, query: SearchQuery) => {
    const response = await apiClient.put(`/search/saved/${id}`, {
      name,
      query,
    });
    return response.data;
  },
  
  // Delete a saved search
  deleteSavedSearch: async (id: string) => {
    const response = await apiClient.delete(`/search/saved/${id}`);
    return response.data;
  },
  
  // Get recent searches for the current user
  getRecentSearches: async () => {
    const response = await apiClient.get('/search/recent');
    return response.data;
  },
};

