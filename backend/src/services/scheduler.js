const cron = require('node-cron');
const OrderMonitoringService = require('./orderMonitoringService');

class Scheduler {
  static init() {
    console.log('📅 Initializing scheduled tasks...');

    // Daily order monitoring check at 9:00 AM UTC (adjustable for timezone)
    cron.schedule('0 9 * * *', async () => {
      console.log('🔔 Running daily order monitoring check...');
      try {
        const monitoringService = new OrderMonitoringService();
        await monitoringService.checkOrderAlerts();
        console.log('✅ Daily order monitoring completed');
      } catch (error) {
        console.error('❌ Daily order monitoring failed:', error);
      }
    }, {
      timezone: "UTC"
    });

    // Hourly check for critical alerts (unassigned orders)
    cron.schedule('0 * * * *', async () => {
      console.log('⏰ Running hourly critical alerts check...');
      try {
        const monitoringService = new OrderMonitoringService();
        const alerts = await monitoringService.checkOrderAlerts();

        // Only send notifications for critical alerts (unassigned orders)
        const criticalAlerts = alerts.unassignedOrders.filter(order => order.hours_overdue >= 6);

        if (criticalAlerts.length > 0) {
          console.log(`🚨 Found ${criticalAlerts.length} critical unassigned orders`);
          await monitoringService.sendSlackAlert({ unassignedOrders: criticalAlerts });
        }

      } catch (error) {
        console.error('❌ Hourly critical alerts check failed:', error);
      }
    }, {
      timezone: "UTC"
    });

    // Weekly comprehensive report on Mondays at 10:00 AM
    cron.schedule('0 10 * * 1', async () => {
      console.log('📊 Running weekly order monitoring report...');
      try {
        const monitoringService = new OrderMonitoringService();
        await monitoringService.generateWeeklyReport();
        console.log('✅ Weekly monitoring report completed');
      } catch (error) {
        console.error('❌ Weekly monitoring report failed:', error);
      }
    }, {
      timezone: "UTC"
    });

    console.log('✅ Scheduled tasks initialized');
    console.log('📋 Schedule:');
    console.log('  • Daily monitoring: 9:00 AM UTC');
    console.log('  • Critical alerts: Every hour');
    console.log('  • Weekly report: Mondays 10:00 AM UTC');
  }

  static async runManualCheck() {
    console.log('🔍 Running manual order monitoring check...');
    try {
      const monitoringService = new OrderMonitoringService();
      const alerts = await monitoringService.checkOrderAlerts();
      console.log('✅ Manual order monitoring completed');
      return alerts;
    } catch (error) {
      console.error('❌ Manual order monitoring failed:', error);
      throw error;
    }
  }
}

module.exports = Scheduler;