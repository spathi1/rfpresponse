// src/api/client/apiClient.ts
import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { store } from '../../store/store'; // Import the store from store/store.ts
import { logout } from '../../store/slices/authSlice'; // Import the logout action from authSlice.ts

interface ErrorResponseData {
  message?: string;
  [key: string]: any;
}

// Create axios instance
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const token = state.auth.token;
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized responses
    if (error.response?.status === 401) {
      // Logout the user
      store.dispatch(logout());
      // Redirect to login (if not already there)
      if (window.location.pathname !== '/auth/login') {
        window.location.href = '/auth/login';
      }
    }
    
    // Create a standardized error object
    const errorData = error.response?.data as ErrorResponseData | undefined;
    const errorResponse = {
      message: errorData?.message || 'An unexpected error occurred',
      status: error.response?.status,
      data: error.response?.data,
    };
    
    return Promise.reject(errorResponse);
  }
);

export default apiClient;



