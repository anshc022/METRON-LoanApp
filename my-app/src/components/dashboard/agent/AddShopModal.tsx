import { useState } from 'react';
import { shopService, type CreateShopData } from '../../../services/shopService';
import type { AxiosError } from 'axios';

interface AddShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddShopModal = ({ isOpen, onClose, onSuccess }: AddShopModalProps) => {
  const [formData, setFormData] = useState<CreateShopData>({
    name: '',
    owner_name: '',
    location: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await shopService.createShop(formData);
      onSuccess();
      onClose();
      setFormData({ name: '', owner_name: '', location: '' });
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Failed to create shop');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 backdrop-blur-sm">
      <div className="relative top-20 mx-auto p-6 border w-[450px] shadow-lg rounded-md bg-white dark:bg-dark-card">
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-3">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Add New Shop</h3>
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded relative">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Shop Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-4 py-2.5 text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 
                         bg-white dark:bg-dark-input border border-gray-300 dark:border-gray-600 
                         rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         hover:border-gray-400 dark:hover:border-gray-500 transition-colors duration-200"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter shop name"
                required
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Owner Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-2.5 text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 
                         bg-white dark:bg-dark-input border border-gray-300 dark:border-gray-600 
                         rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         hover:border-gray-400 dark:hover:border-gray-500 transition-colors duration-200"
                value={formData.owner_name}
                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                placeholder="Enter owner name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-4 py-2.5 text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 
                         bg-white dark:bg-dark-input border border-gray-300 dark:border-gray-600 
                         rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         hover:border-gray-400 dark:hover:border-gray-500 transition-colors duration-200"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter shop location"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-4 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 
                         hover:text-gray-500 dark:hover:text-gray-400 bg-white dark:bg-dark-input
                         border border-gray-300 dark:border-gray-600 rounded-md
                         hover:bg-gray-50 dark:hover:bg-dark-card
                         focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
                         transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 text-sm font-medium text-white bg-primary-600 
                         hover:bg-primary-700 rounded-md focus:outline-none 
                         focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors duration-200 min-w-[100px]
                         flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="ml-2">Adding...</span>
                  </>
                ) : (
                  'Add Shop'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};