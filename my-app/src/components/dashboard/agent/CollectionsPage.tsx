import { useState, useEffect } from 'react';
import { collectionService, type Collection, type PaymentMode, type CreateCollectionData } from '../../../services/collectionService';
import { HiOutlineTrash, HiOutlinePlus } from 'react-icons/hi';
import { loanService, type Loan } from '../../../services/loanService';

export const CollectionsPage = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    paymentMode: '' as PaymentMode | ''
  });
  const [collectionForm, setCollectionForm] = useState<CreateCollectionData>({
    loan_id: 0,
    amount_collected: 0,
    payment_mode: 'cash',
    collection_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadCollections();
    loadLoans();
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const data = await collectionService.getCollections();
      setCollections(data);
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load collections';
      setError(errorMessage);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLoans = async () => {
    try {
      const data = await loanService.getAllLoans();
      // Map the loan data to include Shop information
      const loansWithShop = data.map(loan => ({
        ...loan,
        Shop: { name: loan.shop?.name || '-' }
      }));
      setLoans(loansWithShop);
    } catch (err: Error | unknown) {
      console.error('Failed to load loans:', err);
    }
  };

  const handleDeleteCollection = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this collection?')) {
      return;
    }
    try {
      const response = await collectionService.deleteCollection(id);
      if (response.success) {
        setCollections(prevCollections => prevCollections.filter(collection => collection.id !== id));
      } else {
        setError('Failed to delete collection');
      }
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete collection';
      setError(errorMessage);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await collectionService.createCollection(collectionForm);
      setShowAddModal(false);
      setCollectionForm({
        loan_id: 0,
        amount_collected: 0,
        payment_mode: 'cash',
        collection_date: new Date().toISOString().split('T')[0]
      });
      loadCollections();
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create collection';
      setError(errorMessage);
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
    return true;
  });

  const getPaymentModeClass = (mode: PaymentMode) => {
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

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Collections</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-dark-200">
            A list of all collections from your assigned shops.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
          >
            <HiOutlinePlus className="-ml-1 mr-2 h-5 w-5" />
            Add Collection
          </button>
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
              onClick={() => {
                setFilters({
                  ...filters,
                  dateFrom: '',
                  dateTo: '',
                });
              }}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Reset Dates
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
              onChange={(e) => setFilters({ ...filters, paymentMode: e.target.value as PaymentMode | '' })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-dark-input dark:text-white"
            >
              <option value="">All</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
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
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Shop</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Amount</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Payment Mode</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Collected By</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-600 bg-white dark:bg-dark-card">
                  {filteredCollections.map((collection) => (
                    <tr key={collection.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">
                        {collection.Loan?.Shop?.name || '-'}
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
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">
                        {collection.User?.name || '-'}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => handleDeleteCollection(collection.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <HiOutlineTrash className="h-5 w-5" />
                          <span className="sr-only">Delete collection</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredCollections.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-dark-300">No collections found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Collection Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-dark-card">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add New Collection</h3>
              <form onSubmit={handleCreateCollection} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Loan</label>
                  <select
                    required
                    value={collectionForm.loan_id}
                    onChange={(e) => {
                      const loan = loans.find(l => l.id === Number(e.target.value));
                      setCollectionForm({
                        ...collectionForm,
                        loan_id: Number(e.target.value),
                        amount_collected: loan ? Number(loan.amount) : 0
                      });
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-dark-input dark:text-white"
                  >
                    <option value="">Select a loan</option>
                    {loans.map(loan => (
                      <option key={loan.id} value={loan.id}>
                        {loan.shop?.name || '-'} - ₹{Number(loan.amount).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                  <input
                    type="number"
                    required
                    value={collectionForm.amount_collected}
                    onChange={(e) => setCollectionForm({ ...collectionForm, amount_collected: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-dark-input dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Mode</label>
                  <select
                    required
                    value={collectionForm.payment_mode}
                    onChange={(e) => setCollectionForm({ ...collectionForm, payment_mode: e.target.value as PaymentMode })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-dark-input dark:text-white"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Collection Date</label>
                  <input
                    type="date"
                    required
                    value={collectionForm.collection_date}
                    onChange={(e) => setCollectionForm({ ...collectionForm, collection_date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-dark-input dark:text-white"
                  />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Create Collection
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};