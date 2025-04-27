import axios from 'axios';
import { authService } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface Loan {
  id: number;
  amount: number;
  loan_date: string;
  due_date: string;
  status: 'pending' | 'completed' | 'defaulted';
  shop_id: number;
  shop?: {
    name: string;
    owner_name?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateLoanData {
  amount: number;
  loan_date: string;
  due_date: string;
  shop_id: number;
}

export interface RescheduleData {
  loan_id: number;
  new_due_date: string;
  reason: string;
}

export const loanService = {
  getAuthHeader() {
    const token = authService.getToken();
    return {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    };
  },

  async getAllLoans(): Promise<Loan[]> {
    const user = authService.getUserData();
    const endpoint = user?.role === 'admin' ? `${API_URL}/api/admin/loans` : `${API_URL}/api/agent/loans`;
    
    try {
      const response = await axios.get(endpoint, this.getAuthHeader());
      console.log('Loans API Response:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching loans:', error);
      throw error;
    }
  },

  async getLoanById(id: number): Promise<Loan> {
    const user = authService.getUserData();
    const endpoint = user?.role === 'admin' ? `${API_URL}/api/admin/loan/${id}` : `${API_URL}/api/agent/loan/${id}`;
    
    try {
      const response = await axios.get(endpoint, this.getAuthHeader());
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching loan ${id}:`, error);
      throw error;
    }
  },

  async createLoan(loanData: CreateLoanData): Promise<Loan> {
    const user = authService.getUserData();
    const endpoint = user?.role === 'admin' ? `${API_URL}/api/admin/create-loan` : `${API_URL}/api/agent/create-loan`;
    
    try {
      const response = await axios.post(endpoint, loanData, this.getAuthHeader());
      return response.data.data;
    } catch (error) {
      console.error('Error creating loan:', error);
      throw error;
    }
  },

  async updateLoan(id: number, loanData: Partial<CreateLoanData>): Promise<Loan> {
    const user = authService.getUserData();
    const endpoint = user?.role === 'admin' ? `${API_URL}/api/admin/loan/${id}` : `${API_URL}/api/agent/loan/${id}`;
    
    try {
      const response = await axios.put(endpoint, loanData, this.getAuthHeader());
      return response.data.data;
    } catch (error) {
      console.error(`Error updating loan ${id}:`, error);
      throw error;
    }
  },

  async deleteLoan(id: number): Promise<void> {
    // Only admin can delete loans
    const user = authService.getUserData();
    if (user?.role !== 'admin') {
      throw new Error('Not authorized to delete loans');
    }

    try {
      await axios.delete(`${API_URL}/api/admin/loan/${id}`, this.getAuthHeader());
    } catch (error) {
      console.error(`Error deleting loan ${id}:`, error);
      throw error;
    }
  },

  async createReschedule(rescheduleData: RescheduleData): Promise<void> {
    const user = authService.getUserData();
    const endpoint = user?.role === 'admin' ? `${API_URL}/api/admin/create-reschedule` : `${API_URL}/api/agent/create-reschedule`;
    
    try {
      await axios.post(endpoint, rescheduleData, this.getAuthHeader());
    } catch (error) {
      console.error('Error rescheduling loan:', error);
      throw error;
    }
  }
};