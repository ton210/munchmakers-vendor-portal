import api from './api';

export const trackingService = {
  // Add tracking number to order
  async addTracking(data: {
    order_id: number;
    vendor_assignment_id: number;
    tracking_number: string;
    carrier: string;
    notes?: string;
  }) {
    const response = await api.post('/tracking', data);
    return response.data;
  },

  // Update tracking status
  async updateTrackingStatus(id: number, status: string, notes?: string) {
    const response = await api.put(`/tracking/${id}/status`, { status, notes });
    return response.data;
  },

  // Get tracking information for order
  async getOrderTracking(orderId: number) {
    const response = await api.get(`/tracking/order/${orderId}`);
    return response.data;
  },

  // Get supported carriers
  async getSupportedCarriers() {
    const response = await api.get('/tracking/carriers');
    return response.data;
  },

  // Sync all tracking numbers (admin only)
  async syncAllTracking() {
    const response = await api.post('/tracking/sync-all');
    return response.data;
  }
};