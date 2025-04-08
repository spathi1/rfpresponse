// src/api/taxonomy.ts
import apiClient from '../client/apiClient';
import { TaxonomyCategory, TaxonomyTerm } from '../../types/taxonomy.types';

export const taxonomyApi = {
  // Get all taxonomy categories
  getCategories: async () => {
    const response = await apiClient.get('/taxonomy/categories');
    return response.data;
  },
  
  // Get a single taxonomy category
  getCategory: async (id: string) => {
    const response = await apiClient.get(`/taxonomy/categories/${id}`);
    return response.data;
  },
  
  // Create a taxonomy category
  createCategory: async (category: Omit<TaxonomyCategory, 'id'>) => {
    const response = await apiClient.post('/taxonomy/categories', category);
    return response.data;
  },
  
  // Update a taxonomy category
  updateCategory: async (id: string, updates: Partial<TaxonomyCategory>) => {
    const response = await apiClient.patch(`/taxonomy/categories/${id}`, updates);
    return response.data;
  },
  
  // Delete a taxonomy category
  deleteCategory: async (id: string) => {
    const response = await apiClient.delete(`/taxonomy/categories/${id}`);
    return response.data;
  },
  
  // Get all terms for a category
  getTerms: async (categoryId: string) => {
    const response = await apiClient.get(`/taxonomy/categories/${categoryId}/terms`);
    return response.data;
  },
  
  // Get a single taxonomy term
  getTerm: async (id: string) => {
    const response = await apiClient.get(`/taxonomy/terms/${id}`);
    return response.data;
  },
  
  // Create a taxonomy term
  createTerm: async (term: Omit<TaxonomyTerm, 'id'>) => {
    const response = await apiClient.post('/taxonomy/terms', term);
    return response.data;
  },
  
  // Update a taxonomy term
  updateTerm: async (id: string, updates: Partial<TaxonomyTerm>) => {
    const response = await apiClient.patch(`/taxonomy/terms/${id}`, updates);
    return response.data;
  },
  
  // Delete a taxonomy term
  deleteTerm: async (id: string) => {
    const response = await apiClient.delete(`/taxonomy/terms/${id}`);
    return response.data;
  },
};
