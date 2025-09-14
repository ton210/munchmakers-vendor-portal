import api from './api';

export const orderService = {
  // Get orders with filtering and pagination
  async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    store_id?: string;
    vendor_id?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
  }) {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  // Get single order with details
  async getOrder(id: number) {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // Get order statistics
  async getOrderStats(params?: {
    date_from?: string;
    date_to?: string;
  }) {
    const response = await api.get('/orders/stats/overview', { params });
    return response.data;
  },

  // Update order status
  async updateOrderStatus(id: number, status: string, notes?: string) {
    const response = await api.put(`/orders/${id}/status`, { status, notes });
    return response.data;
  },

  // Update vendor assignment status
  async updateAssignmentStatus(assignmentId: number, status: string) {
    const response = await api.put(`/orders/assignments/${assignmentId}/status`, { status });
    return response.data;
  },

  // Get vendor's assigned orders
  async getVendorOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    date_from?: string;
    date_to?: string;
  }) {
    const response = await api.get('/orders/vendor/assignments', { params });
    return response.data;
  },

  // Admin functions
  async assignVendorToOrder(orderId: number, vendorId: number, assignmentType = 'full', items?: any[]) {
    const response = await api.post(`/orders/${orderId}/assign-vendor`, {
      vendor_id: vendorId,
      assignment_type: assignmentType,
      items
    });
    return response.data;
  },

  // Sync orders from store (admin only)
  async syncStoreOrders(storeId: number) {
    const response = await api.post('/orders/sync-store', { store_id: storeId });
    return response.data;
  }
};