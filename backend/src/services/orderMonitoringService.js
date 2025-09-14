const db = require('../config/database');
const EmailService = require('./emailService');
const SlackService = require('./slackService');
const TranslationService = require('./translationService');

class OrderMonitoringService {
  constructor() {
    this.thresholds = {
      unassignedOrderHours: 24, // Orders unassigned for 24+ hours
      assignedButNotAcceptedHours: 48, // Assigned but not accepted for 48+ hours
      acceptedButNotStartedHours: 72, // Accepted but not started for 72+ hours
      inProgressTooLongDays: 7, // In progress for 7+ days
      noTrackingAfterDays: 3, // No tracking number after 3 days of being in progress
      staleTrackingDays: 14 // Tracking not updated for 14+ days
    };
  }

  async checkOrderAlerts() {
    try {
      console.log('🔍 Running order monitoring checks...');

      const alerts = {
        unassignedOrders: await this.getUnassignedOrders(),
        lateAssignments: await this.getLateAssignments(),
        staleInProgress: await this.getStaleInProgressOrders(),
        missingTracking: await this.getOrdersMissingTracking(),
        staleTracking: await this.getOrdersWithStaleTracking(),
        overdueProofs: await this.getOverdueProofs()
      };

      const totalAlerts = Object.values(alerts).reduce((sum, alertArray) => sum + alertArray.length, 0);

      if (totalAlerts > 0) {
        console.log(`⚠️ Found ${totalAlerts} order alerts`);

        // Send Slack notification
        await this.sendSlackAlert(alerts);

        // Send email notifications to relevant vendors
        await this.sendVendorEmailAlerts(alerts);

        // Log alerts in database
        await this.logOrderAlerts(alerts);
      } else {
        console.log('✅ No order alerts found - all orders are on track');
      }

      return alerts;

    } catch (error) {
      console.error('Order monitoring error:', error);
      throw error;
    }
  }

  async getUnassignedOrders() {
    const hours = this.thresholds.unassignedOrderHours;

    const orders = await db('orders')
      .select(
        'orders.*',
        'stores.name as store_name',
        'stores.type as store_type'
      )
      .leftJoin('stores', 'orders.store_id', 'stores.id')
      .leftJoin('vendor_assignments', 'orders.id', 'vendor_assignments.order_id')
      .whereNull('vendor_assignments.id') // No vendor assigned
      .where('orders.order_date', '<', db.raw(`NOW() - INTERVAL '${hours} hours'`))
      .whereIn('orders.order_status', ['pending', 'processing'])
      .orderBy('orders.order_date', 'asc');

    return orders.map(order => ({
      ...order,
      alert_type: 'unassigned',
      hours_overdue: Math.floor((new Date() - new Date(order.order_date)) / (1000 * 60 * 60))
    }));
  }

  async getLateAssignments() {
    const acceptedHours = this.thresholds.assignedButNotAcceptedHours;
    const startedHours = this.thresholds.acceptedButNotStartedHours;

    // Assigned but not accepted
    const notAccepted = await db('vendor_assignments')
      .select(
        'vendor_assignments.*',
        'orders.order_number',
        'orders.customer_name',
        'orders.total_amount',
        'vendors.company_name',
        'vendor_users.email as vendor_email',
        'stores.name as store_name'
      )
      .leftJoin('orders', 'vendor_assignments.order_id', 'orders.id')
      .leftJoin('vendors', 'vendor_assignments.vendor_id', 'vendors.id')
      .leftJoin('vendor_users', 'vendors.id', 'vendor_users.vendor_id')
      .leftJoin('stores', 'orders.store_id', 'stores.id')
      .where('vendor_assignments.status', 'assigned')
      .where('vendor_assignments.assigned_at', '<', db.raw(`NOW() - INTERVAL '${acceptedHours} hours'`))
      .where('vendor_users.role', 'owner');

    // Accepted but not started
    const notStarted = await db('vendor_assignments')
      .select(
        'vendor_assignments.*',
        'orders.order_number',
        'orders.customer_name',
        'orders.total_amount',
        'vendors.company_name',
        'vendor_users.email as vendor_email',
        'stores.name as store_name'
      )
      .leftJoin('orders', 'vendor_assignments.order_id', 'orders.id')
      .leftJoin('vendors', 'vendor_assignments.vendor_id', 'vendors.id')
      .leftJoin('vendor_users', 'vendors.id', 'vendor_users.vendor_id')
      .leftJoin('stores', 'orders.store_id', 'stores.id')
      .where('vendor_assignments.status', 'accepted')
      .where('vendor_assignments.accepted_at', '<', db.raw(`NOW() - INTERVAL '${startedHours} hours`))
      .where('vendor_users.role', 'owner');

    return [
      ...notAccepted.map(assignment => ({
        ...assignment,
        alert_type: 'not_accepted',
        hours_overdue: Math.floor((new Date() - new Date(assignment.assigned_at)) / (1000 * 60 * 60))
      })),
      ...notStarted.map(assignment => ({
        ...assignment,
        alert_type: 'not_started',
        hours_overdue: Math.floor((new Date() - new Date(assignment.accepted_at)) / (1000 * 60 * 60))
      }))
    ];
  }

  async getStaleInProgressOrders() {
    const days = this.thresholds.inProgressTooLongDays;

    const assignments = await db('vendor_assignments')
      .select(
        'vendor_assignments.*',
        'orders.order_number',
        'orders.customer_name',
        'orders.total_amount',
        'vendors.company_name',
        'vendor_users.email as vendor_email',
        'stores.name as store_name'
      )
      .leftJoin('orders', 'vendor_assignments.order_id', 'orders.id')
      .leftJoin('vendors', 'vendor_assignments.vendor_id', 'vendors.id')
      .leftJoin('vendor_users', 'vendors.id', 'vendor_users.vendor_id')
      .leftJoin('stores', 'orders.store_id', 'stores.id')
      .where('vendor_assignments.status', 'in_progress')
      .where('vendor_assignments.updated_at', '<', db.raw(`NOW() - INTERVAL '${days} days`))
      .where('vendor_users.role', 'owner');

    return assignments.map(assignment => ({
      ...assignment,
      alert_type: 'stale_in_progress',
      days_overdue: Math.floor((new Date() - new Date(assignment.updated_at)) / (1000 * 60 * 60 * 24))
    }));
  }

  async getOrdersMissingTracking() {
    const days = this.thresholds.noTrackingAfterDays;

    const assignments = await db('vendor_assignments')
      .select(
        'vendor_assignments.*',
        'orders.order_number',
        'orders.customer_name',
        'orders.total_amount',
        'vendors.company_name',
        'vendor_users.email as vendor_email',
        'stores.name as store_name'
      )
      .leftJoin('orders', 'vendor_assignments.order_id', 'orders.id')
      .leftJoin('vendors', 'vendor_assignments.vendor_id', 'vendors.id')
      .leftJoin('vendor_users', 'vendors.id', 'vendor_users.vendor_id')
      .leftJoin('stores', 'orders.store_id', 'stores.id')
      .leftJoin('order_tracking', 'orders.id', 'order_tracking.order_id')
      .where('vendor_assignments.status', 'in_progress')
      .where('vendor_assignments.updated_at', '<', db.raw(`NOW() - INTERVAL '${days} days`))
      .whereNull('order_tracking.id') // No tracking record
      .where('vendor_users.role', 'owner');

    return assignments.map(assignment => ({
      ...assignment,
      alert_type: 'missing_tracking',
      days_overdue: Math.floor((new Date() - new Date(assignment.updated_at)) / (1000 * 60 * 60 * 24))
    }));
  }

  async getOrdersWithStaleTracking() {
    const days = this.thresholds.staleTrackingDays;

    const tracking = await db('order_tracking')
      .select(
        'order_tracking.*',
        'orders.order_number',
        'orders.customer_name',
        'orders.total_amount',
        'vendors.company_name',
        'vendor_users.email as vendor_email',
        'stores.name as store_name'
      )
      .leftJoin('orders', 'order_tracking.order_id', 'orders.id')
      .leftJoin('vendor_assignments', 'order_tracking.vendor_assignment_id', 'vendor_assignments.id')
      .leftJoin('vendors', 'vendor_assignments.vendor_id', 'vendors.id')
      .leftJoin('vendor_users', 'vendors.id', 'vendor_users.vendor_id')
      .leftJoin('stores', 'orders.store_id', 'stores.id')
      .where('order_tracking.status', '!=', 'delivered')
      .where('order_tracking.updated_at', '<', db.raw(`NOW() - INTERVAL '${days} days`))
      .where('vendor_users.role', 'owner');

    return tracking.map(track => ({
      ...track,
      alert_type: 'stale_tracking',
      days_overdue: Math.floor((new Date() - new Date(track.updated_at)) / (1000 * 60 * 60 * 24))
    }));
  }

  async getOverdueProofs() {
    const proofs = await db('customer_proof_approvals')
      .select(
        'customer_proof_approvals.*',
        'orders.order_number',
        'orders.customer_name',
        'vendors.company_name',
        'vendor_users.email as vendor_email'
      )
      .leftJoin('orders', 'customer_proof_approvals.order_id', 'orders.id')
      .leftJoin('vendor_assignments', 'customer_proof_approvals.vendor_assignment_id', 'vendor_assignments.id')
      .leftJoin('vendors', 'vendor_assignments.vendor_id', 'vendors.id')
      .leftJoin('vendor_users', 'vendors.id', 'vendor_users.vendor_id')
      .where('customer_proof_approvals.status', 'pending')
      .where('customer_proof_approvals.expires_at', '<', new Date())
      .where('vendor_users.role', 'owner');

    return proofs.map(proof => ({
      ...proof,
      alert_type: 'overdue_proof',
      days_overdue: Math.floor((new Date() - new Date(proof.expires_at)) / (1000 * 60 * 60 * 24))
    }));
  }

  async sendSlackAlert(alerts) {
    try {
      const totalAlerts = Object.values(alerts).reduce((sum, alertArray) => sum + alertArray.length, 0);

      if (totalAlerts === 0) return;

      const slackMessage = {
        text: `🚨 Daily Order Monitoring Alert - ${totalAlerts} Issues Found`,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "🚨 Daily Order Monitoring Report"
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Total Issues:* ${totalAlerts}\n*Report Date:* ${new Date().toLocaleDateString()}`
            }
          }
        ]
      };

      // Add sections for each alert type
      if (alerts.unassignedOrders.length > 0) {
        slackMessage.blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*🔴 Unassigned Orders (${alerts.unassignedOrders.length})*\nOrders waiting for vendor assignment for 24+ hours`
          }
        });

        alerts.unassignedOrders.slice(0, 5).forEach(order => {
          slackMessage.blocks.push({
            type: "section",
            text: {
              type: "mrkdwn",
              text: `• Order #${order.order_number} (${order.store_name}) - ${order.hours_overdue}h overdue\n  Customer: ${order.customer_name} | $${order.total_amount}`
            }
          });
        });
      }

      if (alerts.lateAssignments.length > 0) {
        slackMessage.blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*🟡 Late Vendor Responses (${alerts.lateAssignments.length})*\nVendors not responding to assignments`
          }
        });

        alerts.lateAssignments.slice(0, 5).forEach(assignment => {
          const alertText = assignment.alert_type === 'not_accepted' ? 'Not Accepted' : 'Not Started';
          slackMessage.blocks.push({
            type: "section",
            text: {
              type: "mrkdwn",
              text: `• Order #${assignment.order_number} - ${alertText} (${assignment.hours_overdue}h)\n  Vendor: ${assignment.company_name} | $${assignment.total_amount}`
            }
          });
        });
      }

      if (alerts.missingTracking.length > 0) {
        slackMessage.blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*📦 Missing Tracking Numbers (${alerts.missingTracking.length})*\nOrders in progress without tracking`
          }
        });
      }

      if (alerts.staleTracking.length > 0) {
        slackMessage.blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*🚚 Stale Tracking (${alerts.staleTracking.length})*\nShipments with outdated tracking status`
          }
        });
      }

      // Add action buttons
      slackMessage.blocks.push({
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View Admin Dashboard"
            },
            url: "https://vendors.munchmakers.com/admin/orders"
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View Analytics"
            },
            url: "https://vendors.munchmakers.com/admin/analytics"
          }
        ]
      });

      await SlackService.sendCustomMessage(slackMessage);

    } catch (error) {
      console.error('Slack alert error:', error);
    }
  }

  async sendVendorEmailAlerts(alerts) {
    try {
      const translationService = new TranslationService();

      // Group alerts by vendor
      const vendorAlerts = {};

      [...alerts.lateAssignments, ...alerts.staleInProgress, ...alerts.missingTracking].forEach(alert => {
        if (alert.vendor_email) {
          if (!vendorAlerts[alert.vendor_email]) {
            vendorAlerts[alert.vendor_email] = {
              vendor_name: alert.company_name,
              email: alert.vendor_email,
              alerts: []
            };
          }
          vendorAlerts[alert.vendor_email].alerts.push(alert);
        }
      });

      // Send emails to each vendor
      for (const [email, vendorData] of Object.entries(vendorAlerts)) {
        await this.sendVendorAlert(vendorData, translationService);
      }

    } catch (error) {
      console.error('Vendor email alerts error:', error);
    }
  }

  async sendVendorAlert(vendorData, translationService) {
    try {
      const { vendor_name, email, alerts } = vendorData;

      // Create English email content
      const englishSubject = `Order Action Required - ${alerts.length} Pending Items`;
      const englishBody = `
Dear ${vendor_name},

You have ${alerts.length} orders requiring immediate attention:

${alerts.map(alert => {
  switch (alert.alert_type) {
    case 'not_accepted':
      return `• Order #${alert.order_number} - Please accept assignment (${alert.hours_overdue}h overdue)`;
    case 'not_started':
      return `• Order #${alert.order_number} - Please start work (${alert.hours_overdue}h overdue)`;
    case 'stale_in_progress':
      return `• Order #${alert.order_number} - In progress for ${alert.days_overdue} days, please update status`;
    case 'missing_tracking':
      return `• Order #${alert.order_number} - Please add tracking number (${alert.days_overdue} days overdue)`;
    default:
      return `• Order #${alert.order_number} - Requires attention`;
  }
}).join('\n')}

Please log into your vendor dashboard to take action:
https://vendors.munchmakers.com/login

Best regards,
MunchMakers Team
      `.trim();

      // Translate to Chinese
      const chineseSubject = await translationService.translateToChinese(englishSubject, 'email');
      const chineseBody = await translationService.translateToChinese(englishBody, 'email');

      // Send Chinese email to vendor
      await EmailService.sendVendorAlert(email, vendor_name, {
        subject: chineseSubject,
        body: chineseBody,
        alerts: alerts.length,
        dashboard_url: 'https://vendors.munchmakers.com/login'
      });

      console.log(`📧 Sent Chinese alert email to ${vendor_name} (${email}) - ${alerts.length} alerts`);

    } catch (error) {
      console.error(`Failed to send vendor alert to ${vendorData.email}:`, error);
    }
  }

  async logOrderAlerts(alerts) {
    try {
      const allAlerts = [...alerts.unassignedOrders, ...alerts.lateAssignments, ...alerts.staleInProgress, ...alerts.missingTracking, ...alerts.staleTracking, ...alerts.overdueProofs];

      for (const alert of allAlerts) {
        await db('notifications').insert({
          user_id: alert.vendor_id || null,
          user_type: alert.vendor_id ? 'vendor' : 'admin',
          type: 'order_alert',
          title: this.getAlertTitle(alert.alert_type),
          message: this.getAlertMessage(alert),
          data: JSON.stringify({
            alert_type: alert.alert_type,
            order_id: alert.order_id || alert.id,
            order_number: alert.order_number,
            overdue_amount: alert.hours_overdue || alert.days_overdue
          })
        });
      }

      console.log(`💾 Logged ${allAlerts.length} order alerts to database`);

    } catch (error) {
      console.error('Log alerts error:', error);
    }
  }

  getAlertTitle(alertType) {
    const titles = {
      'unassigned': 'Unassigned Order',
      'not_accepted': 'Assignment Not Accepted',
      'not_started': 'Work Not Started',
      'stale_in_progress': 'Order In Progress Too Long',
      'missing_tracking': 'Missing Tracking Number',
      'stale_tracking': 'Outdated Tracking Status',
      'overdue_proof': 'Customer Proof Expired'
    };
    return titles[alertType] || 'Order Alert';
  }

  getAlertMessage(alert) {
    switch (alert.alert_type) {
      case 'unassigned':
        return `Order #${alert.order_number} has been unassigned for ${alert.hours_overdue} hours`;
      case 'not_accepted':
        return `Order #${alert.order_number} assignment has not been accepted for ${alert.hours_overdue} hours`;
      case 'not_started':
        return `Order #${alert.order_number} has been accepted but not started for ${alert.hours_overdue} hours`;
      case 'stale_in_progress':
        return `Order #${alert.order_number} has been in progress for ${alert.days_overdue} days`;
      case 'missing_tracking':
        return `Order #${alert.order_number} needs tracking number (${alert.days_overdue} days overdue)`;
      case 'stale_tracking':
        return `Order #${alert.order_number} tracking not updated for ${alert.days_overdue} days`;
      case 'overdue_proof':
        return `Customer proof for order #${alert.order_number} expired ${alert.days_overdue} days ago`;
      default:
        return 'Order requires attention';
    }
  }

  async getVendorAlerts(vendorId) {
    try {
      // Get all alerts relevant to this vendor
      const vendorAlerts = await db('notifications')
        .where('user_id', vendorId)
        .where('user_type', 'vendor')
        .where('type', 'order_alert')
        .where('is_read', false)
        .orderBy('created_at', 'desc')
        .limit(10);

      return vendorAlerts;

    } catch (error) {
      console.error('Get vendor alerts error:', error);
      return [];
    }
  }

  async getAdminAlerts() {
    try {
      // Get system-wide alerts for admins
      const adminAlerts = await db('notifications')
        .where('user_type', 'admin')
        .where('type', 'order_alert')
        .where('is_read', false)
        .orderBy('created_at', 'desc')
        .limit(20);

      return adminAlerts;

    } catch (error) {
      console.error('Get admin alerts error:', error);
      return [];
    }
  }

  async markAlertAsRead(alertId, userId) {
    try {
      await db('notifications')
        .where('id', alertId)
        .where('user_id', userId)
        .update({
          is_read: true,
          updated_at: new Date()
        });

      return true;

    } catch (error) {
      console.error('Mark alert as read error:', error);
      return false;
    }
  }
}

module.exports = OrderMonitoringService;