
// src/pages/Auth/ResetPassword.tsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useForm } from 'react-hook-form';
import { FiLock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button/Button';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword, isResettingPassword, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Get token from URL query params
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });
  
  // Watch password for confirmation validation
  const password = watch('password');
  
  const onSubmit = (data: ResetPasswordFormData) => {
    if (!token) {
      return;
    }
    
    resetPassword({ token, newPassword: data.password });
    setIsSuccess(true);
  };
  
  // If no token is provided, show error
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400">
              The password reset link is invalid or has expired.
            </p>
          </div>
          
          <div className="rounded-md bg-danger-50 dark:bg-danger-900 dark:bg-opacity-20 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-danger-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-danger-800 dark:text-danger-300">
                  Error resetting password
                </h3>
                <div className="mt-2 text-sm text-danger-700 dark:text-danger-400">
                  <p>
                    The password reset link is invalid or has expired. Please request a new
                    password reset link.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-center">
            <Link
              to="/auth/forgot-password"
              className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
            >
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400">
            Enter your new password below.
          </p>
        </div>
        
        {error && (
          <div className="rounded-md bg-danger-50 dark:bg-danger-900 dark:bg-opacity-20 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-danger-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-danger-800 dark:text-danger-300">
                  Error resetting password
                </h3>
                <div className="mt-2 text-sm text-danger-700 dark:text-danger-400">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {isSuccess && !error ? (
          <div className="rounded-md bg-success-50 dark:bg-success-900 dark:bg-opacity-20 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiCheckCircle className="h-5 w-5 text-success-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-success-800 dark:text-success-300">
                  Password reset successful
                </h3>
                <div className="mt-2 text-sm text-success-700 dark:text-success-400">
                  <p>
                    Your password has been reset successfully. You can now sign in with your
                    new password.
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    to="/auth/login"
                    className="inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
                  >
                    Go to sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="password" className="sr-only">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                  })}
                  className={`appearance-none rounded-t-md relative block w-full pl-10 px-3 py-2 border ${
                    errors.password
                      ? 'border-danger-300 text-danger-900 placeholder-danger-300 focus:ring-danger-500 focus:border-danger-500'
                      : 'border-neutral-300 dark:border-neutral-700 placeholder-neutral-500 focus:ring-primary-500 focus:border-primary-500'
                  } focus:outline-none focus:z-10 sm:text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100`}
                  placeholder="New Password"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-neutral-400 hover:text-neutral-500 dark:hover:text-neutral-300 focus:outline-none"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">
                  {errors.password.message}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                </div>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match',
                  })}
                  className={`appearance-none rounded-b-md relative block w-full pl-10 px-3 py-2 border ${
                    errors.confirmPassword
                      ? 'border-danger-300 text-danger-900 placeholder-danger-300 focus:ring-danger-500 focus:border-danger-500'
                      : 'border-neutral-300 dark:border-neutral-700 placeholder-neutral-500 focus:ring-primary-500 focus:border-primary-500'
                  } focus:outline-none focus:z-10 sm:text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100`}
                  placeholder="Confirm Password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
            
            <div>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isResettingPassword}
                disabled={isResettingPassword}
              >
                Reset Password
              </Button>
            </div>
            
            <div className="flex items-center justify-center">
              <Link
                to="/auth/login"
                className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
              >
                Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
  
