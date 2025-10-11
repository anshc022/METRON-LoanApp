import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'https://api-loan-muv1.onrender.com';
const REQUEST_TIMEOUT_MS = 10000; // default request timeout (10s)
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

  constructor() {
    // Apply a sane default timeout for all axios requests so the app doesn't hang
    axios.defaults.timeout = REQUEST_TIMEOUT_MS;
    axios.defaults.headers.common['Content-Type'] = 'application/json';
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('Attempting login to:', API_BASE_URL);
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, credentials, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
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
      let errorMessage = 'Network error occurred';
      
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Server not found. Please try again later.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      return { 
        success: false, 
        error: errorMessage
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
      const response = await axios.get(`${API_BASE_URL}/api/auth/verify`, {
        timeout: 8000, // be stricter on verification so we don't block startup
      });
      return !!response.data?.success;
    } catch (error: any) {
      // If it's an auth error, clear token; otherwise, don't block startup
      const status = error?.response?.status;
      const isTimeout = error?.code === 'ECONNABORTED' || /timeout/i.test(String(error?.message));
      const isNetwork = /Network Error/i.test(String(error?.message));
      if (status === 401 || status === 403) {
        console.warn('Token invalid, logging out.');
        await this.logout();
        return false;
      }
      if (isTimeout || isNetwork) {
        console.warn('Token verification skipped due to network/timeout. Proceeding optimistically.');
        return true; // be optimistic on transient network issues
      }
      console.error('Token verification failed (other):', error);
      return false;
    }
  }

  private withTimeout<T>(promise: Promise<T>, ms: number, onTimeoutValue: T): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeout = new Promise<T>((resolve) => {
      timer = setTimeout(() => resolve(onTimeoutValue), ms);
    });
    return Promise.race([promise.finally(() => clearTimeout(timer)), timeout]);
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