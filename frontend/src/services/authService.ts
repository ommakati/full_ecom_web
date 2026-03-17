import api from './api';

export interface User {
  id: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

export const authService = {
  // Register new user
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Logout user
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  // Get current user profile
  getProfile: async (): Promise<AuthResponse> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};