const OrderMonitoringService = require('../services/orderMonitoringService');
const Vendor = require('../models/Vendor');
const ActivityLogger = require('../services/activityLogger');

class OrderMonitoringController {
  // Get vendor-specific alerts
  static async getVendorAlerts(req, res) {
    try {
      const { vendor_id } = req.params;

      // Check permissions
      if (req.user.type === 'vendor') {
        const vendor = await Vendor.findByUserId(req.user.id);
        if (!vendor || vendor.id !== parseInt(vendor_id)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      const monitoringService = new OrderMonitoringService();
      const alerts = await monitoringService.getVendorAlerts(parseInt(vendor_id));

      res.json({
        success: true,
        data: { alerts }
      });

    } catch (error) {
      console.error('Get vendor alerts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get vendor alerts',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get admin alerts (system-wide)
  static async getAdminAlerts(req, res) {
    try {
      const monitoringService = new OrderMonitoringService();
      const alerts = await monitoringService.getAdminAlerts();

      res.json({
        success: true,
        data: { alerts }
      });

    } catch (error) {
      console.error('Get admin alerts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get admin alerts',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Mark alert as read
  static async markAlertAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const monitoringService = new OrderMonitoringService();
      const success = await monitoringService.markAlertAsRead(parseInt(id), userId);

      if (success) {
        res.json({
          success: true,
          message: 'Alert marked as read'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Alert not found or access denied'
        });
      }

    } catch (error) {
      console.error('Mark alert as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark alert as read',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Run manual order monitoring check (admin only)
  static async runOrderCheck(req, res) {
    try {
      const monitoringService = new OrderMonitoringService();
      const alerts = await monitoringService.checkOrderAlerts();

      // Log activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        'order_monitoring_check',
        'system',
        null,
        {
          total_alerts: Object.values(alerts).reduce((sum, alertArray) => sum + alertArray.length, 0),
          alert_types: Object.keys(alerts).filter(key => alerts[key].length > 0)
        },
        req
      );

      res.json({
        success: true,
        message: 'Order monitoring check completed',
        data: { alerts }
      });

    } catch (error) {
      console.error('Run order check error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to run order check',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get monitoring statistics
  static async getMonitoringStats(req, res) {
    try {
      const monitoringService = new OrderMonitoringService();

      // Run a quick check to get current stats
      const alerts = await monitoringService.checkOrderAlerts();

      const stats = {
        total_alerts: Object.values(alerts).reduce((sum, alertArray) => sum + alertArray.length, 0),
        unassigned_orders: alerts.unassignedOrders.length,
        late_assignments: alerts.lateAssignments.length,
        stale_orders: alerts.staleInProgress.length,
        missing_tracking: alerts.missingTracking.length,
        stale_tracking: alerts.staleTracking.length,
        overdue_proofs: alerts.overdueProofs.length,
        last_check: new Date().toISOString()
      };

      res.json({
        success: true,
        data: { stats }
      });

    } catch (error) {
      console.error('Get monitoring stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get monitoring statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Update monitoring thresholds (admin only)
  static async updateThresholds(req, res) {
    try {
      const { thresholds } = req.body;

      // Validate thresholds
      const validThresholds = [
        'unassignedOrderHours',
        'assignedButNotAcceptedHours',
        'acceptedButNotStartedHours',
        'inProgressTooLongDays',
        'noTrackingAfterDays',
        'staleTrackingDays'
      ];

      const invalidKeys = Object.keys(thresholds).filter(key => !validThresholds.includes(key));
      if (invalidKeys.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid threshold keys: ${invalidKeys.join(', ')}`
        });
      }

      // Save to system settings
      await db('system_settings')
        .insert({
          setting_key: 'order_monitoring_thresholds',
          setting_value: JSON.stringify(thresholds),
          description: 'Order monitoring alert thresholds',
          updated_by: req.user.id
        })
        .onConflict('setting_key')
        .merge({
          setting_value: JSON.stringify(thresholds),
          updated_by: req.user.id,
          updated_at: new Date()
        });

      // Log activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        'monitoring_thresholds_updated',
        'system',
        null,
        { thresholds },
        req
      );

      res.json({
        success: true,
        message: 'Monitoring thresholds updated successfully'
      });

    } catch (error) {
      console.error('Update thresholds error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update thresholds',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = OrderMonitoringController;