const db = require('../config/database');

class ActivityLogger {
  static async log(data) {
    try {
      const {
        user_id,
        user_type,
        action,
        entity_type = null,
        entity_id = null,
        metadata = null,
        ip_address = null,
        user_agent = null
      } = data;

      const logEntry = {
        user_id,
        user_type,
        action,
        entity_type,
        entity_id,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ip_address,
        user_agent,
        created_at: new Date()
      };

      await db('activity_logs').insert(logEntry);
      console.log(`Activity logged: ${user_type} ${user_id} performed ${action}`);
      return true;
    } catch (error) {
      console.error('Failed to log activity:', error);
      return false;
    }
  }

  static async getActivities(filters = {}, pagination = {}) {
    try {
      let query = db('activity_logs')
        .select(
          'activity_logs.*',
          db.raw(`
            CASE 
              WHEN activity_logs.user_type = 'vendor' THEN 
                CONCAT(vendor_users.first_name, ' ', vendor_users.last_name)
              WHEN activity_logs.user_type = 'admin' THEN 
                CONCAT(admin_users.first_name, ' ', admin_users.last_name)
              ELSE 'Unknown User'
            END as user_name
          `),
          db.raw(`
            CASE 
              WHEN activity_logs.user_type = 'vendor' THEN vendor_users.email
              WHEN activity_logs.user_type = 'admin' THEN admin_users.email
              ELSE NULL
            END as user_email
          `)
        )
        .leftJoin('vendor_users', function() {
          this.on('activity_logs.user_id', 'vendor_users.id')
              .andOn('activity_logs.user_type', db.raw('?', ['vendor']));
        })
        .leftJoin('admin_users', function() {
          this.on('activity_logs.user_id', 'admin_users.id')
              .andOn('activity_logs.user_type', db.raw('?', ['admin']));
        });

      // Apply filters
      if (filters.user_type) {
        query = query.where('activity_logs.user_type', filters.user_type);
      }

      if (filters.user_id) {
        query = query.where('activity_logs.user_id', filters.user_id);
      }

      if (filters.action) {
        query = query.where('activity_logs.action', 'like', `%${filters.action}%`);
      }

      if (filters.entity_type) {
        query = query.where('activity_logs.entity_type', filters.entity_type);
      }

      if (filters.entity_id) {
        query = query.where('activity_logs.entity_id', filters.entity_id);
      }

      if (filters.date_from) {
        query = query.where('activity_logs.created_at', '>=', filters.date_from);
      }

      if (filters.date_to) {
        query = query.where('activity_logs.created_at', '<=', filters.date_to);
      }

      // Apply pagination
      if (pagination.limit) {
        query = query.limit(pagination.limit);
      }

      if (pagination.offset) {
        query = query.offset(pagination.offset);
      }

      // Order by most recent
      query = query.orderBy('activity_logs.created_at', 'desc');

      const activities = await query;

      // Parse metadata JSON
      return activities.map(activity => ({
        ...activity,
        metadata: activity.metadata ? JSON.parse(activity.metadata) : null
      }));

    } catch (error) {
      console.error('Failed to get activities:', error);
      throw error;
    }
  }

  static async getActivityCount(filters = {}) {
    try {
      let query = db('activity_logs').count('id as count');

      if (filters.user_type) {
        query = query.where('user_type', filters.user_type);
      }

      if (filters.user_id) {
        query = query.where('user_id', filters.user_id);
      }

      if (filters.action) {
        query = query.where('action', 'like', `%${filters.action}%`);
      }

      if (filters.entity_type) {
        query = query.where('entity_type', filters.entity_type);
      }

      if (filters.entity_id) {
        query = query.where('entity_id', filters.entity_id);
      }

      if (filters.date_from) {
        query = query.where('created_at', '>=', filters.date_from);
      }

      if (filters.date_to) {
        query = query.where('created_at', '<=', filters.date_to);
      }

      const result = await query.first();
      return parseInt(result.count);

    } catch (error) {
      console.error('Failed to get activity count:', error);
      throw error;
    }
  }

  static async getUserActivities(userId, userType, limit = 50) {
    try {
      return await this.getActivities(
        { user_id: userId, user_type: userType },
        { limit }
      );
    } catch (error) {
      console.error('Failed to get user activities:', error);
      throw error;
    }
  }

  static async getRecentActivities(limit = 100) {
    try {
      return await this.getActivities({}, { limit });
    } catch (error) {
      console.error('Failed to get recent activities:', error);
      throw error;
    }
  }

  static async logVendorAction(userId, action, entityType = null, entityId = null, metadata = null, req = null) {
    return await this.log({
      user_id: userId,
      user_type: 'vendor',
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
      ip_address: req ? req.ip : null,
      user_agent: req ? req.get('User-Agent') : null
    });
  }

  static async logAdminAction(userId, action, entityType = null, entityId = null, metadata = null, req = null) {
    return await this.log({
      user_id: userId,
      user_type: 'admin',
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
      ip_address: req ? req.ip : null,
      user_agent: req ? req.get('User-Agent') : null
    });
  }

  // Analytics methods
  static async getActivityStats(dateFrom, dateTo) {
    try {
      const stats = await db.raw(`
        SELECT 
          COUNT(*) as total_activities,
          COUNT(CASE WHEN user_type = 'vendor' THEN 1 END) as vendor_activities,
          COUNT(CASE WHEN user_type = 'admin' THEN 1 END) as admin_activities,
          COUNT(CASE WHEN action = 'login' THEN 1 END) as logins,
          COUNT(CASE WHEN action = 'product_create' THEN 1 END) as products_created,
          COUNT(CASE WHEN action = 'product_submit' THEN 1 END) as products_submitted,
          COUNT(CASE WHEN action = 'vendor_registration' THEN 1 END) as vendor_registrations
        FROM activity_logs 
        WHERE created_at >= ? AND created_at <= ?
      `, [dateFrom, dateTo]);

      return stats.rows[0];
    } catch (error) {
      console.error('Failed to get activity stats:', error);
      throw error;
    }
  }

  static async getTopActions(limit = 10, dateFrom = null, dateTo = null) {
    try {
      let query = db('activity_logs')
        .select('action')
        .count('id as count')
        .groupBy('action')
        .orderBy('count', 'desc')
        .limit(limit);

      if (dateFrom) {
        query = query.where('created_at', '>=', dateFrom);
      }

      if (dateTo) {
        query = query.where('created_at', '<=', dateTo);
      }

      return await query;
    } catch (error) {
      console.error('Failed to get top actions:', error);
      throw error;
    }
  }

  // Cleanup old logs (retention policy)
  static async cleanupOldLogs(retentionDays = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const deletedCount = await db('activity_logs')
        .where('created_at', '<', cutoffDate)
        .delete();

      console.log(`Cleaned up ${deletedCount} old activity logs`);
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
      throw error;
    }
  }
}

module.exports = ActivityLogger;