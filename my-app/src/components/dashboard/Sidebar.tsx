import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import { 
  HiOutlineChartPie,
  HiOutlineUsers,
  HiOutlineShoppingBag,
  HiOutlineCash,
  HiOutlineDocumentReport,
  HiOutlineCog,
  HiOutlineCalendar,
  HiOutlineLogout,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineCollection
} from 'react-icons/hi';

interface MenuItem {
  name: string;
  icon: React.ReactElement;
  path?: string;
  onClick?: () => void;
}

interface SidebarProps {
  role: 'admin' | 'agent';
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ role, isOpen, onClose }) => {
  const navigate = useNavigate();
  const userData = authService.getUserData();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    authService.removeToken();
    // Force a state update to ensure the app reflects the logout immediately
    setTimeout(() => navigate('/login', { replace: true }), 0);
  };

  const adminMenuItems: MenuItem[] = [
    { name: 'Dashboard', icon: <HiOutlineChartPie className="w-6 h-6" />, path: '/admin/dashboard' },
    { name: 'Agents', icon: <HiOutlineUsers className="w-6 h-6" />, path: '/admin/agents' },
    { name: 'Shops', icon: <HiOutlineShoppingBag className="w-6 h-6" />, path: '/admin/shops' },
    { name: 'Loans', icon: <HiOutlineCash className="w-6 h-6" />, path: '/admin/loans' },
    { name: 'Collections', icon: <HiOutlineCollection className="w-6 h-6" />, path: '/admin/collections' },
    { name: 'Reports', icon: <HiOutlineDocumentReport className="w-6 h-6" />, path: '/admin/reports' },
    { name: 'Settings', icon: <HiOutlineCog className="w-6 h-6" />, path: '/admin/settings' },
  ];

  const agentMenuItems: MenuItem[] = [
    { name: 'Dashboard', icon: <HiOutlineChartPie className="w-6 h-6" />, path: '/agent/dashboard' },
    { name: 'My Shops', icon: <HiOutlineShoppingBag className="w-6 h-6" />, path: '/agent/shops' },
    { name: 'Active Loans', icon: <HiOutlineCash className="w-6 h-6" />, path: '/agent/loans' },
    { name: 'Collections', icon: <HiOutlineCollection className="w-6 h-6" />, path: '/agent/collections' },
    { name: 'Schedule', icon: <HiOutlineCalendar className="w-6 h-6" />, path: '/agent/schedule' },
  ];

  const menuItems = role === 'admin' ? adminMenuItems : agentMenuItems;

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity lg:hidden ${
          isOpen ? 'opacity-100 z-40' : 'opacity-0 -z-10'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full bg-white dark:bg-dark-card w-64 transform transition-all duration-300 ease-in-out z-50 lg:translate-x-0 border-r border-gray-200 dark:border-dark-700 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* User Info */}
          <div className="p-4 border-b border-gray-200 dark:border-dark-600">
            <div className="text-lg font-bold text-primary-600 dark:text-primary-400">{userData?.name}</div>
            <div className="text-sm text-gray-600 dark:text-dark-300">{userData?.role}</div>
            {userData?.location && (
              <div className="text-sm text-gray-500 dark:text-dark-400">{userData?.location}</div>
            )}
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path || '#'}
                className="w-full px-4 py-3 flex items-center space-x-3 text-gray-700 dark:text-dark-100 hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors duration-200"
                onClick={item.onClick}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Theme Toggle & Logout */}
          <div className="border-t border-gray-200 dark:border-dark-600">
            <button
              onClick={toggleTheme}
              className="w-full px-4 py-3 flex items-center space-x-3 text-gray-700 dark:text-dark-100 hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors duration-200"
            >
              {theme === 'dark' ? (
                <HiOutlineSun className="w-6 h-6" />
              ) : (
                <HiOutlineMoon className="w-6 h-6" />
              )}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 flex items-center space-x-3 text-gray-700 dark:text-dark-100 hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors duration-200"
            >
              <HiOutlineLogout className="w-6 h-6" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};