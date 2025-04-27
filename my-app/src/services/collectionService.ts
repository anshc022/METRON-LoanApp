import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/agent';

export type PaymentMode = 'cash' | 'upi' | 'bank_transfer';

export interface Collection {
  id: number;
  collection_date: string;
  amount_collected: number;
  payment_mode: PaymentMode;
  loan_id: number;
  collected_by: number;
  Loan?: {
    id: number;
    amount: number;
    loan_date: string;
    due_date: string;
    shop_id: number;
    Shop?: {
      id: number;
      name: string;
      location: string;
      agent_id: number;
    };
  };
  User?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CreateCollectionData {
  loan_id: number;
  amount_collected: number;
  payment_mode: PaymentMode;
  collection_date: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  collections?: T;
}

class CollectionService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    };
  }

  // Get all collections for assigned shops
  async getCollections(): Promise<Collection[]> {
    try {
      const response = await axios.get<ApiResponse<Collection[]>>(`${API_URL}/collections`, this.getAuthHeader());
      return response.data.collections || [];
    } catch (error) {
      console.error('Error fetching collections:', error);
      throw error;
    }
  }

  // Get collection by ID
  async getCollectionById(id: number): Promise<Collection> {
    try {
      const response = await axios.get<ApiResponse<Collection>>(`${API_URL}/collection/${id}`, this.getAuthHeader());
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch collection');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching collection:', error);
      throw error;
    }
  }

  // Create new collection
  async createCollection(collectionData: CreateCollectionData): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post<ApiResponse<Collection>>(
        `${API_URL}/create-collection`,
        collectionData,
        this.getAuthHeader()
      );
      return {
        success: response.data.success || false,
        message: response.data.message || 'Collection created successfully'
      };
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  // Update collection
  async updateCollection(id: number, collectionData: Partial<CreateCollectionData>): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.put<ApiResponse<Collection>>(
        `${API_URL}/collection/${id}`,
        collectionData,
        this.getAuthHeader()
      );
      return {
        success: response.data.success || false,
        message: response.data.message || 'Collection updated successfully'
      };
    } catch (error) {
      console.error('Error updating collection:', error);
      throw error;
    }
  }

  // Delete collection
  async deleteCollection(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await axios.delete<ApiResponse<void>>(`${API_URL}/collection/${id}`, this.getAuthHeader());
      return {
        success: response.data.success || false,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error deleting collection:', error);
      throw error;
    }
  }

  // Get collections by shop ID
  async getCollectionsByShop(shopId: number): Promise<Collection[]> {
    try {
      const response = await axios.get<ApiResponse<Collection[]>>(
        `${API_URL}/shop/${shopId}/collections`,
        this.getAuthHeader()
      );
      return response.data.collections || [];
    } catch (error) {
      console.error('Error fetching shop collections:', error);
      throw error;
    }
  }

  // Get collections by loan ID
  async getCollectionsByLoan(loanId: number): Promise<Collection[]> {
    try {
      const response = await axios.get<ApiResponse<Collection[]>>(
        `${API_URL}/loan/${loanId}/collections`,
        this.getAuthHeader()
      );
      return response.data.collections || [];
    } catch (error) {
      console.error('Error fetching loan collections:', error);
      throw error;
    }
  }
}

export const collectionService = new CollectionService();