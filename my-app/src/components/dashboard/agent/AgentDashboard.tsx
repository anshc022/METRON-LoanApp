import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { authService } from '../../../services/authService';
import { dashboardService, type DashboardStats, type TodayCollection } from '../../../services/dashboardService';
import { collectionService } from '../../../services/collectionService';
import { Sidebar } from '../Sidebar';
import { ShopsPage } from './ShopsPage';
import { LoansPage } from './LoansPage';
import { CollectionsPage } from './CollectionsPage';
import { SchedulePage } from './SchedulePage';
import { ErrorBoundary } from '../../common/ErrorBoundary';
import {
  HiOutlineShoppingBag,
  HiOutlineCash,
  HiOutlineCollection,
  HiOutlineExclamationCircle,
  HiOutlineCalendar,
  HiOutlineChartBar,
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

interface DueLoan {
  id: number;
  amount: number;
  due_date: string;
  shopName: string;
}

interface CollectionForm {
  amount: number;
  payment_mode: 'cash' | 'upi' | 'bank_transfer';
}

export const AgentDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayCollections, setTodayCollections] = useState<TodayCollection[]>([]);
  const [dueLoans, setDueLoans] = useState<DueLoan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<DueLoan | null>(null);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [collectionForm, setCollectionForm] = useState<CollectionForm>({
    amount: 0,
    payment_mode: 'cash'
  });
  const [submitting, setSubmitting] = useState(false);

  const userData = authService.getUserData();
  const location = useLocation();

  useEffect(() => {
    loadDashboardData();
    
    // Add logging to debug current route
    console.log('Current location:', location.pathname);
  }, [location.pathname]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [statsData, collectionsData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getTodayCollections()
      ]);

      console.log('Dashboard Stats:', statsData);
      console.log('Today Collections:', collectionsData);
      
      setStats(statsData);
      setTodayCollections(collectionsData);
      if (statsData.dueLoans) {
        setDueLoans(statsData.dueLoans);
      }
    } catch (err) {
      console.error('Dashboard loading error:', err);
      const error = err as ApiError;
      setError(error.response?.data?.message || error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    try {
      setSubmitting(true);
      await collectionService.createCollection({
        loan_id: selectedLoan.id,
        amount_collected: collectionForm.amount,
        payment_mode: collectionForm.payment_mode,
        collection_date: new Date().toISOString().split('T')[0]
      });

      setShowCollectionModal(false);
      setSelectedLoan(null);
      setCollectionForm({ amount: 0, payment_mode: 'cash' });
      loadDashboardData(); // Refresh data
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || error.message || 'Failed to create collection');
    } finally {
      setSubmitting(false);
    }
  };

  const statsDisplay = [
    { 
      title: 'My Shops', 
      value: (stats?.totalShops ?? 0).toString() || '-', 
      icon: <HiOutlineShoppingBag className="w-8 h-8" /> 
    },
    { 
      title: 'Active Loans', 
      value: (stats?.activeLoans ?? 0).toString() || '-', 
      icon: <HiOutlineCash className="w-8 h-8" /> 
    },
    { 
      title: "Today's Target", 
      value: stats?.todayTarget ? `₹${stats.todayTarget.toLocaleString()}` : '-', 
      icon: <HiOutlineChartBar className="w-8 h-8" /> 
    },
    { 
      title: 'Collected Today', 
      value: stats?.collectedToday ? `₹${stats.collectedToday.toLocaleString()}` : '-', 
      icon: <HiOutlineCollection className="w-8 h-8" /> 
    }
  ];

  const renderDashboardContent = () => (
    <>
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsDisplay.map((stat, index) => (
              <div
                key={index}
                className="bg-white dark:bg-dark-card rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-dark-300 transition-colors duration-200">{stat.title}</p>
                    <p className="text-gray-900 dark:text-white text-2xl font-bold mt-2 transition-colors duration-200">{stat.value}</p>
                  </div>
                  <div className="text-primary-600 dark:text-primary-400 transition-colors duration-200">
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Due Loans */}
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm mb-8 transition-colors duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Loans Due Today
                </h2>
                <span className="flex items-center text-sm text-gray-500 dark:text-dark-400">
                  <HiOutlineClock className="w-5 h-5 mr-2" />
                  Requires Immediate Attention
                </span>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-dark-600">
                {dueLoans.length > 0 ? (
                  dueLoans.map((loan) => (
                    <div key={loan.id} className="py-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-gray-900 dark:text-white font-medium">
                          {loan.shopName}
                        </h3>
                        <p className="text-gray-500 dark:text-dark-400 text-sm">
                          Due Amount: ₹{loan.amount.toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedLoan(loan);
                          setCollectionForm({ ...collectionForm, amount: loan.amount });
                          setShowCollectionModal(true);
                        }}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Collect Payment
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-gray-500 dark:text-dark-400">
                    No loans due today
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Today's Collections */}
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm mb-8 transition-colors duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-200">
                  Today's Collections
                </h2>
                <span className="flex items-center text-sm text-gray-500 dark:text-dark-400 transition-colors duration-200">
                  <HiOutlineCalendar className="w-5 h-5 mr-2" />
                  {new Date().toLocaleDateString()}
                </span>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-dark-600">
                {todayCollections.length > 0 ? (
                  todayCollections.map((collection) => (
                    <div key={collection.id} className="py-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-gray-900 dark:text-white font-medium transition-colors duration-200">
                          {collection.shopName}
                        </h3>
                        <p className="text-gray-500 dark:text-dark-400 text-sm transition-colors duration-200">
                          Expected Amount: ₹{collection.amount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        {collection.status === 'collected' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 transition-colors duration-200">
                            Collected
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 transition-colors duration-200">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-gray-500 dark:text-dark-400">
                    No collections scheduled for today
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Important Notices */}
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 transition-colors duration-200">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-200">
              Important Notices
            </h2>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <HiOutlineExclamationCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 transition-colors duration-200">
                    Attention Required
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400 transition-colors duration-200">
                    <p>
                      Please ensure all collections are completed and submitted before 6 PM today.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Collection Modal */}
          {showCollectionModal && selectedLoan && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-dark-card">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Collect Payment - {selectedLoan.shopName}
                  </h3>
                  <form onSubmit={handleCollect} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Amount
                      </label>
                      <input
                        type="number"
                        required
                        value={collectionForm.amount}
                        onChange={(e) => setCollectionForm({ ...collectionForm, amount: Number(e.target.value) })}
                        max={selectedLoan.amount}
                        className="mt-1 block w-full border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-dark-input dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Payment Mode
                      </label>
                      <select
                        required
                        value={collectionForm.payment_mode}
                        onChange={(e) => setCollectionForm({ ...collectionForm, payment_mode: e.target.value as any })}
                        className="mt-1 block w-full border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-dark-input dark:text-white"
                      >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="bank_transfer">Bank Transfer</option>
                      </select>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCollectionModal(false);
                          setSelectedLoan(null);
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                        disabled={submitting}
                      >
                        {submitting ? 'Submitting...' : 'Collect Payment'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-base transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        role="agent"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className={`lg:ml-64 transition-all duration-300`}>
        {/* Top Navigation */}
        <nav className="bg-white dark:bg-dark-card shadow-sm transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="text-gray-500 dark:text-dark-200 hover:text-gray-700 dark:hover:text-white lg:hidden transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white ml-4 transition-colors duration-200">
                  {location.pathname.includes('/shops') 
                    ? 'My Shops' 
                    : location.pathname.includes('/loans')
                    ? 'Active Loans'
                    : location.pathname.includes('/collections')
                    ? 'Collections'
                    : location.pathname.includes('/schedule')
                    ? 'Loan Schedule'
                    : 'Agent Dashboard'
                  }
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 dark:text-dark-200 transition-colors duration-200">{userData?.name}</span>
                <span className="text-sm px-2 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded transition-colors duration-200">
                  {userData?.location}
                </span>
              </div>
            </div>
          </div>
        </nav>

        {/* Dashboard Content */}
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route index element={renderDashboardContent()} />
            <Route path="dashboard" element={renderDashboardContent()} />
            <Route path="shops" element={<ErrorBoundary><ShopsPage /></ErrorBoundary>} />
            <Route path="loans" element={<ErrorBoundary><LoansPage /></ErrorBoundary>} />
            <Route path="collections" element={<ErrorBoundary><CollectionsPage /></ErrorBoundary>} />
            <Route path="schedule" element={<ErrorBoundary><SchedulePage /></ErrorBoundary>} />
          </Routes>
        </main>
      </div>
    </div>
  );
};