// Simple token-based API service
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Token storage
class TokenStorage {
  private static TOKEN_KEY = 'ecommerce_token';
  
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
  
  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }
  
  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
}

// API request helper
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = TokenStorage.getToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// Auth API
export const authAPI = {
  async login(email: string, password: string) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.token) {
      TokenStorage.setToken(data.token);
    }
    
    return data;
  },

  async register(email: string, password: string) {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.token) {
      TokenStorage.setToken(data.token);
    }
    
    return data;
  },

  async logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      TokenStorage.removeToken();
    }
  },

  async getCurrentUser() {
    return apiRequest('/auth/me');
  },

  isAuthenticated(): boolean {
    return !!TokenStorage.getToken();
  },
};

// Products API
export const productsAPI = {
  async getAll() {
    return apiRequest('/products');
  },

  async getById(id: string) {
    return apiRequest(`/products/${id}`);
  },

  async create(product: { name: string; description?: string; price: number; image_url?: string }) {
    return apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  async update(id: string, product: { name: string; description?: string; price: number; image_url?: string }) {
    return apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  },

  async delete(id: string) {
    return apiRequest(`/products/${id}`, {
      method: 'DELETE',
    });
  },
};

// Orders API
export const ordersAPI = {
  async getAll() {
    return apiRequest('/orders/admin/all');
  },

  async updateStatus(id: string, status: string) {
    return apiRequest(`/orders/admin/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// Health check
export const healthAPI = {
  async check() {
    return apiRequest('/health');
  },

  async test() {
    return apiRequest('/test');
  },
};

export default {
  auth: authAPI,
  products: productsAPI,
  orders: ordersAPI,
  health: healthAPI,
};