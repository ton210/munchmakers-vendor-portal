const db = require('../config/database');

class VendorAssignment {
  static async create(assignmentData) {
    const [assignment] = await db('vendor_assignments').insert(assignmentData).returning('*');
    return assignment;
  }

  static async findById(id) {
    return await db('vendor_assignments').where({ id }).first();
  }

  static async findByOrderId(orderId) {
    return await db('vendor_assignments')
      .select(
        'vendor_assignments.*',
        'vendors.company_name',
        'vendor_users.first_name as vendor_first_name',
        'vendor_users.last_name as vendor_last_name',
        'vendor_users.email as vendor_email'
      )
      .leftJoin('vendors', 'vendor_assignments.vendor_id', 'vendors.id')
      .leftJoin('vendor_users', 'vendors.id', 'vendor_users.vendor_id')
      .where('vendor_assignments.order_id', orderId)
      .where('vendor_users.role', 'owner');
  }

  static async findByVendorId(vendorId, filters = {}) {
    const { status, date_from, date_to } = filters;

    let query = db('vendor_assignments')
      .select(
        'vendor_assignments.*',
        'orders.order_number',
        'orders.customer_name',
        'orders.total_amount',
        'orders.order_date',
        'orders.order_status',
        'stores.name as store_name',
        'stores.type as store_type'
      )
      .leftJoin('orders', 'vendor_assignments.order_id', 'orders.id')
      .leftJoin('stores', 'orders.store_id', 'stores.id')
      .where('vendor_assignments.vendor_id', vendorId);

    if (status) {
      query = query.where('vendor_assignments.status', status);
    }

    if (date_from) {
      query = query.where('orders.order_date', '>=', date_from);
    }

    if (date_to) {
      query = query.where('orders.order_date', '<=', date_to);
    }

    return await query.orderBy('vendor_assignments.assigned_at', 'desc');
  }

  static async updateStatus(id, newStatus, userId) {
    const updateData = {
      status: newStatus,
      updated_at: new Date()
    };

    if (newStatus === 'accepted') {
      updateData.accepted_at = new Date();
    } else if (newStatus === 'completed') {
      updateData.completed_at = new Date();
    }

    const [assignment] = await db('vendor_assignments')
      .where({ id })
      .update(updateData)
      .returning('*');

    return assignment;
  }

  static async update(id, updateData) {
    updateData.updated_at = new Date();
    const [assignment] = await db('vendor_assignments')
      .where({ id })
      .update(updateData)
      .returning('*');
    return assignment;
  }

  static async delete(id) {
    return await db('vendor_assignments').where({ id }).delete();
  }

  static async getVendorStats(vendorId, dateRange = {}) {
    const { date_from, date_to } = dateRange;

    let query = db('vendor_assignments')
      .leftJoin('orders', 'vendor_assignments.order_id', 'orders.id')
      .where('vendor_assignments.vendor_id', vendorId);

    if (date_from) {
      query = query.where('orders.order_date', '>=', date_from);
    }

    if (date_to) {
      query = query.where('orders.order_date', '<=', date_to);
    }

    const stats = await query
      .select(
        db.raw('COUNT(*) as total_assignments'),
        db.raw('SUM(commission_amount) as total_commission'),
        db.raw('COUNT(CASE WHEN vendor_assignments.status = \'completed\' THEN 1 END) as completed_assignments'),
        db.raw('COUNT(CASE WHEN vendor_assignments.status = \'assigned\' THEN 1 END) as pending_assignments'),
        db.raw('AVG(orders.total_amount) as average_order_value')
      )
      .first();

    return {
      total_assignments: parseInt(stats.total_assignments),
      total_commission: parseFloat(stats.total_commission) || 0,
      completed_assignments: parseInt(stats.completed_assignments),
      pending_assignments: parseInt(stats.pending_assignments),
      average_order_value: parseFloat(stats.average_order_value) || 0,
      completion_rate: stats.total_assignments > 0
        ? (stats.completed_assignments / stats.total_assignments * 100).toFixed(2)
        : 0
    };
  }

  static async getRecentAssignments(vendorId, limit = 10) {
    return await db('vendor_assignments')
      .select(
        'vendor_assignments.*',
        'orders.order_number',
        'orders.customer_name',
        'orders.total_amount',
        'orders.order_date',
        'stores.name as store_name'
      )
      .leftJoin('orders', 'vendor_assignments.order_id', 'orders.id')
      .leftJoin('stores', 'orders.store_id', 'stores.id')
      .where('vendor_assignments.vendor_id', vendorId)
      .orderBy('vendor_assignments.assigned_at', 'desc')
      .limit(limit);
  }
}

module.exports = VendorAssignment;