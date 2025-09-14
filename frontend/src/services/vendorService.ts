import api from './api';
import { Product, ProductCategory, Vendor } from '../types';

export const vendorService = {
  // Dashboard
  async getDashboardStats() {
    const response = await api.get('/vendors/dashboard/stats');
    return response.data;
  },

  // Products
  async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    categoryId?: number;
  }) {
    const response = await api.get('/products', { params });
    return response.data;
  },

  async getProduct(id: number) {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  async createProduct(data: any) {
    const response = await api.post('/products', data);
    return response.data;
  },

  async submitProductForReview(id: number) {
    const response = await api.post(`/products/${id}/submit`);
    return response.data;
  },

  async updateProduct(id: number, data: Partial<Product>) {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  async deleteProduct(id: number) {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  async uploadProductImage(productId: number, file: File) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('productId', productId.toString());
    
    const response = await api.post('/products/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteProductImage(imageId: number) {
    const response = await api.delete(`/products/images/${imageId}`);
    return response.data;
  },

  // Categories
  async getCategories() {
    const response = await api.get('/categories');
    return response.data;
  },

  // Orders
  async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const response = await api.get('/vendors/orders', { params });
    return response.data;
  },

  async getOrder(id: number) {
    const response = await api.get(`/vendors/orders/${id}`);
    return response.data;
  },

  async updateOrderStatus(id: number, status: string, trackingNumber?: string) {
    const response = await api.put(`/vendors/orders/${id}/status`, { 
      status, 
      trackingNumber 
    });
    return response.data;
  },

  // Vendor profile
  async getProfile() {
    const response = await api.get('/vendors/profile');
    return response.data;
  },

  async updateProfile(data: Partial<Vendor>) {
    const response = await api.put('/vendors/profile', data);
    return response.data;
  },

  // BigCommerce sync
  async syncWithBigCommerce() {
    const response = await api.post('/vendors/sync/bigcommerce');
    return response.data;
  },

  async getBigCommerceStatus() {
    const response = await api.get('/vendors/bigcommerce/status');
    return response.data;
  }
};