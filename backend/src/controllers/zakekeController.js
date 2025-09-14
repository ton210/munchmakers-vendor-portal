const ZakekeService = require('../services/zakekeService');
const Order = require('../models/Order');
const ActivityLogger = require('../services/activityLogger');
const db = require('../config/database');

class ZakekeController {
  // Create Zakeke order
  static async createZakekeOrder(req, res) {
    try {
      const { order_id, customization_data } = req.body;

      const order = await Order.findById(order_id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      const zakekeService = new ZakekeService();

      // Create order in Zakeke
      const zakekeOrderData = {
        external_order_id: order.external_order_id,
        customer_email: order.customer_email,
        customization: customization_data
      };

      const zakekeResponse = await zakekeService.createOrder(zakekeOrderData);

      // Save Zakeke order record
      const zakekeOrder = await db('zakeke_orders').insert({
        order_id,
        zakeke_order_id: zakekeResponse.id,
        customization_data: JSON.stringify(customization_data),
        artwork_status: zakekeResponse.status,
        synced_at: new Date()
      }).returning('*');

      // Log activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        'zakeke_order_created',
        'order',
        order_id,
        {
          zakeke_order_id: zakekeResponse.id,
          artwork_status: zakekeResponse.status
        },
        req
      );

      res.status(201).json({
        success: true,
        message: 'Zakeke order created successfully',
        data: {
          zakeke_order: zakekeOrder[0],
          zakeke_response: zakekeResponse
        }
      });

    } catch (error) {
      console.error('Create Zakeke order error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create Zakeke order',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Sync Zakeke order status
  static async syncZakekeOrder(req, res) {
    try {
      const { order_id } = req.params;

      const zakekeService = new ZakekeService();
      const result = await zakekeService.syncOrderStatus(order_id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      // Log activity
      await ActivityLogger.log({
        user_id: req.user.id,
        user_type: req.user.type,
        action: 'zakeke_order_synced',
        entity_type: 'order',
        entity_id: order_id,
        metadata: {
          artwork_status: result.data.status
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: result.message,
        data: result.data
      });

    } catch (error) {
      console.error('Sync Zakeke order error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to sync Zakeke order',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Download design files from Zakeke
  static async downloadDesignFiles(req, res) {
    try {
      const { order_id } = req.params;

      // Get Zakeke order
      const zakekeOrder = await db('zakeke_orders')
        .where('order_id', order_id)
        .first();

      if (!zakekeOrder) {
        return res.status(404).json({
          success: false,
          message: 'Zakeke order not found'
        });
      }

      const zakekeService = new ZakekeService();
      const designFiles = await zakekeService.downloadDesignFiles(zakekeOrder.zakeke_order_id);

      // Update design files in database
      await db('zakeke_orders')
        .where('id', zakekeOrder.id)
        .update({
          design_files: JSON.stringify(designFiles),
          updated_at: new Date()
        });

      res.json({
        success: true,
        message: 'Design files retrieved successfully',
        data: { design_files: designFiles }
      });

    } catch (error) {
      console.error('Download design files error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to download design files',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get Zakeke orders
  static async getZakekeOrders(req, res) {
    try {
      const { order_id, status } = req.query;

      let query = db('zakeke_orders')
        .select(
          'zakeke_orders.*',
          'orders.order_number',
          'orders.customer_name',
          'orders.customer_email'
        )
        .leftJoin('orders', 'zakeke_orders.order_id', 'orders.id');

      if (order_id) {
        query = query.where('zakeke_orders.order_id', order_id);
      }

      if (status) {
        query = query.where('zakeke_orders.artwork_status', status);
      }

      const zakekeOrders = await query.orderBy('zakeke_orders.created_at', 'desc');

      res.json({
        success: true,
        data: { zakeke_orders: zakekeOrders }
      });

    } catch (error) {
      console.error('Get Zakeke orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Zakeke orders',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Update Zakeke order status manually
  static async updateZakekeStatus(req, res) {
    try {
      const { id } = req.params;
      const { artwork_status, notes } = req.body;

      const [zakekeOrder] = await db('zakeke_orders')
        .where({ id })
        .update({
          artwork_status,
          updated_at: new Date()
        })
        .returning('*');

      if (!zakekeOrder) {
        return res.status(404).json({
          success: false,
          message: 'Zakeke order not found'
        });
      }

      // Log activity
      await ActivityLogger.log({
        user_id: req.user.id,
        user_type: req.user.type,
        action: 'zakeke_status_updated',
        entity_type: 'zakeke_order',
        entity_id: id,
        metadata: {
          artwork_status,
          notes,
          order_id: zakekeOrder.order_id
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Zakeke status updated successfully',
        data: { zakeke_order: zakekeOrder }
      });

    } catch (error) {
      console.error('Update Zakeke status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update Zakeke status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = ZakekeController;