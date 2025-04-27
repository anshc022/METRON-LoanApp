import axios from 'axios';

const API_URL = 'http://localhost:5000/api/agent';

export interface Shop {
  id: number;
  name: string;
  owner_name?: string;
  location: string;
  agent_id?: number;
}

export interface CreateShopData {
  name: string;
  owner_name?: string;
  location: string;
}

export const shopService = {
  // Get all shops assigned to the agent
  getShops: async (): Promise<Shop[]> => {
    const response = await axios.get(`${API_URL}/shops`);
    return response.data.data;
  },

  // Get shop by ID
  getShopById: async (id: number): Promise<Shop> => {
    const response = await axios.get(`${API_URL}/shop/${id}`);
    return response.data.data;
  },

  // Create new shop
  createShop: async (shopData: CreateShopData): Promise<Shop> => {
    const response = await axios.post(`${API_URL}/create-shop`, shopData);
    return response.data.data;
  },

  // Update shop
  updateShop: async (id: number, shopData: Partial<CreateShopData>): Promise<Shop> => {
    const response = await axios.put(`${API_URL}/shop/${id}`, shopData);
    return response.data.data;
  },

  // Get shop collections
  getShopCollections: async (id: number) => {
    const response = await axios.get(`${API_URL}/shop/${id}/collections`);
    return response.data;
  }
}