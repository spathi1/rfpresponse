
// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { usersApi } from '../api/users/users';
import { 
  loginStart,
  loginSuccess,
  loginFailure,
  logout as logoutAction,
  updateUser,
  selectAuth
} from '../store/slices/authSlice';
import { User } from '../types/user.types';
import { toast } from 'react-toastify';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, error } = useSelector(selectAuth);
  
  // Login mutation
  const loginMutation = useMutation(
    {
      mutationFn: (credentials: { email: string; password: string }) =>
        usersApi.login(credentials.email, credentials.password),
      onMutate: () => {
        dispatch(loginStart());
      },
      onSuccess: (data) => {
        dispatch(loginSuccess({ user: data.user, token: data.token }));
        navigate('/');
        toast.success('Login successful');
      },
      onError: (error: any) => {
        dispatch(loginFailure(error.message));
        toast.error(`Login failed: ${error.message}`);
      },
    }
  );
  
  // Register mutation
  const registerMutation = useMutation(
    {
      mutationFn: (userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
      }) => usersApi.register(userData),
      onSuccess: () => {
        toast.success('Registration successful. Please log in.');
        navigate('/auth/login');
      },
      onError: (error: any) => {
        toast.error(`Registration failed: ${error.message}`);
      },
    }
  );
  
  // Logout function
  const logout = () => {
    dispatch(logoutAction());
    navigate('/auth/login');
    toast.info('You have been logged out');
  };
  
  // Update profile mutation
  const updateProfileMutation = useMutation(
    {
      mutationFn: (updates: Partial<User>) => usersApi.updateCurrentUser(updates),
      onSuccess: (updatedUser: User) => {
        dispatch(updateUser(updatedUser));
        toast.success('Profile updated successfully');
      },
      onError: (error: any) => {
        toast.error(`Failed to update profile: ${error.message}`);
      },
    }
  );
  
  // Change password mutation
  const changePasswordMutation = useMutation(
    {
      mutationFn: (passwords: { currentPassword: string; newPassword: string }) =>
        usersApi.changePassword(passwords.currentPassword, passwords.newPassword),
      onSuccess: () => {
        toast.success('Password changed successfully');
      },
      onError: (error: any) => {
        toast.error(`Failed to change password: ${error.message}`);
      },
    }
  );
  
  // Reset password request mutation
  const resetPasswordRequestMutation = useMutation(
    {
      mutationFn: (email: string) => usersApi.requestPasswordReset(email),
      onSuccess: () => {
        toast.success('Password reset link sent to your email');
      },
      onError: (error: any) => {
        toast.error(`Failed to request password reset: ${error.message}`);
      },
    }
  );
  
  // Reset password mutation
  const resetPasswordMutation = useMutation(
    {
      mutationFn: (data: { token: string; newPassword: string }) =>
        usersApi.resetPassword(data.token, data.newPassword),
      onSuccess: () => {
        toast.success('Password reset successful. You can now log in with your new password.');
        navigate('/auth/login');
      },
      onError: (error: any) => {
        toast.error(`Failed to reset password: ${error.message}`);
      },
    }
  );
  
  return {
    user,
    isAuthenticated,
    loading,
    error,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    logout,
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
    changePassword: changePasswordMutation.mutate,
    isChangingPassword: changePasswordMutation.isPending,
    requestPasswordReset: resetPasswordRequestMutation.mutate,
    isRequestingPasswordReset: resetPasswordRequestMutation.isPending,
    resetPassword: resetPasswordMutation.mutate,
    isResettingPassword: resetPasswordMutation.isPending,
  };
};
