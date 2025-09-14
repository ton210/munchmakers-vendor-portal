const db = require('../config/database');

class Vendor {
  static async create(vendorData) {
    const [vendor] = await db('vendors').insert(vendorData).returning('*');
    return vendor;
  }

  static async findById(id) {
    return await db('vendors').where({ id }).first();
  }

  static async findByEmail(email) {
    return await db('vendors').where({ email }).first();
  }

  static async update(id, updateData) {
    updateData.updated_at = new Date();
    const [vendor] = await db('vendors')
      .where({ id })
      .update(updateData)
      .returning('*');
    return vendor;
  }

  static async getAll(filters = {}, pagination = {}) {
    let query = db('vendors').select('*');

    if (filters.status) {
      query = query.where('status', filters.status);
    }

    if (filters.search) {
      query = query.where(function() {
        this.where('company_name', 'ilike', `%${filters.search}%`)
          .orWhere('contact_name', 'ilike', `%${filters.search}%`)
          .orWhere('email', 'ilike', `%${filters.search}%`);
      });
    }

    if (pagination.limit) {
      query = query.limit(pagination.limit);
    }

    if (pagination.offset) {
      query = query.offset(pagination.offset);
    }

    query = query.orderBy('created_at', 'desc');

    return await query;
  }

  static async getCount(filters = {}) {
    let query = db('vendors').count('id as count');

    if (filters.status) {
      query = query.where('status', filters.status);
    }

    if (filters.search) {
      query = query.where(function() {
        this.where('company_name', 'ilike', `%${filters.search}%`)
          .orWhere('contact_name', 'ilike', `%${filters.search}%`)
          .orWhere('email', 'ilike', `%${filters.search}%`);
      });
    }

    const result = await query.first();
    return parseInt(result.count);
  }

  static async approve(id, approvedBy) {
    return await this.update(id, {
      status: 'approved',
      approved_at: new Date(),
      approved_by: approvedBy
    });
  }

  static async reject(id, notes) {
    return await this.update(id, {
      status: 'rejected',
      notes
    });
  }

  static async suspend(id, notes) {
    return await this.update(id, {
      status: 'suspended',
      notes
    });
  }

  static async getVendorStats(vendorId) {
    const stats = await db.raw(`
      SELECT 
        (SELECT COUNT(*) FROM products WHERE vendor_id = ? AND status = 'approved') as approved_products,
        (SELECT COUNT(*) FROM products WHERE vendor_id = ? AND status = 'pending_review') as pending_products,
        (SELECT COUNT(*) FROM products WHERE vendor_id = ? AND status = 'draft') as draft_products,
        (SELECT COUNT(*) FROM products WHERE vendor_id = ? AND status = 'rejected') as rejected_products
    `, [vendorId, vendorId, vendorId, vendorId]);

    return stats.rows[0];
  }
}

module.exports = Vendor;