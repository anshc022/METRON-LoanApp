import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/admin';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AdminStats {
  totalAgents: number;
  totalShops: number;
  totalLoans: number;
  totalCollections: number;
  todayCollections: number;
  pendingCollections: number;
}

export interface Agent {
  id: number;
  name: string;
  email: string;
  location: string;
  created_at?: string;
}

export interface Collection {
  id: number;
  collection_date: string;
  amount_collected: string;
  payment_mode: 'cash' | 'upi' | 'bank_transfer';
  loan_id: number;
  collected_by: number;
  Loan: {
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
  };
  User: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Loan {
  id: number;
  amount: string;
  loan_date: string;
  due_date: string;
  shop_id: number;
  created_by: number;
  status: string;
}

export interface Shop {
  id: number;
  name: string;
  owner_name?: string;
  location: string;
  agent_id?: number;
  agent_name?: string;
}

export interface CreateShopData {
  name: string;
  owner_name?: string;
  location: string;
  agent_id?: number;
}

export interface AdminDashboardData {
  stats: AdminStats;
  recentAgents: Agent[];
  recentCollections: {
    id: number;
    amount_collected: number;
    payment_mode: 'cash' | 'upi' | 'bank_transfer';
    collection_date: string;
    agent_name: string;
    shop_name: string;
  }[];
}

class AdminService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    };
  }

  // Get admin dashboard stats
  async getDashboardStats(): Promise<AdminDashboardData> {
    try {
      const response = await axios.get<ApiResponse<AdminStats>>(`${API_URL}/dashboard/stats`, this.getAuthHeader());
      const stats = response.data.data;

      // Get recent agents and collections
      const [agents, collections] = await Promise.all([
        this.getAllAgents(),
        this.getAllCollections()
      ]);

      return {
        stats: {
          totalAgents: stats.totalAgents,
          totalShops: stats.totalShops,
          totalLoans: stats.totalLoans,
          totalCollections: stats.totalCollections,
          todayCollections: stats.todayCollections,
          pendingCollections: stats.pendingCollections
        },
        recentAgents: agents.slice(0, 5),
        recentCollections: collections
          .sort((a, b) => new Date(b.collection_date).getTime() - new Date(a.collection_date).getTime())
          .slice(0, 5)
          .map(c => ({
            id: c.id,
            amount_collected: Number(c.amount_collected),
            payment_mode: c.payment_mode,
            collection_date: c.collection_date,
            agent_name: c.User?.name || 'Unknown Agent',
            shop_name: c.Loan?.Shop?.name || 'Unknown Shop'
          }))
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  // Agents management
  async createAgent(agentData: { name: string; email: string; password: string; location: string }) {
    const response = await axios.post(`${API_URL}/create-agent`, agentData, this.getAuthHeader());
    return response.data;
  }

  async getAllAgents(): Promise<Agent[]> {
    const response = await axios.get(`${API_URL}/agents`, this.getAuthHeader());
    return response.data.data;
  }

  async getAgentById(id: number): Promise<Agent> {
    const response = await axios.get(`${API_URL}/agent/${id}`, this.getAuthHeader());
    return response.data.data;
  }

  async updateAgent(id: number, data: Partial<Omit<Agent, 'id' | 'created_at'>>) {
    const response = await axios.put(`${API_URL}/agent/${id}`, data, this.getAuthHeader());
    return response.data;
  }

  async deleteAgent(id: number) {
    const response = await axios.delete(`${API_URL}/agent/${id}`, this.getAuthHeader());
    return response.data;
  }

  // Collections
  async getAllCollections(): Promise<Collection[]> {
    try {
      const response = await axios.get<{ success: boolean; collections: Collection[] }>(
        `${API_URL}/collections`,
        this.getAuthHeader()
      );
      return response.data.collections || [];
    } catch (error) {
      console.error('Error fetching collections:', error);
      throw error;
    }
  }

  async getCollectionsByAgent(agentId: number): Promise<Collection[]> {
    try {
      const response = await axios.get<{ success: boolean; data: Collection[] }>(
        `${API_URL}/collections/by-agent/${agentId}`,
        this.getAuthHeader()
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching agent collections:', error);
      throw error;
    }
  }

  async getCollectionsByDateRange(startDate: string, endDate: string): Promise<Collection[]> {
    try {
      const response = await axios.get<{ success: boolean; data: Collection[] }>(
        `${API_URL}/collections/by-date?startDate=${startDate}&endDate=${endDate}`,
        this.getAuthHeader()
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching collections by date range:', error);
      throw error;
    }
  }

  async getCollectionsByLoan(loanId: number): Promise<Collection[]> {
    try {
      const response = await axios.get<{ success: boolean; data: Collection[] }>(
        `${API_URL}/loan/${loanId}/collections`,
        this.getAuthHeader()
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching loan collections:', error);
      throw error;
    }
  }

  // Shop management
  async createShop(shopData: CreateShopData): Promise<Shop> {
    const response = await axios.post(`${API_URL}/create-shop`, shopData, this.getAuthHeader());
    return response.data.data;
  }

  async getAllShops(): Promise<Shop[]> {
    const response = await axios.get(`${API_URL}/shops`, this.getAuthHeader());
    return response.data.data;
  }

  async getShopById(id: number): Promise<Shop> {
    const response = await axios.get(`${API_URL}/shop/${id}`, this.getAuthHeader());
    return response.data.data;
  }

  async updateShop(id: number, data: Partial<CreateShopData>): Promise<Shop> {
    const response = await axios.put(`${API_URL}/shop/${id}`, data, this.getAuthHeader());
    return response.data.data;
  }

  async deleteShop(id: number): Promise<void> {
    await axios.delete(`${API_URL}/shop/${id}`, this.getAuthHeader());
  }

  async getShopCollections(id: number) {
    const response = await axios.get(`${API_URL}/shop/${id}/collections`, this.getAuthHeader());
    return response.data.data;
  }

  // Fetch reports
  async getReports(): Promise<{ name: string; date: string; url: string }[]> {
    const response = await axios.get(`${API_URL}/reports`, this.getAuthHeader());
    return response.data.data;
  }

  // Fetch daily reports
  async getDailyReports(): Promise<{ name: string; date: string; url: string }[]> {
    const response = await axios.get(`${API_URL}/reports/daily`, this.getAuthHeader());
    return response.data.data;
  }

  // Fetch weekly reports
  async getWeeklyReports(): Promise<{ name: string; date: string; url: string }[]> {
    const response = await axios.get(`${API_URL}/reports/weekly`, this.getAuthHeader());
    return response.data.data;
  }

  // Fetch custom reports
  async getCustomReports(startDate: string, endDate: string): Promise<{ name: string; date: string; url: string }[]> {
    const response = await axios.get(`${API_URL}/reports/custom`, {
      params: { startDate, endDate },
      ...this.getAuthHeader()
    });
    return response.data.data;
  }
}

export const adminService = new AdminService();