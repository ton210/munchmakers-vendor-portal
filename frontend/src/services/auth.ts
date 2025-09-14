import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  businessName: string;
  contactEmail: string;
  contactName: string;
  phone: string;
  businessAddress: string;
  businessType: string;
  website?: string;
  taxId: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'vendor';
  vendorId?: number;
  vendor?: {
    id: number;
    businessName: string;
    status: string;
  };
}

export const authService = {
  // Vendor authentication
  async loginVendor(credentials: LoginCredentials) {
    const response = await api.post('/auth/vendor/login', credentials);
    if (response.data.success) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userRole', 'vendor');
      localStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async registerVendor(data: RegisterData) {
    const response = await api.post('/auth/vendor/register', data);
    return response.data;
  },

  // Admin authentication
  async loginAdmin(credentials: LoginCredentials) {
    const response = await api.post('/auth/admin/login', credentials);
    if (response.data.success) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Password reset
  async requestPasswordReset(email: string) {
    const response = await api.post('/auth/password/reset', { email });
    return response.data;
  },

  async resetPassword(token: string, password: string) {
    const response = await api.post('/auth/password/update', { token, password });
    return response.data;
  },

  // Logout
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
  },

  // Get current user
  getCurrentUser(): User | null {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  },

  // Get user role
  getUserRole(): string | null {
    return localStorage.getItem('userRole');
  },

  // Check if user is admin
  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  },

  // Check if user is vendor
  isVendor(): boolean {
    return this.getUserRole() === 'vendor';
  }
};