import { useState, useEffect } from 'react';
import { loanService, type Loan, type CreateLoanData } from '../../../services/loanService';
import { adminService } from '../../../services/adminService';
import { 
  HiOutlineCash,
  HiOutlineCalendar,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineShoppingBag,
  HiOutlineRefresh,
  HiOutlineClock
} from 'react-icons/hi';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
}

export const LoansPage = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [shops, setShops] = useState<{ id: number; name: string }[]>([]);
  const [formData, setFormData] = useState<CreateLoanData>({
    amount: 0,
    loan_date: new Date().toISOString().split('T')[0],
    due_date: '',
    shop_id: 0
  });
  const [rescheduleData, setRescheduleData] = useState({
    new_due_date: '',
    reason: ''
  });

  useEffect(() => {
    loadLoansAndShops();
  }, []);

  const loadLoansAndShops = async () => {
    try {
      setLoading(true);
      const [loansData, shopsData] = await Promise.all([
        loanService.getAllLoans(),
        adminService.getAllShops()
      ]);
      setLoans(loansData);
      setShops(shopsData.map(s => ({ id: s.id, name: s.name })));
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loanService.createLoan(formData);
      setFormData({
        amount: 0,
        loan_date: new Date().toISOString().split('T')[0],
        due_date: '',
        shop_id: 0
      });
      setIsAddModalOpen(false);
      loadLoansAndShops();
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || error.message || 'Failed to create loan');
    }
  };

  const handleEditLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    try {
      await loanService.updateLoan(selectedLoan.id, formData);
      setIsEditModalOpen(false);
      setSelectedLoan(null);
      loadLoansAndShops();
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || error.message || 'Failed to update loan');
    }
  };

  const handleDeleteLoan = async (loanId: number) => {
    if (!window.confirm('Are you sure you want to delete this loan?')) return;

    try {
      await loanService.deleteLoan(loanId);
      loadLoansAndShops();
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || error.message || 'Failed to delete loan');
    }
  };

  const handleRescheduleLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    try {
      await loanService.createReschedule({
        loan_id: selectedLoan.id,
        ...rescheduleData
      });
      setIsRescheduleModalOpen(false);
      setSelectedLoan(null);
      loadLoansAndShops();
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || error.message || 'Failed to reschedule loan');
    }
  };

  const openEditModal = (loan: Loan) => {
    setSelectedLoan(loan);
    setFormData({
      amount: loan.amount,
      loan_date: loan.loan_date.split('T')[0],
      due_date: loan.due_date.split('T')[0],
      shop_id: loan.shop_id
    });
    setIsEditModalOpen(true);
  };

  const openRescheduleModal = (loan: Loan) => {
    setSelectedLoan(loan);
    setRescheduleData({
      new_due_date: '',
      reason: ''
    });
    setIsRescheduleModalOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusBadgeColor = (status: Loan['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400';
      case 'defaulted':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400';
    }
  };

  const LoanModal = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-dark-card">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {isEdit ? 'Edit Loan' : 'Create New Loan'}
          </h3>
          <form onSubmit={isEdit ? handleEditLoan : handleAddLoan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="mt-1 block w-full border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-dark-input dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Loan Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.loan_date}
                onChange={(e) => setFormData({ ...formData, loan_date: e.target.value })}
                className="mt-1 block w-full border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-dark-input dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.due_date}
                min={formData.loan_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="mt-1 block w-full border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-dark-input dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Shop <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.shop_id}
                onChange={(e) => setFormData({ ...formData, shop_id: Number(e.target.value) })}
                className="mt-1 block w-full border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-dark-input dark:text-white"
              >
                <option value="">Select a shop</option>
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  if (isEdit) {
                    setIsEditModalOpen(false);
                  } else {
                    setIsAddModalOpen(false);
                  }
                  setSelectedLoan(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {isEdit ? 'Save Changes' : 'Create Loan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const RescheduleModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-dark-card">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Reschedule Loan
          </h3>
          <form onSubmit={handleRescheduleLoan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={rescheduleData.new_due_date}
                onChange={(e) => setRescheduleData({ ...rescheduleData, new_due_date: e.target.value })}
                className="mt-1 block w-full border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-dark-input dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={rescheduleData.reason}
                onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })}
                rows={3}
                className="mt-1 block w-full border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-dark-input dark:text-white"
                placeholder="Enter reason for rescheduling..."
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsRescheduleModalOpen(false);
                  setSelectedLoan(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Reschedule
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Manage Loans
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Add, edit, and manage loans for all shops
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <HiOutlineCash className="-ml-1 mr-2 h-5 w-5" />
          Create Loan
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {/* Loans List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-card shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-dark-600">
            {loans.map((loan) => (
              <li key={loan.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-dark-card/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                          <HiOutlineCash className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(loan.amount)}
                        </div>
                        <div className="flex items-center mt-1">
                          <HiOutlineShoppingBag className="h-4 w-4 text-gray-400 dark:text-dark-400 mr-1" />
                          <div className="text-sm text-gray-500 dark:text-dark-300">
                            {loan.shop_name || `Shop #${loan.shop_id}`}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col items-end text-sm text-gray-500 dark:text-dark-300">
                        <div className="flex items-center">
                          <HiOutlineCalendar className="h-4 w-4 mr-1" />
                          {new Date(loan.loan_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center mt-1">
                          <HiOutlineClock className="h-4 w-4 mr-1" />
                          Due: {new Date(loan.due_date).toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadgeColor(loan.status)}`}>
                        {loan.status}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openRescheduleModal(loan)}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          title="Reschedule Loan"
                        >
                          <HiOutlineRefresh className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openEditModal(loan)}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          title="Edit Loan"
                        >
                          <HiOutlinePencil className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLoan(loan.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete Loan"
                        >
                          <HiOutlineTrash className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
            {loans.length === 0 && (
              <li className="px-4 py-8">
                <div className="text-center text-gray-500 dark:text-dark-400">
                  No loans found. Create your first loan to get started.
                </div>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Modals */}
      {isAddModalOpen && <LoanModal />}
      {isEditModalOpen && selectedLoan && <LoanModal isEdit />}
      {isRescheduleModalOpen && selectedLoan && <RescheduleModal />}
    </div>
  );
};