import axios from 'axios';
import { AuthResponse, LoginFormValues, SignupFormValues } from '../types/auth';

const API_URL = 'http://localhost:5000/api/auth';

// Configure axios defaults
axios.defaults.headers.common['X-API-KEY'] = import.meta.env.VITE_API_KEY || 'default-key';

export const authService = {
  login: async (values: LoginFormValues): Promise<AuthResponse> => {
    const response = await axios.post(`${API_URL}/login`, values);
    const { token, data } = response.data;
    if (token && data) {
      // Set token and user data in localStorage first
      localStorage.setItem('token', token);
      localStorage.setItem('userData', JSON.stringify(data));
      // Then update axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    return response.data;
  },

  signup: async (values: SignupFormValues): Promise<AuthResponse> => {
    const response = await axios.post(`${API_URL}/signup`, values);
    return response.data;
  },

  setToken: (token: string) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  setUserData: (data: any) => {
    localStorage.setItem('userData', JSON.stringify(data));
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  getUserData: () => {
    const data = localStorage.getItem('userData');
    return data ? JSON.parse(data) : null;
  },

  getUserRole: () => {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData).role : null;
  },

  removeToken: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    delete axios.defaults.headers.common['Authorization'];
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    if (token && userData) {
      // Set the Authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return true;
    }
    return false;
  },

  // Initialize auth state from localStorage
  initializeAuth: async () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        // Verify token by making a test request
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        await axios.get(`${API_URL}/verify`);
        return true;
      } catch (error) {
        // If token is invalid, clear auth state
        authService.removeToken();
        return false;
      }
    }
    return false;
  }
};