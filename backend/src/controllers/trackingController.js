const TrackingService = require('../services/trackingService');
const Order = require('../models/Order');
const VendorAssignment = require('../models/VendorAssignment');
const Vendor = require('../models/Vendor');
const ActivityLogger = require('../services/activityLogger');
const db = require('../config/database');

class TrackingController {
  // Add tracking number to order
  static async addTracking(req, res) {
    try {
      const { order_id, vendor_assignment_id, tracking_number, carrier, notes } = req.body;

      // Verify permissions
      if (req.user.type === 'vendor') {
        const vendor = await Vendor.findByUserId(req.user.id);
        const assignment = await VendorAssignment.findById(vendor_assignment_id);

        if (!assignment || assignment.vendor_id !== vendor?.id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this assignment'
          });
        }
      }

      const trackingService = new TrackingService();
      const result = await trackingService.addTrackingNumber(
        order_id,
        tracking_number,
        carrier,
        vendor_assignment_id
      );

      // Log activity
      await ActivityLogger.log({
        user_id: req.user.id,
        user_type: req.user.type,
        action: 'tracking_added',
        entity_type: 'order',
        entity_id: order_id,
        metadata: {
          tracking_number,
          carrier,
          vendor_assignment_id
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.status(201).json({
        success: true,
        message: 'Tracking number added successfully',
        data: result.data,
        warning: result.warning
      });

    } catch (error) {
      console.error('Add tracking error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to add tracking number',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Update tracking status
  static async updateTrackingStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const tracking = await db('order_tracking').where({ id }).first();
      if (!tracking) {
        return res.status(404).json({
          success: false,
          message: 'Tracking record not found'
        });
      }

      // Check permissions
      if (req.user.type === 'vendor') {
        const vendor = await Vendor.findByUserId(req.user.id);
        const assignment = await VendorAssignment.findById(tracking.vendor_assignment_id);

        if (!assignment || assignment.vendor_id !== vendor?.id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      const trackingService = new TrackingService();
      const result = await trackingService.updateTrackingStatus(id, status, notes);

      // Log activity
      await ActivityLogger.log({
        user_id: req.user.id,
        user_type: req.user.type,
        action: 'tracking_updated',
        entity_type: 'order_tracking',
        entity_id: id,
        metadata: {
          old_status: tracking.status,
          new_status: status,
          order_id: tracking.order_id
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Tracking status updated successfully',
        data: result.data
      });

    } catch (error) {
      console.error('Update tracking status error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update tracking status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get tracking information for order
  static async getOrderTracking(req, res) {
    try {
      const { order_id } = req.params;

      // Check permissions
      if (req.user.type === 'vendor') {
        const vendor = await Vendor.findByUserId(req.user.id);
        const hasAccess = await db('vendor_assignments')
          .where({ order_id, vendor_id: vendor?.id })
          .first();

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      const trackingService = new TrackingService();
      const result = await trackingService.getTrackingInfo(order_id);

      res.json({
        success: true,
        data: result.data
      });

    } catch (error) {
      console.error('Get order tracking error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get tracking information',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Sync all tracking numbers (admin only)
  static async syncAllTracking(req, res) {
    try {
      const trackingService = new TrackingService();
      const result = await trackingService.syncAllTracking();

      // Log activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        'tracking_sync_all',
        'system',
        null,
        {
          synced_count: result.data.syncedCount,
          delivered_count: result.data.deliveredCount
        },
        req
      );

      res.json({
        success: true,
        message: result.message,
        data: result.data
      });

    } catch (error) {
      console.error('Sync all tracking error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to sync tracking',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get supported carriers
  static async getSupportedCarriers(req, res) {
    try {
      const trackingService = new TrackingService();
      const carriers = trackingService.getSupportedCarriers();

      res.json({
        success: true,
        data: { carriers }
      });

    } catch (error) {
      console.error('Get carriers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get supported carriers',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = TrackingController;