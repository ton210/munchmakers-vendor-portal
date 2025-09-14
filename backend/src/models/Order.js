const db = require('../config/database');

class Order {
  static async create(orderData) {
    const [order] = await db('orders').insert(orderData).returning('*');
    return order;
  }

  static async findById(id) {
    return await db('orders').where({ id }).first();
  }

  static async findByExternalId(storeId, externalOrderId) {
    return await db('orders')
      .where({ store_id: storeId, external_order_id: externalOrderId })
      .first();
  }

  static async getWithDetails(id) {
    const order = await db('orders')
      .select(
        'orders.*',
        'stores.name as store_name',
        'stores.type as store_type'
      )
      .leftJoin('stores', 'orders.store_id', 'stores.id')
      .where('orders.id', id)
      .first();

    if (!order) return null;

    // Get order items
    const items = await db('order_items')
      .where('order_id', id)
      .orderBy('id');

    // Get vendor assignments
    const assignments = await db('vendor_assignments')
      .select(
        'vendor_assignments.*',
        'vendors.company_name',
        'vendor_users.first_name',
        'vendor_users.last_name'
      )
      .leftJoin('vendors', 'vendor_assignments.vendor_id', 'vendors.id')
      .leftJoin('vendor_users', 'vendors.id', 'vendor_users.vendor_id')
      .where('vendor_assignments.order_id', id)
      .where('vendor_users.role', 'owner');

    // Get status history
    const statusHistory = await db('order_status_history')
      .select(
        'order_status_history.*',
        'admin_users.first_name as changed_by_first_name',
        'admin_users.last_name as changed_by_last_name'
      )
      .leftJoin('admin_users', 'order_status_history.changed_by', 'admin_users.id')
      .where('order_id', id)
      .orderBy('created_at', 'desc');

    return {
      ...order,
      items,
      vendor_assignments: assignments,
      status_history: statusHistory
    };
  }

  static async getAll(filters = {}, pagination = {}) {
    const {
      status,
      store_id,
      vendor_id,
      search,
      date_from,
      date_to,
      user_role,
      user_vendor_id
    } = filters;

    const { limit = 50, offset = 0, sortBy = 'order_date', sortOrder = 'desc' } = pagination;

    let query = db('orders')
      .select(
        'orders.*',
        'stores.name as store_name',
        'stores.type as store_type'
      )
      .leftJoin('stores', 'orders.store_id', 'stores.id');

    // Role-based filtering
    if (user_role === 'vendor' && user_vendor_id) {
      query = query.whereExists(function() {
        this.select('*')
          .from('vendor_assignments')
          .whereRaw('vendor_assignments.order_id = orders.id')
          .where('vendor_assignments.vendor_id', user_vendor_id);
      });
    }

    // Apply filters
    if (status) {
      query = query.where('orders.order_status', status);
    }

    if (store_id) {
      query = query.where('orders.store_id', store_id);
    }

    if (vendor_id && user_role !== 'vendor') {
      query = query.whereExists(function() {
        this.select('*')
          .from('vendor_assignments')
          .whereRaw('vendor_assignments.order_id = orders.id')
          .where('vendor_assignments.vendor_id', vendor_id);
      });
    }

    if (search) {
      query = query.where(function() {
        this.where('orders.order_number', 'ilike', `%${search}%`)
          .orWhere('orders.customer_name', 'ilike', `%${search}%`)
          .orWhere('orders.customer_email', 'ilike', `%${search}%`);
      });
    }

    if (date_from) {
      query = query.where('orders.order_date', '>=', date_from);
    }

    if (date_to) {
      query = query.where('orders.order_date', '<=', date_to);
    }

    // Apply pagination and sorting
    query = query
      .limit(limit)
      .offset(offset)
      .orderBy(`orders.${sortBy}`, sortOrder);

    return await query;
  }

  static async getCount(filters = {}) {
    const {
      status,
      store_id,
      vendor_id,
      search,
      date_from,
      date_to,
      user_role,
      user_vendor_id
    } = filters;

    let query = db('orders').count('id as count');

    // Role-based filtering
    if (user_role === 'vendor' && user_vendor_id) {
      query = query.whereExists(function() {
        this.select('*')
          .from('vendor_assignments')
          .whereRaw('vendor_assignments.order_id = orders.id')
          .where('vendor_assignments.vendor_id', user_vendor_id);
      });
    }

    // Apply same filters as getAll
    if (status) query = query.where('order_status', status);
    if (store_id) query = query.where('store_id', store_id);
    if (vendor_id && user_role !== 'vendor') {
      query = query.whereExists(function() {
        this.select('*')
          .from('vendor_assignments')
          .whereRaw('vendor_assignments.order_id = orders.id')
          .where('vendor_assignments.vendor_id', vendor_id);
      });
    }
    if (search) {
      query = query.where(function() {
        this.where('order_number', 'ilike', `%${search}%`)
          .orWhere('customer_name', 'ilike', `%${search}%`)
          .orWhere('customer_email', 'ilike', `%${search}%`);
      });
    }
    if (date_from) query = query.where('order_date', '>=', date_from);
    if (date_to) query = query.where('order_date', '<=', date_to);

    const result = await query.first();
    return parseInt(result.count);
  }

  static async update(id, updateData) {
    updateData.updated_at = new Date();
    const [order] = await db('orders')
      .where({ id })
      .update(updateData)
      .returning('*');
    return order;
  }

  static async updateStatus(id, newStatus, changedBy, notes = null) {
    const order = await Order.findById(id);
    if (!order) throw new Error('Order not found');

    // Update order status
    await Order.update(id, { order_status: newStatus });

    // Log status change
    await db('order_status_history').insert({
      order_id: id,
      changed_by: changedBy,
      old_status: order.order_status,
      new_status: newStatus,
      notes
    });

    return await Order.getWithDetails(id);
  }

  static async assignVendor(orderId, vendorId, assignedBy, assignmentType = 'full', items = null) {
    // Check if already assigned
    const existingAssignment = await db('vendor_assignments')
      .where({ order_id: orderId, vendor_id: vendorId })
      .first();

    if (existingAssignment) {
      throw new Error('Vendor is already assigned to this order');
    }

    // Calculate commission amount
    const order = await Order.findById(orderId);
    const vendor = await db('vendors').where({ id: vendorId }).first();
    const commissionAmount = order.total_amount * (vendor.commission_rate / 100);

    const assignmentData = {
      order_id: orderId,
      vendor_id: vendorId,
      assigned_by: assignedBy,
      assignment_type: assignmentType,
      items: items ? JSON.stringify(items) : null,
      commission_amount: commissionAmount
    };

    const [assignment] = await db('vendor_assignments')
      .insert(assignmentData)
      .returning('*');

    return assignment;
  }

  static async getVendorOrders(vendorId, filters = {}, pagination = {}) {
    const orders = await Order.getAll({
      ...filters,
      user_role: 'vendor',
      user_vendor_id: vendorId
    }, pagination);

    return orders;
  }

  static async getStats(filters = {}) {
    const {
      user_role,
      user_vendor_id,
      date_from,
      date_to
    } = filters;

    let query = db('orders');

    // Role-based filtering
    if (user_role === 'vendor' && user_vendor_id) {
      query = query.whereExists(function() {
        this.select('*')
          .from('vendor_assignments')
          .whereRaw('vendor_assignments.order_id = orders.id')
          .where('vendor_assignments.vendor_id', user_vendor_id);
      });
    }

    if (date_from) query = query.where('order_date', '>=', date_from);
    if (date_to) query = query.where('order_date', '<=', date_to);

    const stats = await query
      .select(
        db.raw('COUNT(*) as total_orders'),
        db.raw('SUM(total_amount) as total_revenue'),
        db.raw('AVG(total_amount) as average_order_value'),
        db.raw('COUNT(CASE WHEN order_status = \'pending\' THEN 1 END) as pending_orders'),
        db.raw('COUNT(CASE WHEN order_status = \'processing\' THEN 1 END) as processing_orders'),
        db.raw('COUNT(CASE WHEN order_status = \'fulfilled\' THEN 1 END) as fulfilled_orders')
      )
      .first();

    return {
      total_orders: parseInt(stats.total_orders),
      total_revenue: parseFloat(stats.total_revenue) || 0,
      average_order_value: parseFloat(stats.average_order_value) || 0,
      pending_orders: parseInt(stats.pending_orders),
      processing_orders: parseInt(stats.processing_orders),
      fulfilled_orders: parseInt(stats.fulfilled_orders)
    };
  }

  static async delete(id) {
    return await db('orders').where({ id }).delete();
  }

  static async createOrderItems(orderId, items) {
    const orderItems = items.map(item => ({
      order_id: orderId,
      external_item_id: item.external_item_id,
      product_name: item.product_name,
      sku: item.sku,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      variant_title: item.variant_title,
      product_data: item.product_data ? JSON.stringify(item.product_data) : null
    }));

    return await db('order_items').insert(orderItems).returning('*');
  }

  static async syncFromStore(storeId) {
    try {
      const store = await db('stores').where({ id: storeId }).first();
      if (!store) throw new Error('Store not found');

      const integration = storeService.getIntegration(store.type);
      const orders = await integration.getOrders(store);

      let syncedCount = 0;
      for (const orderData of orders) {
        const existingOrder = await Order.findByExternalId(storeId, orderData.external_order_id);

        if (!existingOrder) {
          const order = await Order.create({
            store_id: storeId,
            external_order_id: orderData.external_order_id,
            order_number: orderData.order_number,
            customer_email: orderData.customer_email,
            customer_name: orderData.customer_name,
            customer_phone: orderData.customer_phone,
            billing_address: orderData.billing_address,
            shipping_address: orderData.shipping_address,
            total_amount: orderData.total_amount,
            currency: orderData.currency,
            order_status: orderData.order_status,
            fulfillment_status: orderData.fulfillment_status,
            payment_status: orderData.payment_status,
            notes: orderData.notes,
            tags: orderData.tags,
            order_date: orderData.order_date
          });

          if (orderData.items && orderData.items.length > 0) {
            await Order.createOrderItems(order.id, orderData.items);
          }

          syncedCount++;
        }
      }

      // Update last sync time
      await db('stores').where({ id: storeId }).update({ last_sync_at: new Date() });

      return { syncedCount, totalOrders: orders.length };
    } catch (error) {
      console.error('Error syncing orders from store:', error);
      throw error;
    }
  }
}

module.exports = Order;