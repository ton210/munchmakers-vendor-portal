import api from './api';

export const productSyncService = {
  // Get synced products with filtering
  async getSyncedProducts(params?: {
    page?: number;
    limit?: number;
    store_id?: string;
    is_active?: string;
    search?: string;
    has_vendor?: string;
  }) {
    const response = await api.get('/product-sync/products', { params });
    return response.data;
  },

  // Get product sync statistics
  async getProductSyncStats(params?: {
    store_id?: string;
  }) {
    const response = await api.get('/product-sync/stats', { params });
    return response.data;
  },

  // Get unassigned products
  async getUnassignedProducts(storeId?: string) {
    const response = await api.get('/product-sync/unassigned', {
      params: { store_id: storeId }
    });
    return response.data;
  },

  // Get vendor assignments for product
  async getProductVendors(productId: number) {
    const response = await api.get(`/product-sync/products/${productId}/vendors`);
    return response.data;
  },

  // Sync products from store (admin only)
  async syncStoreProducts(storeId: number) {
    const response = await api.post('/product-sync/sync-products', {
      store_id: storeId
    });
    return response.data;
  },

  // Assign vendor to product (admin only)
  async assignVendorToProduct(data: {
    product_id: number;
    vendor_id: number;
    is_default?: boolean;
    commission_rate?: number;
  }) {
    const response = await api.post('/product-sync/assign-vendor', data);
    return response.data;
  },

  // Remove vendor assignment (admin only)
  async removeVendorAssignment(productId: number, vendorId: number) {
    const response = await api.delete('/product-sync/remove-assignment', {
      data: {
        product_id: productId,
        vendor_id: vendorId
      }
    });
    return response.data;
  },

  // Bulk assign vendor to products (admin only)
  async bulkAssignVendor(data: {
    product_ids: number[];
    vendor_id: number;
    is_default?: boolean;
    commission_rate?: number;
  }) {
    const response = await api.post('/product-sync/bulk-assign', data);
    return response.data;
  },

  // Get assignment settings
  async getAssignmentSettings() {
    const response = await api.get('/product-sync/settings');
    return response.data;
  },

  // Update assignment settings (admin only)
  async updateAssignmentSettings(settings: any) {
    const response = await api.put('/product-sync/settings', { settings });
    return response.data;
  }
};