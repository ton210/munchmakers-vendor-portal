import api from './api';

export const orderMonitoringService = {
  // Get vendor-specific alerts
  async getVendorAlerts(vendorId: number) {
    const response = await api.get(`/order-monitoring/vendor/${vendorId}/alerts`);
    return response.data;
  },

  // Get admin alerts (system-wide)
  async getAdminAlerts() {
    const response = await api.get('/order-monitoring/admin/alerts');
    return response.data;
  },

  // Mark alert as read
  async markAlertAsRead(alertId: number) {
    const response = await api.put(`/order-monitoring/alerts/${alertId}/read`);
    return response.data;
  },

  // Run manual order monitoring check (admin only)
  async runOrderCheck() {
    const response = await api.post('/order-monitoring/check');
    return response.data;
  },

  // Get monitoring statistics
  async getMonitoringStats() {
    const response = await api.get('/order-monitoring/stats');
    return response.data;
  },

  // Update monitoring thresholds (admin only)
  async updateThresholds(thresholds: {
    unassignedOrderHours?: number;
    assignedButNotAcceptedHours?: number;
    acceptedButNotStartedHours?: number;
    inProgressTooLongDays?: number;
    noTrackingAfterDays?: number;
    staleTrackingDays?: number;
  }) {
    const response = await api.put('/order-monitoring/thresholds', { thresholds });
    return response.data;
  }
};