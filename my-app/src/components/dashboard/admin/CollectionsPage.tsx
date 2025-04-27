import { useState, useEffect } from 'react';
import { adminService } from '../../../services/adminService';

interface Loan {
  id: number;
  amount: string;
  loan_date: string;
  due_date: string;
  shop_id: number;
  created_by: number;
  status: string;
  Shop: {
    id: number;
    name: string;
    location: string;
    agent_id: number;
  };
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Collection {
  id: number;
  collection_date: string;
  amount_collected: string;
  payment_mode: string;
  loan_id: number;
  collected_by: number;
  Loan: Loan;
  User: User;
}

interface Filters {
  dateFrom: string;
  dateTo: string;
  paymentMode: string;
  agentId: string;
  minAmount: string;
  maxAmount: string;
}

export const CollectionsPage = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<Filters>({
    dateFrom: '',
    dateTo: '',
    paymentMode: '',
    agentId: '',
    minAmount: '',
    maxAmount: ''
  });

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllCollections();
      setCollections(data);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const applyQuickFilter = (period: 'yesterday' | 'lastWeek' | 'lastMonth') => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date(today);
    
    switch (period) {
      case 'yesterday':
        startDate.setDate(today.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'lastWeek':
        startDate.setDate(today.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'lastMonth':
        startDate.setMonth(today.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    setFilters({
      ...filters,
      dateFrom: startDate.toISOString().split('T')[0],
      dateTo: endDate.toISOString().split('T')[0]
    });
  };

  const filteredCollections = collections.filter(collection => {
    if (filters.dateFrom && new Date(collection.collection_date) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(collection.collection_date) > new Date(filters.dateTo)) return false;
    if (filters.paymentMode && collection.payment_mode !== filters.paymentMode) return false;
    if (filters.minAmount && Number(collection.amount_collected) < Number(filters.minAmount)) return false;
    if (filters.maxAmount && Number(collection.amount_collected) > Number(filters.maxAmount)) return false;
    return true;
  });

  const getPaymentModeClass = (mode: string) => {
    switch (mode) {
      case 'cash':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'upi':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'bank_transfer':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const resetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      paymentMode: '',
      agentId: '',
      minAmount: '',
      maxAmount: ''
    });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Collections</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-dark-200">
            A complete list of all collections across your loan network.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 bg-white dark:bg-dark-card shadow rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => applyQuickFilter('yesterday')}
              className="px-3 py-1 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-dark-card dark:text-dark-100 dark:hover:bg-dark-hover"
            >
              Yesterday
            </button>
            <button
              onClick={() => applyQuickFilter('lastWeek')}
              className="px-3 py-1 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-dark-card dark:text-dark-100 dark:hover:bg-dark-hover"
            >
              Last Week
            </button>
            <button
              onClick={() => applyQuickFilter('lastMonth')}
              className="px-3 py-1 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-dark-card dark:text-dark-100 dark:hover:bg-dark-hover"
            >
              Last Month
            </button>
            <button
              onClick={resetFilters}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Reset
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-dark-input dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-dark-input dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Mode</label>
            <select
              value={filters.paymentMode}
              onChange={(e) => setFilters({ ...filters, paymentMode: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-dark-input dark:text-white"
            >
              <option value="">All</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Min Amount</label>
            <input
              type="number"
              value={filters.minAmount}
              onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-dark-input dark:text-white"
              placeholder="Min amount"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Amount</label>
            <input
              type="number"
              value={filters.maxAmount}
              onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-dark-input dark:text-white"
              placeholder="Max amount"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Collections Table */}
      <div className="mt-8 flex flex-col">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-dark-600">
                <thead className="bg-gray-50 dark:bg-dark-card">
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Shop</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Agent</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Amount</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Payment Mode</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-600 bg-white dark:bg-dark-card">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-500 dark:text-dark-400">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredCollections.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-500 dark:text-dark-400">
                        No collections found
                      </td>
                    </tr>
                  ) : (
                    filteredCollections.map((collection) => (
                      <tr key={collection.id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">
                          {collection.Loan?.Shop?.name || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">
                          {collection.User?.name || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">
                          ₹{Number(collection.amount_collected).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getPaymentModeClass(collection.payment_mode)}`}>
                            {collection.payment_mode.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">
                          {new Date(collection.collection_date).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            collection.Loan?.status === 'completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}>
                            {collection.Loan?.status || 'unknown'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};