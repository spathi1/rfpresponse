// src/pages/Auth/ForgotPassword.tsx

import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { FiMail, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button/Button';

interface ForgotPasswordFormData {
  email: string;
}

const ForgotPassword: React.FC = () => {
  const { requestPasswordReset, isRequestingPasswordReset, error } = useAuth();
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    defaultValues: {
      email: '',
    },
  });
  
  const onSubmit = (data: ForgotPasswordFormData) => {
    requestPasswordReset(data.email);
    setIsSubmitted(true);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400">
            Enter your email address and we'll send you a link to reset your password.
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
                  Error requesting password reset
                </h3>
                <div className="mt-2 text-sm text-danger-700 dark:text-danger-400">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {isSubmitted && !error ? (
          <div className="rounded-md bg-success-50 dark:bg-success-900 dark:bg-opacity-20 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-success-800 dark:text-success-300">
                  Password reset link sent
                </h3>
                <div className="mt-2 text-sm text-success-700 dark:text-success-400">
                  <p>
                    We've sent a password reset link to your email address. Please check your
                    inbox and follow the instructions to reset your password.
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    to="/auth/login"
                    className="inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
                  >
                    <FiArrowLeft className="mr-2 h-4 w-4" />
                    Back to sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  className={`appearance-none rounded-md relative block w-full pl-10 px-3 py-2 border ${
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
              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isRequestingPasswordReset}
                disabled={isRequestingPasswordReset}
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

export default ForgotPassword;
