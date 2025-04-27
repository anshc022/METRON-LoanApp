import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Link, Navigate } from 'react-router-dom';
import { adminService, type AdminDashboardData } from '../../../services/adminService';
import { Sidebar } from '../Sidebar';
import { ErrorBoundary } from '../../common/ErrorBoundary';
import { AgentsPage } from './AgentsPage';
import { ShopsPage } from './ShopsPage';
import { LoansPage } from './LoansPage';
import { ReportsPage } from './ReportsPage';
import { CollectionsPage } from './CollectionsPage'; // Import the new CollectionsPage component
import {
  HiOutlineUserGroup,
  HiOutlineShoppingBag,
  HiOutlineCash,
  HiOutlineCollection,
  HiOutlineCurrencyRupee,
  HiOutlineExclamationCircle,
  HiOutlineCalendar,
  HiOutlineLocationMarker,
  HiOutlineMail,
  HiOutlineViewGrid,
  HiOutlineUsers
} from 'react-icons/hi';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
}

export const AdminDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [activeTab, setActiveTab] = useState('Dashboard'); // Add activeTab state

  const location = useLocation();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getDashboardStats();
      setDashboardData(data);
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || error.message || 'Failed to load dashboard data');
      setDashboardData(null); // Reset data on error
    } finally {
      setLoading(false);
    }
  };

  const statsDisplay = dashboardData ? [
    { 
      title: 'Total Agents', 
      value: dashboardData.stats.totalAgents.toString(),
      icon: <HiOutlineUserGroup className="w-8 h-8" />,
      color: 'text-blue-600 dark:text-blue-400'
    },
    { 
      title: 'Total Shops', 
      value: dashboardData.stats.totalShops.toString(),
      icon: <HiOutlineShoppingBag className="w-8 h-8" />,
      color: 'text-green-600 dark:text-green-400'
    },
    { 
      title: 'Active Loans', 
      value: dashboardData.stats.totalLoans.toString(),
      icon: <HiOutlineCash className="w-8 h-8" />,
      color: 'text-yellow-600 dark:text-yellow-400'
    },
    { 
      title: 'Total Collections', 
      value: `₹${Number(dashboardData.stats.totalCollections).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      icon: <HiOutlineCollection className="w-8 h-8" />,
      color: 'text-indigo-600 dark:text-indigo-400'
    },
    { 
      title: "Today's Collections", 
      value: `₹${Number(dashboardData.stats.todayCollections).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      icon: <HiOutlineCurrencyRupee className="w-8 h-8" />,
      color: 'text-purple-600 dark:text-purple-400'
    },
    { 
      title: 'Pending Collections', 
      value: dashboardData.stats.pendingCollections.toString(),
      icon: <HiOutlineExclamationCircle className="w-8 h-8" />,
      color: 'text-red-600 dark:text-red-400'
    }
  ] : [];

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                  <div className={stat.color}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Agents */}
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm mb-8 transition-colors duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-200">
                  Recent Agents
                </h2>
                <span className="flex items-center text-sm text-gray-500 dark:text-dark-400 transition-colors duration-200">
                  <HiOutlineCalendar className="w-5 h-5 mr-2" />
                  Last 5 Agents
                </span>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-dark-600">
                {dashboardData?.recentAgents.map((agent) => (
                  <div key={agent.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-primary-100 dark:bg-primary-900/20 rounded-full p-2 mr-4">
                        <HiOutlineUserGroup className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <h3 className="text-gray-900 dark:text-white font-medium">{agent.name}</h3>
                        <div className="flex items-center text-sm text-gray-500 dark:text-dark-400 mt-1">
                          <HiOutlineMail className="w-4 h-4 mr-1" />
                          {agent.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex items-center text-sm text-gray-500 dark:text-dark-400 mr-4">
                        <HiOutlineLocationMarker className="w-4 h-4 mr-1" />
                        {agent.location}
                      </div>
                      <span className="text-sm text-gray-500 dark:text-dark-400">
                        {new Date(agent.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Collections */}
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm mb-8 transition-colors duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-200">
                  Recent Collections
                </h2>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-dark-600">
                {dashboardData?.recentCollections.map((collection) => (
                  <div key={collection.id} className="py-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-gray-900 dark:text-white font-medium">{collection.shop_name}</h3>
                      <p className="text-sm text-gray-500 dark:text-dark-400">
                        Collected by: {collection.agent_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        ₹{collection.amount_collected.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-dark-400">
                        {new Date(collection.collection_date).toLocaleDateString()}
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${collection.payment_mode === 'cash' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' :
                          collection.payment_mode === 'upi' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400' :
                          'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400'}`}>
                        {collection.payment_mode.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return renderDashboardContent();
      case 'Agents':
        return <AgentsPage />;
      case 'Shops':
        return <ShopsPage />;
      case 'Loans':
        return <LoansPage />;
      case 'Collections':
        return <CollectionsPage />; // Render the CollectionsPage component
      case 'Reports':
        return <ReportsPage />;
      default:
        return renderDashboardContent();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-base transition-colors duration-200">
      <Sidebar
        role="admin"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onTabChange={setActiveTab}
        activeTab={activeTab}
        tabs={['Dashboard', 'Agents', 'Shops', 'Loans', 'Collections', 'Reports']} // Add Collections to the tabs
      />

      <div className={`lg:ml-64 transition-all duration-300`}>
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
                  {location.pathname.includes('/agents') 
                    ? 'Agents Management'
                    : location.pathname.includes('/shops')
                    ? 'Shops Management'
                    : location.pathname.includes('/loans')
                    ? 'Loans Management'
                    : location.pathname.includes('/collections')
                    ? 'Collections Management'
                    : location.pathname.includes('/reports')
                    ? 'Reports'
                    : 'Admin Dashboard'
                  }
                </h1>
              </div>

              <div className="hidden lg:flex lg:items-center lg:space-x-4">
                <Link
                  to="/admin/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/admin/dashboard'
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 hover:text-gray-900 dark:text-dark-300 dark:hover:text-white'
                  }`}
                >
                  <HiOutlineViewGrid className="inline-block w-5 h-5 mr-1" />
                  Dashboard
                </Link>
                <Link
                  to="/admin/agents"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/admin/agents'
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 hover:text-gray-900 dark:text-dark-300 dark:hover:text-white'
                  }`}
                >
                  <HiOutlineUsers className="inline-block w-5 h-5 mr-1" />
                  Agents
                </Link>
                <Link
                  to="/admin/shops"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/admin/shops'
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 hover:text-gray-900 dark:text-dark-300 dark:hover:text-white'
                  }`}
                >
                  <HiOutlineShoppingBag className="inline-block w-5 h-5 mr-1" />
                  Shops
                </Link>
                <Link
                  to="/admin/loans"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/admin/loans'
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 hover:text-gray-900 dark:text-dark-300 dark:hover:text-white'
                  }`}
                >
                  <HiOutlineCash className="inline-block w-5 h-5 mr-1" />
                  Loans
                </Link>
                <Link
                  to="/admin/collections"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/admin/collections'
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 hover:text-gray-900 dark:text-dark-300 dark:hover:text-white'
                  }`}
                >
                  <HiOutlineCollection className="inline-block w-5 h-5 mr-1" />
                  Collections
                </Link>
                <Link
                  to="/admin/reports"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/admin/reports'
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 hover:text-gray-900 dark:text-dark-300 dark:hover:text-white'
                  }`}
                >
                  <HiOutlineViewGrid className="inline-block w-5 h-5 mr-1" />
                  Reports
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="dashboard" element={<ErrorBoundary>{renderDashboardContent()}</ErrorBoundary>} />
            <Route path="agents" element={<ErrorBoundary><AgentsPage /></ErrorBoundary>} />
            <Route path="shops" element={<ErrorBoundary><ShopsPage /></ErrorBoundary>} />
            <Route path="loans" element={<ErrorBoundary><LoansPage /></ErrorBoundary>} />
            <Route path="collections" element={<ErrorBoundary><CollectionsPage /></ErrorBoundary>} /> {/* Add Collections route */}
            <Route path="reports" element={<ErrorBoundary><ReportsPage /></ErrorBoundary>} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};