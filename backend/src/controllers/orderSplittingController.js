const Order = require('../models/Order');
const VendorAssignment = require('../models/VendorAssignment');
const Vendor = require('../models/Vendor');
const ActivityLogger = require('../services/activityLogger');
const db = require('../config/database');

class OrderSplittingController {
  // Create partial vendor assignment
  static async createPartialAssignment(req, res) {
    try {
      const { order_id, vendor_id, items, notes } = req.body;

      // Verify order exists
      const order = await Order.findById(order_id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Verify vendor exists
      const vendor = await Vendor.findById(vendor_id);
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      // Validate items
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Items array is required for partial assignment'
        });
      }

      // Calculate total assignment amount
      let totalAssignmentAmount = 0;
      const validatedItems = [];

      for (const item of items) {
        const orderItem = await db('order_items')
          .where({ id: item.order_item_id, order_id })
          .first();

        if (!orderItem) {
          return res.status(400).json({
            success: false,
            message: `Order item ${item.order_item_id} not found in this order`
          });
        }

        // Check if quantity is valid
        if (item.quantity > orderItem.quantity) {
          return res.status(400).json({
            success: false,
            message: `Quantity ${item.quantity} exceeds available quantity ${orderItem.quantity} for item ${orderItem.product_name}`
          });
        }

        const itemAmount = (orderItem.unit_price * item.quantity);
        totalAssignmentAmount += itemAmount;

        validatedItems.push({
          order_item_id: item.order_item_id,
          quantity: item.quantity,
          assigned_amount: itemAmount,
          product_name: orderItem.product_name,
          sku: orderItem.sku
        });
      }

      // Calculate commission
      const commissionAmount = totalAssignmentAmount * (vendor.commission_rate / 100);

      // Create vendor assignment
      const assignmentData = {
        order_id,
        vendor_id,
        assigned_by: req.user.id,
        assignment_type: 'partial',
        items: JSON.stringify(validatedItems),
        commission_amount: commissionAmount,
        notes
      };

      const assignment = await VendorAssignment.create(assignmentData);

      // Create individual item assignments
      for (const item of validatedItems) {
        await db('order_item_assignments').insert({
          vendor_assignment_id: assignment.id,
          order_item_id: item.order_item_id,
          quantity: item.quantity,
          assigned_amount: item.assigned_amount
        });
      }

      // Log activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        'order_partial_assignment',
        'order',
        order_id,
        {
          vendor_id,
          vendor_name: vendor.company_name,
          items_count: validatedItems.length,
          total_amount: totalAssignmentAmount,
          commission_amount: commissionAmount
        },
        req
      );

      res.status(201).json({
        success: true,
        message: 'Partial assignment created successfully',
        data: {
          assignment,
          items: validatedItems,
          total_amount: totalAssignmentAmount
        }
      });

    } catch (error) {
      console.error('Create partial assignment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create partial assignment',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get order splitting details
  static async getOrderSplitting(req, res) {
    try {
      const { order_id } = req.params;

      // Get order with all assignments and items
      const order = await Order.getWithDetails(order_id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Get detailed item assignments
      const itemAssignments = await db('order_item_assignments')
        .select(
          'order_item_assignments.*',
          'order_items.product_name',
          'order_items.sku',
          'order_items.quantity as total_quantity',
          'order_items.unit_price',
          'vendors.company_name as vendor_name',
          'vendor_assignments.status as assignment_status'
        )
        .leftJoin('order_items', 'order_item_assignments.order_item_id', 'order_items.id')
        .leftJoin('vendor_assignments', 'order_item_assignments.vendor_assignment_id', 'vendor_assignments.id')
        .leftJoin('vendors', 'vendor_assignments.vendor_id', 'vendors.id')
        .where('order_items.order_id', order_id);

      // Calculate assignment summary
      const assignmentSummary = order.items.map(item => {
        const assignments = itemAssignments.filter(ia => ia.order_item_id === item.id);
        const assignedQuantity = assignments.reduce((sum, ia) => sum + ia.quantity, 0);
        const remainingQuantity = item.quantity - assignedQuantity;

        return {
          ...item,
          assigned_quantity: assignedQuantity,
          remaining_quantity: remainingQuantity,
          assignments: assignments,
          is_fully_assigned: remainingQuantity === 0
        };
      });

      res.json({
        success: true,
        data: {
          order,
          assignment_summary: assignmentSummary,
          vendor_assignments: order.vendor_assignments
        }
      });

    } catch (error) {
      console.error('Get order splitting error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get order splitting details',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Remove item assignment
  static async removeItemAssignment(req, res) {
    try {
      const { id } = req.params;

      const itemAssignment = await db('order_item_assignments')
        .where({ id })
        .first();

      if (!itemAssignment) {
        return res.status(404).json({
          success: false,
          message: 'Item assignment not found'
        });
      }

      // Get vendor assignment details
      const vendorAssignment = await VendorAssignment.findById(itemAssignment.vendor_assignment_id);

      // Remove the item assignment
      await db('order_item_assignments').where({ id }).delete();

      // Recalculate vendor assignment if other items exist
      const remainingItems = await db('order_item_assignments')
        .where('vendor_assignment_id', itemAssignment.vendor_assignment_id);

      if (remainingItems.length === 0) {
        // No items left, remove entire vendor assignment
        await VendorAssignment.delete(itemAssignment.vendor_assignment_id);
      } else {
        // Recalculate commission based on remaining items
        const newTotalAmount = remainingItems.reduce((sum, item) => sum + parseFloat(item.assigned_amount), 0);
        const newCommissionAmount = newTotalAmount * (vendorAssignment.commission_rate / 100);

        await VendorAssignment.update(itemAssignment.vendor_assignment_id, {
          commission_amount: newCommissionAmount
        });
      }

      // Log activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        'order_item_assignment_removed',
        'order_item_assignment',
        id,
        {
          vendor_assignment_id: itemAssignment.vendor_assignment_id,
          order_item_id: itemAssignment.order_item_id,
          quantity: itemAssignment.quantity
        },
        req
      );

      res.json({
        success: true,
        message: 'Item assignment removed successfully'
      });

    } catch (error) {
      console.error('Remove item assignment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove item assignment',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get splitting analytics
  static async getSplittingAnalytics(req, res) {
    try {
      const { date_from, date_to } = req.query;

      let query = db('order_item_assignments')
        .leftJoin('vendor_assignments', 'order_item_assignments.vendor_assignment_id', 'vendor_assignments.id')
        .leftJoin('orders', 'vendor_assignments.order_id', 'orders.id');

      if (date_from) {
        query = query.where('orders.order_date', '>=', date_from);
      }

      if (date_to) {
        query = query.where('orders.order_date', '<=', date_to);
      }

      const stats = await query
        .select(
          db.raw('COUNT(DISTINCT vendor_assignments.order_id) as split_orders'),
          db.raw('COUNT(DISTINCT vendor_assignments.vendor_id) as vendors_involved'),
          db.raw('SUM(order_item_assignments.assigned_amount) as total_split_amount'),
          db.raw('AVG(order_item_assignments.quantity) as avg_split_quantity')
        )
        .first();

      // Get vendor distribution
      const vendorDistribution = await db('order_item_assignments')
        .select(
          'vendors.company_name',
          db.raw('COUNT(*) as assignments_count'),
          db.raw('SUM(order_item_assignments.assigned_amount) as total_amount')
        )
        .leftJoin('vendor_assignments', 'order_item_assignments.vendor_assignment_id', 'vendor_assignments.id')
        .leftJoin('vendors', 'vendor_assignments.vendor_id', 'vendors.id')
        .groupBy('vendors.id', 'vendors.company_name')
        .orderBy('assignments_count', 'desc');

      res.json({
        success: true,
        data: {
          stats: {
            split_orders: parseInt(stats.split_orders),
            vendors_involved: parseInt(stats.vendors_involved),
            total_split_amount: parseFloat(stats.total_split_amount) || 0,
            avg_split_quantity: parseFloat(stats.avg_split_quantity) || 0
          },
          vendor_distribution: vendorDistribution
        }
      });

    } catch (error) {
      console.error('Get splitting analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get splitting analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = OrderSplittingController;