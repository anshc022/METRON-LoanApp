import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './authService';

const API_BASE_URL = 'http://192.168.31.36:5000';

export interface Location {
  id: number;
  name: string;
  city: string;
}

export interface Shop {
  id: number;
  name: string;
  owner_name: string;
  father_name?: string;
  date_of_birth?: string;
  location: string;
  location_id?: number;
  agent_id?: number;
  aadhaar_doc?: string;
  aadhaar_number?: string;
  pan_doc?: string;
  pan_number?: string;
  bank_book_doc?: string;
  live_photo_with_doc?: string;
  shop_photos?: string[] | string;
  customer_photo?: string;
  boi_photo?: string;
  shopAddress?: string;
  shopPinCode?: string;
  residenceAddress?: string;
  residencePinCode?: string;
  companyName?: string;
  mobileNumber?: string;
  newMemberName?: string;
  newMemberAddress?: string;
  intendedName?: string;
  gpsLocationHome?: string;
  gpsLocationShop?: string;
  customer_serial_number?: number;
  renewal_counter?: number;
  created_at?: string;
  status?: string;
  agent?: {
    id: number;
    name: string;
    email: string;
    location: string;
  };
  // Legacy fields for backwards compatibility
  shopName?: string;
  ownerName?: string;
  address?: string;
  phoneNumber?: string;
  agentId?: number;
}

export interface Loan {
  id: number;
  customer_number?: string;
  amount: number;
  net_amount: number;
  interest_amount: number;
  package_charge: number;
  bank_amount: number;
  total_payable: number;
  disbursement_amount: number;
  per_day_amount: number;
  rounded_per_day_amount: number;
  extra_per_day_amount?: number;
  total_extra_amount?: number;
  days_saved?: number;
  early_completion_date?: string;
  total_installments: number;
  total_months: number;
  monthly_interest?: number;
  monthly_interest_percentage?: number;
  policy_start_date?: string;
  payment_start_date?: string;
  policy_end_date?: string;
  loan_date: string;
  due_date: string;
  status: 'active' | 'completed' | 'defaulted' | 'rescheduled' | 'cancelled';
  approval_status?: 'pending' | 'approved' | 'rejected';
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  shop_id: number;
  created_by: number;
  created_at: string;
  updated_at?: string;
  shop_name?: string;
  owner_name?: string;
  total_to_repay?: number;
  Shop?: Shop;
  // Legacy fields for backwards compatibility
  shopId?: number;
  interestRate?: number;
  tenure?: number;
}

export interface Agent {
  id: number;
  name: string;
  email: string;
  location: string;
  // Backend uses isActive (boolean); we expose both for UI convenience
  isActive?: boolean;
  phone?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface AdminStats {
  totalAgents: number;
  totalShops: number;
  totalLoans: number;
  totalActiveLoans?: number;
  totalCollectedAmount?: number;
}

export interface AgentStats {
  totalShops: number;
  totalLoans: number;
  activeLoans: number;
  totalCollected: number;
  pendingCollections: number;
}

class ApiService {
  private getAuthHeaders() {
    const token = authService.getToken();
    console.log('API Service - Token:', token ? 'Present' : 'Missing');
    if (!token) {
      throw new Error('No authentication token available');
    }
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-KEY': 'your-api-key-here',
        'Content-Type': 'application/json',
      },
    };
  }

  // Agent APIs
  async getAgentStats(): Promise<AgentStats> {
    const response = await axios.get(
      `${API_BASE_URL}/api/agent/dashboard/stats`,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  async getAgentShops(): Promise<Shop[]> {
    const response = await axios.get(
      `${API_BASE_URL}/api/agent/shops`,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  async getAgentLoans(): Promise<Loan[]> {
    const response = await axios.get(
      `${API_BASE_URL}/api/agent/loans`,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  // Admin APIs
  async getAdminStats(): Promise<AdminStats> {
    const response = await axios.get(
      `${API_BASE_URL}/api/admin/dashboard/stats`,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  async getAllAgents(): Promise<Agent[]> {
    const response = await axios.get(
      `${API_BASE_URL}/api/admin/agents`,
      this.getAuthHeaders()
    );
    const agents = response.data.data as any[];
    // Map backend shape (isActive boolean) to UI-friendly status
    return agents.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      location: a.location,
      phone: a.phone,
      isActive: a.isActive,
      status: a.isActive ? 'active' : 'inactive',
      created_at: a.created_at,
    } as Agent));
  }

  async createAgent(agentData: { name: string; email: string; password: string; location: string }) {
    const response = await axios.post(
      `${API_BASE_URL}/api/admin/create-agent`,
      agentData,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async getAgentById(id: number): Promise<Agent> {
    const response = await axios.get(
      `${API_BASE_URL}/api/admin/agent/${id}`,
      this.getAuthHeaders()
    );
    const a = response.data.data;
    return {
      id: a.id,
      name: a.name,
      email: a.email,
      location: a.location,
      phone: a.phone,
      isActive: a.isActive,
      status: a.isActive ? 'active' : 'inactive',
      created_at: a.created_at,
    } as Agent;
  }

  async updateAgent(id: number, data: Partial<Omit<Agent, 'id' | 'created_at'>>): Promise<Agent> {
    const response = await axios.put(
      `${API_BASE_URL}/api/admin/agent/${id}`,
      data,
      this.getAuthHeaders()
    );
    return response.data.data ?? response.data;
  }

  async deleteAgent(id: number) {
    const response = await axios.delete(
      `${API_BASE_URL}/api/admin/agent/${id}`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async resetAgentPassword(agentId: number, newPassword: string) {
    const response = await axios.put(
      `${API_BASE_URL}/api/admin/agent/${agentId}/reset-password`,
      { newPassword },
      this.getAuthHeaders()
    );
    return response.data;
  }

  async deactivateAgent(agentId: number) {
    const response = await axios.put(
      `${API_BASE_URL}/api/admin/agent/${agentId}/deactivate`,
      {},
      this.getAuthHeaders()
    );
    return response.data;
  }

  async activateAgent(agentId: number) {
    const response = await axios.put(
      `${API_BASE_URL}/api/admin/agent/${agentId}/activate`,
      {},
      this.getAuthHeaders()
    );
    return response.data;
  }

  async getAllShops(): Promise<Shop[]> {
    const response = await axios.get(
      `${API_BASE_URL}/api/admin/shops`,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  async getAllLoans(): Promise<Loan[]> {
    const response = await axios.get(
      `${API_BASE_URL}/api/admin/loans`,
      this.getAuthHeaders()
    );
    return response.data.data;
  }

  async getShopById(id: number): Promise<Shop> {
    try {
      // Try multiple ways to get user role
      let userRole = await AsyncStorage.getItem('userRole');
      
      // If userRole is null, get it from userData
      if (!userRole) {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          userRole = user.role;
          // Store it for future use
          if (userRole) {
            await AsyncStorage.setItem('userRole', userRole);
          }
        }
      }
      
      const endpoint = userRole === 'admin' ? 'admin' : 'agent';
      
      console.log('API Service - Getting shop details:', {
        shopId: id,
        userRole,
        endpoint,
        url: `${API_BASE_URL}/api/${endpoint}/shop/${id}`
      });

      const headers = this.getAuthHeaders();
      console.log('API Service - Headers:', headers);

      const response = await axios.get(
        `${API_BASE_URL}/api/${endpoint}/shop/${id}`,
        headers
      );
      
      console.log('API Service - Shop details response:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('API Service - Error getting shop details:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        shopId: id
      });
      throw error;
    }
  }

  async getLoanById(id: number): Promise<Loan> {
    try {
      // Try multiple ways to get user role
      let userRole = await AsyncStorage.getItem('userRole');
      
      // If userRole is null, get it from userData
      if (!userRole) {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          userRole = user.role;
          // Store it for future use
          if (userRole) {
            await AsyncStorage.setItem('userRole', userRole);
          }
        }
      }
      
      const endpoint = userRole === 'admin' ? 'admin' : 'agent';
      
      console.log('API Service - Getting loan details:', {
        loanId: id,
        userRole,
        endpoint,
        url: `${API_BASE_URL}/api/${endpoint}/loan/${id}`
      });

      const headers = this.getAuthHeaders();
      console.log('API Service - Headers:', headers);

      const response = await axios.get(
        `${API_BASE_URL}/api/${endpoint}/loan/${id}`,
        headers
      );
      
      console.log('API Service - Loan details response:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('API Service - Error getting loan details:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        loanId: id
      });
      throw error;
    }
  }

  // Location methods
  async getAllLocations(): Promise<Location[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/locations/all`,
        this.getAuthHeaders()
      );
      return response.data.data;
    } catch (error: any) {
      console.error('API Service - Error fetching locations:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();