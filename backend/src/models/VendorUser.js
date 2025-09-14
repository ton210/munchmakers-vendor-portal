const db = require('../config/database');
const bcrypt = require('bcryptjs');

class VendorUser {
  static async create(userData) {
    if (userData.password) {
      userData.password_hash = await bcrypt.hash(userData.password, 10);
      delete userData.password;
    }

    const [user] = await db('vendor_users').insert(userData).returning('*');
    delete user.password_hash;
    return user;
  }

  static async findById(id) {
    const user = await db('vendor_users').where({ id }).first();
    if (user) {
      delete user.password_hash;
    }
    return user;
  }

  static async findByEmail(email) {
    return await db('vendor_users').where({ email }).first();
  }

  static async findByEmailWithPassword(email) {
    return await db('vendor_users').where({ email, is_active: true }).first();
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
    const [user] = await db('vendor_users')
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

  static async getByVendor(vendorId) {
    const users = await db('vendor_users')
      .where({ vendor_id: vendorId })
      .select('id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'last_login', 'created_at');
    
    return users;
  }

  static async deactivate(id) {
    return await this.update(id, { is_active: false });
  }

  static async activate(id) {
    return await this.update(id, { is_active: true });
  }

  static async setResetToken(email, token) {
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hour expiry

    return await db('vendor_users')
      .where({ email })
      .update({
        reset_token: token,
        reset_token_expires: expires,
        updated_at: new Date()
      });
  }

  static async findByResetToken(token) {
    return await db('vendor_users')
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

  static async getUserWithVendor(id) {
    const user = await db('vendor_users')
      .join('vendors', 'vendor_users.vendor_id', 'vendors.id')
      .where('vendor_users.id', id)
      .select(
        'vendor_users.id',
        'vendor_users.email',
        'vendor_users.first_name',
        'vendor_users.last_name',
        'vendor_users.role',
        'vendor_users.vendor_id',
        'vendor_users.is_active',
        'vendors.company_name',
        'vendors.status as vendor_status'
      )
      .first();

    return user;
  }
}

module.exports = VendorUser;