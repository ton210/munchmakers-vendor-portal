import api from './api';
import { Vendor, Product, ProductCategory } from '../types';

export const adminService = {
  // Dashboard
  async getDashboardStats() {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  // Vendors
  async getVendors(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const response = await api.get('/admin/vendors', { params });
    return response.data;
  },

  async getVendor(id: number) {
    const response = await api.get(`/admin/vendors/${id}`);
    return response.data;
  },

  async approveVendor(id: number, bigcommerceStoreHash?: string, bigcommerceAccessToken?: string) {
    const response = await api.post(`/admin/vendors/${id}/approve`, {
      bigcommerceStoreHash,
      bigcommerceAccessToken
    });
    return response.data;
  },

  async rejectVendor(id: number, reason: string) {
    const response = await api.post(`/admin/vendors/${id}/reject`, { reason });
    return response.data;
  },

  async updateVendor(id: number, data: Partial<Vendor>) {
    const response = await api.put(`/admin/vendors/${id}`, data);
    return response.data;
  },

  async deleteVendor(id: number) {
    const response = await api.delete(`/admin/vendors/${id}`);
    return response.data;
  },

  // Get active vendors for order assignment
  async getActiveVendors() {
    const response = await api.get('/admin/vendors/active');
    return response.data;
  },

  // Update vendor commission rate
  async updateVendorCommission(id: number, commissionRate: number) {
    const response = await api.put(`/admin/vendors/${id}/commission`, { commission_rate: commissionRate });
    return response.data;
  },

  // Products
  async getAllProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    vendorId?: number;
    categoryId?: number;
  }) {
    const response = await api.get('/admin/products', { params });
    return response.data;
  },

  async getProduct(id: number) {
    const response = await api.get(`/admin/products/${id}`);
    return response.data;
  },

  async approveProduct(id: number, bigcommerceCategoryId?: number) {
    const response = await api.post(`/admin/products/${id}/approve`, {
      bigcommerceCategoryId
    });
    return response.data;
  },

  async rejectProduct(id: number, reason: string) {
    const response = await api.post(`/admin/products/${id}/reject`, { reason });
    return response.data;
  },

  async updateProduct(id: number, data: Partial<Product>) {
    const response = await api.put(`/admin/products/${id}`, data);
    return response.data;
  },

  async deleteProduct(id: number) {
    const response = await api.delete(`/admin/products/${id}`);
    return response.data;
  },

  async bulkApproveProducts(productIds: number[]) {
    const response = await api.post('/admin/products/bulk-approve', { productIds });
    return response.data;
  },

  async bulkRejectProducts(productIds: number[], reason: string) {
    const response = await api.post('/admin/products/bulk-reject', { productIds, reason });
    return response.data;
  },

  // Categories
  async getCategories() {
    const response = await api.get('/admin/categories');
    return response.data;
  },

  async createCategory(data: Partial<ProductCategory>) {
    const response = await api.post('/admin/categories', data);
    return response.data;
  },

  async updateCategory(id: number, data: Partial<ProductCategory>) {
    const response = await api.put(`/admin/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id: number) {
    const response = await api.delete(`/admin/categories/${id}`);
    return response.data;
  },

  async syncCategoriesWithBigCommerce() {
    const response = await api.post('/admin/categories/sync-bigcommerce');
    return response.data;
  },

  async resetCategories() {
    const response = await api.post('/admin/categories/reset');
    return response.data;
  },

  // Analytics
  async getAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    vendorId?: number;
  }) {
    const response = await api.get('/admin/analytics', { params });
    return response.data;
  },

  async getVendorAnalytics(vendorId: number, params?: {
    startDate?: string;
    endDate?: string;
  }) {
    const response = await api.get(`/admin/vendors/${vendorId}/analytics`, { params });
    return response.data;
  },

  // System
  async getSystemHealth() {
    const response = await api.get('/admin/system/health');
    return response.data;
  },

  async getActivityLogs(params?: {
    page?: number;
    limit?: number;
    type?: string;
    userId?: number;
    vendorId?: number;
  }) {
    const response = await api.get('/admin/activity-logs', { params });
    return response.data;
  },

  // Settings
  async getSettings() {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  async updateSettings(data: any) {
    const response = await api.put('/admin/settings', data);
    return response.data;
  },

  // BigCommerce Integration
  async syncAllWithBigCommerce() {
    const response = await api.post('/admin/bigcommerce/sync-all');
    return response.data;
  },

  async getBigCommerceStatus() {
    const response = await api.get('/admin/bigcommerce/status');
    return response.data;
  },

  async testBigCommerceConnection(storeHash: string, accessToken: string) {
    const response = await api.post('/admin/bigcommerce/test-connection', {
      storeHash,
      accessToken
    });
    return response.data;
  }
};