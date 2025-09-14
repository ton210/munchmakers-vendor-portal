import api from './api';

export interface LoginFormData {
  email: string;
  password: string;
  userType: 'admin' | 'vendor';
}

export interface RegisterVendorData {
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

export const authService = {
  async vendorLogin(credentials: Omit<LoginFormData, 'userType'>) {
    const response = await api.post('/auth/vendor/login', credentials);
    return response.data;
  },

  async adminLogin(credentials: Omit<LoginFormData, 'userType'>) {
    const response = await api.post('/auth/admin/login', credentials);
    return response.data;
  },

  async vendorRegister(data: RegisterVendorData) {
    const response = await api.post('/auth/vendor/register', data);
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  async requestPasswordReset(email: string) {
    const response = await api.post('/auth/password/reset', { email });
    return response.data;
  },

  async resetPassword(token: string, password: string) {
    const response = await api.post('/auth/password/update', { token, password });
    return response.data;
  },
};