// src/pages/Auth/Signup.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { FiMail, FiLock, FiUser, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button/Button';

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, isRegistering, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });
  
  // Watch password for confirmation validation
  const password = watch('password');
  
  const onSubmit = (data: SignupFormData) => {
    registerUser({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
    });
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
            Create a new account
          </h2>
          <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400">
            Or{' '}
            <Link
              to="/auth/login"
              className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
            >
              sign in to your existing account
            </Link>
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
                  Error creating account
                </h3>
                <div className="mt-2 text-sm text-danger-700 dark:text-danger-400">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="firstName" className="sr-only">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                  </div>
                  <input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    {...register('firstName', {
                      required: 'First name is required',
                    })}
                    className={`appearance-none rounded-md relative block w-full pl-10 px-3 py-2 border ${
                      errors.firstName
                        ? 'border-danger-300 text-danger-900 placeholder-danger-300 focus:ring-danger-500 focus:border-danger-500'
                        : 'border-neutral-300 dark:border-neutral-700 placeholder-neutral-500 focus:ring-primary-500 focus:border-primary-500'
                    } focus:outline-none focus:z-10 sm:text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100`}
                    placeholder="First Name"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="lastName" className="sr-only">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                  </div>
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    {...register('lastName', {
                      required: 'Last name is required',
                    })}
                    className={`appearance-none rounded-md relative block w-full pl-10 px-3 py-2 border ${
                      errors.lastName
                        ? 'border-danger-300 text-danger-900 placeholder-danger-300 focus:ring-danger-500 focus:border-danger-500'
                        : 'border-neutral-300 dark:border-neutral-700 placeholder-neutral-500 focus:ring-primary-500 focus:border-primary-500'
                    } focus:outline-none focus:z-10 sm:text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100`}
                    placeholder="Last Name"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="signupEmail" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                </div>
                <input
                  id="signupEmail"
                  type="email"
                  autoComplete="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  className={`appearance-none rounded-t-md relative block w-full pl-10 px-3 py-2 border ${
                    errors.email
                      ? 'border-danger-300 text-danger-900 placeholder-danger-300 focus:ring-danger-500 focus:border-danger-500'
                      : 'border-neutral-300 dark:border-neutral-700 placeholder-neutral-500 focus:ring-primary-500 focus:border-primary-500'
                  } focus:outline-none focus:z-10 sm:text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100`}
                  placeholder="Email address"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">
                  {errors.email.message}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="signupPassword" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                </div>
                <input
                  id="signupPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                  })}
                  className={`appearance-none rounded-none relative block w-full pl-10 px-3 py-2 border ${
                    errors.password
                      ? 'border-danger-300 text-danger-900 placeholder-danger-300 focus:ring-danger-500 focus:border-danger-500'
                      : 'border-neutral-300 dark:border-neutral-700 placeholder-neutral-500 focus:ring-primary-500 focus:border-primary-500'
                  } focus:outline-none focus:z-10 sm:text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100`}
                  placeholder="Password"
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
                    validate: (value: string) => value === password || 'Passwords do not match',
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
          </div>
          
          <div className="flex items-center">
            <input
              id="accept-terms"
              type="checkbox"
              {...register('acceptTerms', {
                required: 'You must accept the terms and conditions',
              })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 dark:border-neutral-700 rounded"
            />
            <label
              htmlFor="accept-terms"
              className="ml-2 block text-sm text-neutral-900 dark:text-neutral-100"
            >
              I accept the{' '}
              <Link
                to="/terms"
                className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
              >
                terms and conditions
              </Link>
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">
              {errors.acceptTerms.message}
            </p>
          )}
          
          <div>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isRegistering}
              disabled={isRegistering}
            >
              Create Account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default Signup;
