const Order = require('../models/Order');
const Store = require('../models/Store');
const VendorAssignment = require('../models/VendorAssignment');
const Vendor = require('../models/Vendor');
const ActivityLogger = require('../services/activityLogger');

class OrderController {
  // Get orders with filtering and pagination
  static async getOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        status,
        store_id,
        vendor_id,
        search,
        date_from,
        date_to
      } = req.query;

      const offset = (page - 1) * limit;

      // Get user's vendor ID if they're a vendor
      let userVendorId = null;
      if (req.user.type === 'vendor') {
        const vendor = await Vendor.findByUserId(req.user.id);
        if (!vendor) {
          return res.status(404).json({
            success: false,
            message: 'Vendor profile not found'
          });
        }
        userVendorId = vendor.id;
      }

      const filters = {
        status,
        store_id,
        vendor_id,
        search,
        date_from,
        date_to,
        user_role: req.user.type,
        user_vendor_id: userVendorId
      };

      const pagination = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        sortBy: 'order_date',
        sortOrder: 'desc'
      };

      const [orders, totalCount] = await Promise.all([
        Order.getAll(filters, pagination),
        Order.getCount(filters)
      ]);

      res.json({
        success: true,
        data: {
          items: orders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            pages: Math.ceil(totalCount / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get orders',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get single order with details
  static async getOrder(req, res) {
    try {
      const { id } = req.params;
      const order = await Order.getWithDetails(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check permissions for vendors
      if (req.user.type === 'vendor') {
        const vendor = await Vendor.findByUserId(req.user.id);
        const hasAccess = order.vendor_assignments.some(
          assignment => assignment.vendor_id === vendor?.id
        );

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      res.json({
        success: true,
        data: { order }
      });

    } catch (error) {
      console.error('Get order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get order',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Assign vendor to order (admin only)
  static async assignVendor(req, res) {
    try {
      const { id } = req.params;
      const { vendor_id, assignment_type = 'full', items, notes } = req.body;

      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      const vendor = await Vendor.findById(vendor_id);
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      const assignment = await Order.assignVendor(
        id,
        vendor_id,
        req.user.id,
        assignment_type,
        items
      );

      // Log activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        'order_assign_vendor',
        'order',
        id,
        {
          vendor_id,
          vendor_name: vendor.company_name,
          assignment_type,
          commission_amount: assignment.commission_amount
        },
        req
      );

      res.json({
        success: true,
        message: 'Vendor assigned successfully',
        data: { assignment }
      });

    } catch (error) {
      console.error('Assign vendor error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to assign vendor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Update order status
  static async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check permissions for vendors
      if (req.user.type === 'vendor') {
        const vendor = await Vendor.findByUserId(req.user.id);
        const assignment = await db('vendor_assignments')
          .where({ order_id: id, vendor_id: vendor?.id })
          .first();

        if (!assignment) {
          return res.status(403).json({
            success: false,
            message: 'You can only update orders assigned to you'
          });
        }
      }

      const updatedOrder = await Order.updateStatus(id, status, req.user.id, notes);

      // Log activity
      const actionType = req.user.type === 'vendor' ? 'vendor_update_order_status' : 'admin_update_order_status';
      await ActivityLogger.log({
        user_id: req.user.id,
        user_type: req.user.type,
        action: actionType,
        entity_type: 'order',
        entity_id: id,
        metadata: {
          old_status: order.order_status,
          new_status: status,
          notes
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: { order: updatedOrder }
      });

    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update order status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Update vendor assignment status
  static async updateAssignmentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const assignment = await VendorAssignment.findById(id);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      // Check permissions for vendors
      if (req.user.type === 'vendor') {
        const vendor = await Vendor.findByUserId(req.user.id);
        if (assignment.vendor_id !== vendor?.id) {
          return res.status(403).json({
            success: false,
            message: 'You can only update your own assignments'
          });
        }
      }

      const updatedAssignment = await VendorAssignment.updateStatus(id, status, req.user.id);

      // Log activity
      await ActivityLogger.log({
        user_id: req.user.id,
        user_type: req.user.type,
        action: 'vendor_assignment_status_update',
        entity_type: 'vendor_assignment',
        entity_id: id,
        metadata: {
          old_status: assignment.status,
          new_status: status,
          order_id: assignment.order_id
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Assignment status updated successfully',
        data: { assignment: updatedAssignment }
      });

    } catch (error) {
      console.error('Update assignment status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update assignment status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get order statistics
  static async getOrderStats(req, res) {
    try {
      const { date_from, date_to } = req.query;

      // Get user's vendor ID if they're a vendor
      let userVendorId = null;
      if (req.user.type === 'vendor') {
        const vendor = await Vendor.findByUserId(req.user.id);
        userVendorId = vendor?.id;
      }

      const filters = {
        user_role: req.user.type,
        user_vendor_id: userVendorId,
        date_from,
        date_to
      };

      const stats = await Order.getStats(filters);

      res.json({
        success: true,
        data: { stats }
      });

    } catch (error) {
      console.error('Get order stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get order statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Sync orders from store (admin only)
  static async syncStoreOrders(req, res) {
    try {
      const { store_id } = req.body;

      if (!store_id) {
        return res.status(400).json({
          success: false,
          message: 'Store ID is required'
        });
      }

      const result = await Order.syncFromStore(store_id);

      // Log activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        'store_orders_sync',
        'store',
        store_id,
        {
          synced_count: result.syncedCount,
          total_orders: result.totalOrders
        },
        req
      );

      res.json({
        success: true,
        message: `Synced ${result.syncedCount} new orders from store`,
        data: result
      });

    } catch (error) {
      console.error('Sync store orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync orders',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get vendor's orders and assignments
  static async getVendorOrders(req, res) {
    try {
      const vendor = await Vendor.findByUserId(req.user.id);
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor profile not found'
        });
      }

      const {
        page = 1,
        limit = 20,
        status,
        date_from,
        date_to
      } = req.query;

      const filters = { status, date_from, date_to };
      const assignments = await VendorAssignment.findByVendorId(vendor.id, filters);

      // Apply pagination
      const offset = (page - 1) * limit;
      const paginatedAssignments = assignments.slice(offset, offset + parseInt(limit));

      res.json({
        success: true,
        data: {
          items: paginatedAssignments,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: assignments.length,
            pages: Math.ceil(assignments.length / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get vendor orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get vendor orders',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = OrderController;