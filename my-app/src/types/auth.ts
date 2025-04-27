export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  data?: {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'agent';
    location?: string;
    created_at: string;
  };
}

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface SignupFormValues {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'agent';
  location?: string;
}