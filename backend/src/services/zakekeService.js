const axios = require('axios');

class ZakekeService {
  constructor() {
    this.clientId = process.env.ZAKEKE_CLIENT_ID;
    this.clientSecret = process.env.ZAKEKE_CLIENT_SECRET;
    this.apiUrl = 'https://api.zakeke.com';
  }

  async getAccessToken() {
    try {
      const response = await axios.post(`${this.apiUrl}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret
      });

      return response.data.access_token;
    } catch (error) {
      console.error('Zakeke auth error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Zakeke API');
    }
  }

  async createOrder(orderData) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.post(`${this.apiUrl}/v1/orders`, orderData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Zakeke create order error:', error.response?.data || error.message);
      throw new Error('Failed to create Zakeke order');
    }
  }

  async getOrder(zakekeOrderId) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(`${this.apiUrl}/v1/orders/${zakekeOrderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Zakeke get order error:', error.response?.data || error.message);
      throw new Error('Failed to get Zakeke order');
    }
  }

  async syncOrderStatus(orderId) {
    try {
      const db = require('../config/database');

      // Get Zakeke order record
      const zakekeOrder = await db('zakeke_orders')
        .where('order_id', orderId)
        .first();

      if (!zakekeOrder || !zakekeOrder.zakeke_order_id) {
        return { success: false, message: 'No Zakeke order found' };
      }

      // Get status from Zakeke API
      const zakekeData = await this.getOrder(zakekeOrder.zakeke_order_id);

      // Update local record
      await db('zakeke_orders')
        .where('id', zakekeOrder.id)
        .update({
          customization_data: zakekeData.customization,
          design_files: zakekeData.design_files,
          artwork_status: zakekeData.status,
          synced_at: new Date(),
          updated_at: new Date()
        });

      return {
        success: true,
        data: zakekeData,
        message: 'Zakeke order synced successfully'
      };

    } catch (error) {
      console.error('Zakeke sync error:', error.message);
      return {
        success: false,
        message: `Failed to sync Zakeke order: ${error.message}`
      };
    }
  }

  async downloadDesignFiles(zakekeOrderId) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(`${this.apiUrl}/v1/orders/${zakekeOrderId}/files`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Zakeke download files error:', error.response?.data || error.message);
      throw new Error('Failed to download design files');
    }
  }
}

module.exports = ZakekeService;