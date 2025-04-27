import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  linkText: string;
  linkTo: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  linkText,
  linkTo,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-dark-base transition-colors duration-200 px-4">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-white dark:bg-dark-card text-gray-700 dark:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors duration-200 shadow-sm"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <HiOutlineSun className="w-6 h-6" />
          ) : (
            <HiOutlineMoon className="w-6 h-6" />
          )}
        </button>
      </div>
      
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-sm transition-colors duration-200">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
              {title}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-dark-300 transition-colors duration-200">
              {subtitle}{' '}
              <Link
                to={linkTo}
                className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-200"
              >
                {linkText}
              </Link>
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};