import { useState, useEffect } from 'react';
import { shopService, type Shop } from '../../../services/shopService';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineCollection } from 'react-icons/hi';
import { AddShopModal } from './AddShopModal';
import { AxiosError } from 'axios';

export const ShopsPage = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      setLoading(true);
      const data = await shopService.getShops();
      console.log('Fetched shops:', data); // Debugging log
      setShops(data);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadShops(); // Refresh the shop list
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Shops</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-dark-200">
            A list of all shops assigned to you for collection management.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
          >
            <HiOutlinePlus className="-ml-1 mr-2 h-5 w-5" />
            Add Shop
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className="ml-4 inline-flex items-center justify-center rounded-md border border-transparent bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:w-auto"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="mt-8 flex flex-col">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-dark-600">
                <thead className="bg-gray-50 dark:bg-dark-card">
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Owner</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Location</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-600 bg-white dark:bg-dark-card">
                  {shops.map((shop) => (
                    <tr key={shop.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">{shop.name}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">{shop.owner_name || '-'}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">{shop.location}</td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => {/* TODO: Implement edit shop modal */}}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4"
                        >
                          <HiOutlinePencil className="h-5 w-5" />
                          <span className="sr-only">Edit shop</span>
                        </button>
                        <button
                          onClick={() => {/* TODO: Implement view collections */}}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          <HiOutlineCollection className="h-5 w-5" />
                          <span className="sr-only">View collections</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {shops.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-dark-300">No shops found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AddShopModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          loadShops();
          setIsAddModalOpen(false);
        }}
      />
    </div>
  );
};