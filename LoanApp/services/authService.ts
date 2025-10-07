import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.31.36:5000';
const TOKEN_KEY = 'authToken';
const USER_KEY = 'userData';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'agent';
  location?: string;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, credentials);
      
      if (response.data.success) {
        this.token = response.data.token;
        this.user = response.data.data; // API returns user data in 'data' field
        
        // Store in AsyncStorage
        if (this.token && this.user) {
          await AsyncStorage.setItem(TOKEN_KEY, this.token);
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(this.user));
          await AsyncStorage.setItem('userRole', this.user.role);
          
          // Set default authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
          
          console.log('Auth Service - Token stored:', this.token ? 'Yes' : 'No');
          console.log('Auth Service - User stored:', this.user ? this.user.name : 'No');
          console.log('Auth Service - User role stored:', this.user.role);
          
          return { success: true, user: this.user };
        } else {
          return { success: false, error: 'Invalid response from server' };
        }
      } else {
        return { success: false, error: response.data.message || 'Login failed' };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Network error occurred' 
      };
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.token) {
        // Call logout API if needed
        await axios.post(`${API_BASE_URL}/api/auth/logout`);
      }
    } catch (error) {
      console.error('Logout API error:', error);
    }
    
    // Clear local storage
    this.token = null;
    this.user = null;
    
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    
    // Remove authorization header
    delete axios.defaults.headers.common['Authorization'];
  }

  async loadStoredAuth(): Promise<boolean> {
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(USER_KEY);
      
      if (storedToken && storedUser) {
        this.token = storedToken;
        this.user = JSON.parse(storedUser);
        
        // Set authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        
        // Verify token is still valid
        return await this.verifyToken();
      }
      
      return false;
    } catch (error) {
      console.error('Error loading stored auth:', error);
      return false;
    }
  }

  async verifyToken(): Promise<boolean> {
    try {
      if (!this.token) return false;
      
      const response = await axios.get(`${API_BASE_URL}/api/auth/verify`);
      return response.data.success;
    } catch (error) {
      console.error('Token verification failed:', error);
      await this.logout(); // Clear invalid token
      return false;
    }
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  getUser(): User | null {
    return this.user;
  }

  getUserRole(): 'admin' | 'agent' | null {
    return this.user?.role || null;
  }

  getToken(): string | null {
    return this.token;
  }
}

export const authService = new AuthService();