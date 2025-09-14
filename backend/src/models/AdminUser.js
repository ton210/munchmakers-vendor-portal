const db = require('../config/database');
const bcrypt = require('bcryptjs');

class AdminUser {
  static async create(userData) {
    if (userData.password) {
      userData.password_hash = await bcrypt.hash(userData.password, 10);
      delete userData.password;
    }

    const [user] = await db('admin_users').insert(userData).returning('*');
    delete user.password_hash;
    return user;
  }

  static async findById(id) {
    const user = await db('admin_users').where({ id }).first();
    if (user) {
      delete user.password_hash;
    }
    return user;
  }

  static async findByEmail(email) {
    return await db('admin_users').where({ email }).first();
  }

  static async findByEmailWithPassword(email) {
    return await db('admin_users').where({ email, is_active: true }).first();
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async update(id, updateData) {
    if (updateData.password) {
      updateData.password_hash = await bcrypt.hash(updateData.password, 10);
      delete updateData.password;
    }

    updateData.updated_at = new Date();
    const [user] = await db('admin_users')
      .where({ id })
      .update(updateData)
      .returning('*');
    
    if (user) {
      delete user.password_hash;
    }
    return user;
  }

  static async updateLastLogin(id) {
    return await this.update(id, { last_login: new Date() });
  }

  static async getAll(filters = {}) {
    let query = db('admin_users').select(
      'id', 'email', 'first_name', 'last_name', 'role', 
      'permissions', 'is_active', 'last_login', 'created_at'
    );

    if (filters.role) {
      query = query.where('role', filters.role);
    }

    if (filters.is_active !== undefined) {
      query = query.where('is_active', filters.is_active);
    }

    return await query.orderBy('created_at', 'desc');
  }

  static async setResetToken(email, token) {
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hour expiry

    return await db('admin_users')
      .where({ email })
      .update({
        reset_token: token,
        reset_token_expires: expires,
        updated_at: new Date()
      });
  }

  static async findByResetToken(token) {
    return await db('admin_users')
      .where({ reset_token: token })
      .where('reset_token_expires', '>', new Date())
      .first();
  }

  static async clearResetToken(id) {
    return await this.update(id, {
      reset_token: null,
      reset_token_expires: null
    });
  }

  static async hasPermission(userId, permission) {
    const user = await this.findById(userId);
    if (!user || !user.permissions) return false;

    const permissions = Array.isArray(user.permissions) ? user.permissions : [];
    return permissions.includes(permission) || user.role === 'super_admin';
  }

  static async getDashboardStats() {
    const stats = await db.raw(`
      SELECT 
        (SELECT COUNT(*) FROM vendors WHERE status = 'pending') as pending_vendors,
        (SELECT COUNT(*) FROM products WHERE status = 'pending_review') as pending_products,
        (SELECT COUNT(*) FROM vendors WHERE status = 'approved') as approved_vendors,
        (SELECT COUNT(*) FROM products WHERE status = 'approved') as approved_products,
        (SELECT COUNT(*) FROM admin_users WHERE is_active = true) as active_admins
    `);

    return stats.rows[0];
  }
}

module.exports = AdminUser;