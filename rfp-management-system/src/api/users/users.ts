
// src/api/users.ts
import apiClient from '../client/apiClient';
import { User, UserRole, Permission } from '../../types/user.types';

export const usersApi = {
  // Authenticate user
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },
  
  // Register a new user
  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },
  
  // Request password reset
  requestPasswordReset: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },
  
  // Reset password with token
  resetPassword: async (token: string, newPassword: string) => {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },
  
  // Get current user profile
  getCurrentUser: async () => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },
  
  // Update current user profile
  updateCurrentUser: async (updates: Partial<User>) => {
    const response = await apiClient.patch('/users/me', updates);
    return response.data;
  },
  
  // Change password
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiClient.post('/users/me/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
  
  // Admin: Get all users
  getUsers: async (page = 1, limit = 25) => {
    const response = await apiClient.get('/admin/users', {
      params: { page, limit },
    });
    return response.data;
  },
  
  // Admin: Get a user by ID
  getUser: async (id: string) => {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data;
  },
  
  // Admin: Create a user
  createUser: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  }) => {
    const response = await apiClient.post('/admin/users', userData);
    return response.data;
  },
  
  // Admin: Update a user
  updateUser: async (id: string, updates: Partial<User>) => {
    const response = await apiClient.patch(`/admin/users/${id}`, updates);
    return response.data;
  },
  
  // Admin: Delete a user
  deleteUser: async (id: string) => {
    const response = await apiClient.delete(`/admin/users/${id}`);
    return response.data;
  },
  
  // Admin: Update user permissions
  updateUserPermissions: async (userId: string, permissions: Permission[]) => {
    const response = await apiClient.put(`/admin/users/${userId}/permissions`, {
      permissions,
    });
    return response.data;
  },
};

