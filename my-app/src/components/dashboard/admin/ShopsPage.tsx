import { useState, useEffect } from 'react';
import { adminService, type Shop, type CreateShopData } from '../../../services/adminService';
import { 
  HiOutlineShoppingBag,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineUser,
  HiOutlineLocationMarker,
  HiOutlineCollection
} from 'react-icons/hi';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
}

export const ShopsPage = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [agents, setAgents] = useState<{ id: number; name: string }[]>([]);
  const [formData, setFormData] = useState<CreateShopData>({
    name: '',
    owner_name: '',
    location: '',
    agent_id: undefined
  });

  useEffect(() => {
    loadShopsAndAgents();
  }, []);

  const loadShopsAndAgents = async () => {
    try {
      setLoading(true);
      const [shopsData, agentsData] = await Promise.all([
        adminService.getAllShops(),
        adminService.getAllAgents()
      ]);
      setShops(shopsData);
      setAgents(agentsData.map(a => ({ id: a.id, name: a.name })));
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createShop(formData);
      setFormData({ name: '', owner_name: '', location: '', agent_id: undefined });
      setIsAddModalOpen(false);
      loadShopsAndAgents();
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || error.message || 'Failed to create shop');
    }
  };

  const handleEditShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop) return;

    try {
      await adminService.updateShop(selectedShop.id, formData);
      setIsEditModalOpen(false);
      setSelectedShop(null);
      loadShopsAndAgents();
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || error.message || 'Failed to update shop');
    }
  };

  const handleDeleteShop = async (shopId: number) => {
    if (!window.confirm('Are you sure you want to delete this shop?')) return;

    try {
      await adminService.deleteShop(shopId);
      loadShopsAndAgents();
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || error.message || 'Failed to delete shop');
    }
  };

  const openEditModal = (shop: Shop) => {
    setSelectedShop(shop);
    setFormData({
      name: shop.name,
      owner_name: shop.owner_name || '',
      location: shop.location,
      agent_id: shop.agent_id
    });
    setIsEditModalOpen(true);
  };

  const ShopModal = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-dark-card">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {isEdit ? 'Edit Shop' : 'Add New Shop'}
          </h3>
          <form onSubmit={isEdit ? handleEditShop : handleAddShop} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Shop Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-dark-input dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Owner Name
              </label>
              <input
                type="text"
                value={formData.owner_name}
                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                className="mt-1 block w-full border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-dark-input dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="mt-1 block w-full border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-dark-input dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Assign Agent
              </label>
              <select
                value={formData.agent_id || ''}
                onChange={(e) => setFormData({ ...formData, agent_id: e.target.value ? Number(e.target.value) : undefined })}
                className="mt-1 block w-full border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-dark-input dark:text-white"
              >
                <option value="">Select an agent</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
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
                  setSelectedShop(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {isEdit ? 'Save Changes' : 'Add Shop'}
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
            Manage Shops
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Add, edit, and manage your collection shops
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <HiOutlineShoppingBag className="-ml-1 mr-2 h-5 w-5" />
          Add Shop
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {/* Shops List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-card shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-dark-600">
            {shops.map((shop) => (
              <li key={shop.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-dark-card/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                          <HiOutlineShoppingBag className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {shop.name}
                        </div>
                        <div className="flex items-center mt-1">
                          <HiOutlineUser className="h-4 w-4 text-gray-400 dark:text-dark-400 mr-1" />
                          <div className="text-sm text-gray-500 dark:text-dark-300">
                            {shop.owner_name || 'No owner specified'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-sm text-gray-500 dark:text-dark-300">
                        <HiOutlineLocationMarker className="h-4 w-4 mr-1" />
                        {shop.location}
                      </div>
                      <div className="flex items-center text-sm text-primary-600 dark:text-primary-400">
                        <HiOutlineCollection className="h-4 w-4 mr-1" />
                        {shop.agent_name || 'Unassigned'}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(shop)}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          <HiOutlinePencil className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteShop(shop.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <HiOutlineTrash className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
            {shops.length === 0 && (
              <li className="px-4 py-8">
                <div className="text-center text-gray-500 dark:text-dark-400">
                  No shops found. Add your first shop to get started.
                </div>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Modals */}
      {isAddModalOpen && <ShopModal />}
      {isEditModalOpen && selectedShop && <ShopModal isEdit />}
    </div>
  );
};