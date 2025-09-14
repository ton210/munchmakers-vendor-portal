import api from './api';

export const storeService = {
  // Get all stores
  async getStores(params?: {
    type?: string;
    is_active?: boolean;
  }) {
    const response = await api.get('/stores', { params });
    return response.data;
  },

  // Get single store with statistics
  async getStore(id: number) {
    const response = await api.get(`/stores/${id}`);
    return response.data;
  },

  // Create new store
  async createStore(data: {
    name: string;
    type: 'shopify' | 'bigcommerce' | 'woocommerce';
    store_url: string;
    api_credentials: any;
    is_active?: boolean;
    sync_enabled?: boolean;
  }) {
    const response = await api.post('/stores', data);
    return response.data;
  },

  // Update store
  async updateStore(id: number, data: any) {
    const response = await api.put(`/stores/${id}`, data);
    return response.data;
  },

  // Delete store
  async deleteStore(id: number) {
    const response = await api.delete(`/stores/${id}`);
    return response.data;
  },

  // Test store connection
  async testConnection(id: number) {
    const response = await api.post(`/stores/${id}/test-connection`);
    return response.data;
  },

  // Sync orders from store
  async syncStore(id: number) {
    const response = await api.post(`/stores/${id}/sync`);
    return response.data;
  }
};