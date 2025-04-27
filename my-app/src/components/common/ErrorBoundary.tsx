import React from 'react';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-base px-4 py-12">
          <div className="max-w-md w-full space-y-4">
            <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3 text-red-600 dark:text-red-400">
                <HiOutlineExclamationCircle className="h-6 w-6" />
                <h2 className="text-lg font-medium">Something went wrong</h2>
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-dark-300">
                {this.state.error?.message || 'An unexpected error occurred.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}