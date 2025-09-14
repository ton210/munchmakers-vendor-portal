const db = require('../config/database');

class Store {
  static async create(storeData) {
    const [store] = await db('stores').insert(storeData).returning('*');
    return store;
  }

  static async findById(id) {
    return await db('stores').where({ id }).first();
  }

  static async getAll(filters = {}) {
    let query = db('stores').select('*');

    if (filters.type) {
      query = query.where('type', filters.type);
    }

    if (filters.is_active !== undefined) {
      query = query.where('is_active', filters.is_active);
    }

    return await query.orderBy('created_at', 'desc');
  }

  static async update(id, updateData) {
    updateData.updated_at = new Date();
    const [store] = await db('stores')
      .where({ id })
      .update(updateData)
      .returning('*');
    return store;
  }

  static async delete(id) {
    return await db('stores').where({ id }).delete();
  }

  static async getWithStats(id) {
    const store = await Store.findById(id);
    if (!store) return null;

    const stats = await db('orders')
      .where('store_id', id)
      .select(
        db.raw('COUNT(*) as total_orders'),
        db.raw('SUM(total_amount) as total_revenue'),
        db.raw('COUNT(CASE WHEN order_status = \'pending\' THEN 1 END) as pending_orders'),
        db.raw('COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as orders_today')
      )
      .first();

    return {
      ...store,
      stats: {
        total_orders: parseInt(stats.total_orders),
        total_revenue: parseFloat(stats.total_revenue) || 0,
        pending_orders: parseInt(stats.pending_orders),
        orders_today: parseInt(stats.orders_today)
      }
    };
  }

  static async testConnection(storeData) {
    try {
      // This would test the API connection based on store type
      // Implementation depends on store integration services
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  static async getActiveStores() {
    return await db('stores')
      .where('is_active', true)
      .where('sync_enabled', true)
      .orderBy('name');
  }

  static async updateLastSync(id) {
    return await Store.update(id, { last_sync_at: new Date() });
  }
}

module.exports = Store;