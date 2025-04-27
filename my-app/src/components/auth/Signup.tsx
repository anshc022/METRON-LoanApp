import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { authService } from '../../services/authService';
import { SignupFormValues } from '../../types/auth';
import { useState } from 'react';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

export const Signup = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const formik = useFormik<SignupFormValues>({
    initialValues: {
      name: '',
      email: '',
      password: '',
      role: 'agent',
      location: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Required'),
      email: Yup.string().email('Invalid email address').required('Required'),
      password: Yup.string()
        .min(8, 'Must be at least 8 characters')
        .required('Required'),
      role: Yup.string().oneOf(['admin', 'agent']).required('Required'),
      location: Yup.string().when('role', {
        is: 'agent',
        then: (schema) => schema.required('Location required for agents'),
      }),
    }),
    onSubmit: async (values) => {
      try {
        const response = await authService.signup(values);
        if (response.success) {
          navigate('/login', { state: { message: 'Registration successful! Please login.' } });
        } else {
          setError(response.message);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'An error occurred');
      }
    },
  });

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Already have an account?"
      linkText="Sign in"
      linkTo="/login"
    >
      <form className="mt-8 space-y-6" onSubmit={formik.handleSubmit}>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded flex items-center space-x-2" role="alert">
            <HiOutlineExclamationCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-dark-200">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="mt-1 block w-full px-4 py-2 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
              placeholder="Enter your full name"
              {...formik.getFieldProps('name')}
            />
            {formik.touched.name && formik.errors.name && (
              <div className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.name}</div>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-dark-200">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 block w-full px-4 py-2 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
              placeholder="Enter your email"
              {...formik.getFieldProps('email')}
            />
            {formik.touched.email && formik.errors.email && (
              <div className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.email}</div>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-dark-200">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="mt-1 block w-full px-4 py-2 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
              placeholder="Enter your password"
              {...formik.getFieldProps('password')}
            />
            {formik.touched.password && formik.errors.password && (
              <div className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.password}</div>
            )}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-dark-200">
              Role
            </label>
            <select
              id="role"
              name="role"
              className="mt-1 block w-full px-4 py-2 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
              {...formik.getFieldProps('role')}
            >
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </select>
            {formik.touched.role && formik.errors.role && (
              <div className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.role}</div>
            )}
          </div>

          {formik.values.role === 'agent' && (
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-dark-200">
                Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                className="mt-1 block w-full px-4 py-2 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                placeholder="Enter your location"
                {...formik.getFieldProps('location')}
              />
              {formik.touched.location && formik.errors.location && (
                <div className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.location}</div>
              )}
            </div>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-dark-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {formik.isSubmitting ? 'Signing up...' : 'Sign up'}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};