import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './authService';

const API_BASE_URL = 'https://api-loan-muv1.onrender.com';
const REQUEST_TIMEOUT_MS = 12000;

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
  todayCollected?: number;
  todayCollections?: number;
}

export interface Collection {
  id: number;
  loan_id: number;
  amount: number;
  payment_method: 'cash' | 'upi';
  screenshot_filename?: string;
  collection_date: string;
  created_at: string;
  updated_at: string;
  loan?: Loan;
}

export interface TodayCollection {
  id: number;
  customer_number?: string;
  amount: number;
  net_amount: number;
  total_payable: number;
  per_day_amount: number;
  rounded_per_day_amount: number;
  total_installments: number;
  payment_start_date?: string;
  next_collection_date?: string;
  loan_date: string;
  status: string;
  shop_id: number;
  shop_name?: string;
  owner_name?: string;
  Shop?: Shop;
  todayStatus?: 'pending' | 'collected';
}

class ApiService {
  private getAuthHeaders() {
    const token = authService.getToken();
    console.log('API Service - Token:', token ? 'Present' : 'Missing');
    if (!token) {
      // Return headers without auth to avoid throwing synchronously on UI threads
      return {
        headers: {
          'Content-Type': 'application/json',
        },
      };
    }
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-KEY': 'your-api-key-here',
        'Content-Type': 'application/json',
      },
    };
  }

  private async safeGet<T>(url: string) : Promise<T> {
    const config = { ...this.getAuthHeaders(), timeout: REQUEST_TIMEOUT_MS } as any;
    const resp = await axios.get(url, config);
    return resp.data?.data ?? resp.data;
  }

  // Agent APIs
  async getAgentStats(): Promise<AgentStats> {
    return await this.safeGet<AgentStats>(`${API_BASE_URL}/api/agent/dashboard/stats`);
  }

  async getAgentShops(): Promise<Shop[]> {
    return await this.safeGet<Shop[]>(`${API_BASE_URL}/api/agent/shops`);
  }

  async getAgentLoans(): Promise<Loan[]> {
    return await this.safeGet<Loan[]>(`${API_BASE_URL}/api/agent/loans`);
  }

  // Admin APIs
  async getAdminStats(): Promise<AdminStats> {
    return await this.safeGet<AdminStats>(`${API_BASE_URL}/api/admin/dashboard/stats`);
  }

  async getAllAgents(): Promise<Agent[]> {
    const agents = await this.safeGet<any[]>(`${API_BASE_URL}/api/admin/agents`);
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

  // Collection methods
  async getTodaysCollections(): Promise<TodayCollection[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/collections/today`,
        this.getAuthHeaders()
      );
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('API Service - Error fetching today\'s collections:', error);
      throw error;
    }
  }

  async recordCollection(loanId: number, amount: number, paymentMethod: 'cash' | 'upi', screenshotFile?: any): Promise<Collection> {
    try {
      const formData = new FormData();
      formData.append('amount', amount.toString());
      formData.append('payment_method', paymentMethod);
      // Ensure backend has a collection_date; default to today (YYYY-MM-DD)
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      formData.append('collection_date', `${yyyy}-${mm}-${dd}`);
      
      if (screenshotFile && paymentMethod === 'upi') {
        // Backend expects field name 'payment_screenshot'
        formData.append('payment_screenshot', {
          uri: screenshotFile.uri,
          type: screenshotFile.type || 'image/jpeg',
          name: screenshotFile.name || 'screenshot.jpg',
        } as any);
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/collections/loan/${loanId}/record`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${authService.getToken()}`,
            'X-API-KEY': 'your-api-key-here',
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('API Service - Error recording collection:', error);
      throw error;
    }
  }

  async getCollectionHistory(): Promise<any[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/collections/my-collections`,
        this.getAuthHeaders()
      );
      // The API returns { collections: [...], summary: {...} }
      // We need to extract the collections array
      const data = response.data.data || response.data;
      return data.collections || data || [];
    } catch (error: any) {
      console.error('API Service - Error fetching collection history:', error);
      throw error;
    }
  }

  // Collection Schedule APIs
  async getTodayCollections(agentId?: number): Promise<any> {
    try {
      const url = agentId ? `/api/collection-schedules/today/${agentId}` : '/api/collection-schedules/today';
      const response = await axios.get(
        `${API_BASE_URL}${url}`,
        this.getAuthHeaders()
      );
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('API Service - Error fetching today collections:', error);
      throw error;
    }
  }

  async recordCollectionSchedule(scheduleId: number, collectionData: any): Promise<any> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/collection-schedules/record/${scheduleId}`,
        collectionData,
        this.getAuthHeaders()
      );
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('API Service - Error recording collection:', error);
      throw error;
    }
  }

  async getOverdueCollections(): Promise<any> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/collection-schedules/overdue`,
        this.getAuthHeaders()
      );
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('API Service - Error fetching overdue collections:', error);
      throw error;
    }
  }

  async getCollectionStats(): Promise<any> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/collection-schedules/stats`,
        this.getAuthHeaders()
      );
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('API Service - Error fetching collection stats:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();