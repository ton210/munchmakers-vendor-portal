import api from './api';

export const orderSplittingService = {
  // Create partial vendor assignment
  async createPartialAssignment(data: {
    order_id: number;
    vendor_id: number;
    items: Array<{
      order_item_id: number;
      quantity: number;
    }>;
    notes?: string;
  }) {
    const response = await api.post('/order-splitting/assign-partial', data);
    return response.data;
  },

  // Get order splitting details
  async getOrderSplitting(orderId: number) {
    const response = await api.get(`/order-splitting/order/${orderId}`);
    return response.data;
  },

  // Remove item assignment
  async removeItemAssignment(id: number) {
    const response = await api.delete(`/order-splitting/item-assignment/${id}`);
    return response.data;
  },

  // Get splitting analytics
  async getSplittingAnalytics(params?: {
    date_from?: string;
    date_to?: string;
  }) {
    const response = await api.get('/order-splitting/analytics', { params });
    return response.data;
  }
};