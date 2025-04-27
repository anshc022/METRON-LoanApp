import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface DashboardStats {
  totalShops: number;
  activeLoans: number;
  todayTarget: number;
  collectedToday: number;
  dueLoans: Array<{
    id: number;
    amount: number;
    due_date: string;
    shopName: string;
  }>;
}

export interface TodayCollection {
  id: number;
  shopName: string;
  amount: number;
  status: 'pending' | 'collected';
  date: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class DashboardService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    };
  }

  async getStats(): Promise<DashboardStats> {
    const userRole = localStorage.getItem('userRole');
    const endpoint = userRole === 'admin' ? '/admin/dashboard/stats' : '/agent/dashboard/stats';
    
    try {
      const response = await axios.get<ApiResponse<DashboardStats>>(`${API_URL}${endpoint}`, this.getAuthHeader());
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch dashboard stats');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  async getTodayCollections(): Promise<TodayCollection[]> {
    const userRole = localStorage.getItem('userRole');
    const endpoint = userRole === 'admin' ? '/admin/dashboard/today-collections' : '/agent/dashboard/today-collections';
    
    try {
      const response = await axios.get<ApiResponse<TodayCollection[]>>(`${API_URL}${endpoint}`, this.getAuthHeader());
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch today\'s collections');
      }
      
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching today\'s collections:', error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();