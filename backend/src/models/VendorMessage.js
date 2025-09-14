const BaseModel = require('./BaseModel');

class VendorMessage extends BaseModel {
  static get tableName() {
    return 'vendor_messages';
  }

  static async findByVendor(vendorId, filters = {}) {
    const query = this.knex()
      .select('vendor_messages.*', 'admin_users.first_name as admin_first_name', 'admin_users.last_name as admin_last_name')
      .leftJoin('admin_users', 'vendor_messages.sender_id', 'admin_users.id')
      .where('vendor_messages.vendor_id', vendorId);

    if (filters.status) {
      query.where('vendor_messages.status', filters.status);
    }

    if (filters.threadId) {
      query.where('vendor_messages.thread_id', filters.threadId);
    }

    return query.orderBy('vendor_messages.created_at', 'desc');
  }

  static async getUnreadCount(vendorId) {
    return this.knex()
      .where('vendor_id', vendorId)
      .where('sender_type', 'admin')
      .whereNull('read_at')
      .count('id as count')
      .first()
      .then(result => parseInt(result.count) || 0);
  }

  static async getActiveThreads(vendorId) {
    return this.knex()
      .select(
        'thread_id',
        this.knex().raw('MAX(created_at) as last_message_at'),
        this.knex().raw('COUNT(*) as message_count'),
        this.knex().raw('MAX(CASE WHEN sender_type = ? THEN subject END) as subject', ['vendor']),
        this.knex().raw('MAX(status) as status')
      )
      .where('vendor_id', vendorId)
      .whereNotNull('thread_id')
      .groupBy('thread_id')
      .orderBy('last_message_at', 'desc');
  }

  static async createMessage(data) {
    // Generate thread ID if this is a new conversation
    let threadId = data.threadId;
    if (!threadId && data.senderType === 'vendor') {
      const lastThread = await this.knex()
        .max('thread_id as max_thread')
        .where('vendor_id', data.vendorId)
        .first();

      threadId = (lastThread?.max_thread || 0) + 1;
    }

    const messageData = {
      vendor_id: data.vendorId,
      sender_id: data.senderId,
      sender_type: data.senderType,
      subject: data.subject,
      message: data.message,
      priority: data.priority || 'normal',
      status: data.status || 'open',
      thread_id: threadId,
      is_internal: data.isInternal || false,
      attachments: data.attachments
    };

    return this.create(messageData);
  }

  static async markAsRead(messageId, adminId) {
    return this.update(messageId, {
      read_at: new Date(),
      read_by: adminId
    });
  }

  static async updateStatus(messageId, status) {
    return this.update(messageId, { status });
  }

  static async getAdminMessages(filters = {}) {
    const query = this.knex()
      .select(
        'vendor_messages.*',
        'vendors.business_name',
        'vendors.contact_email',
        'admin_users.first_name as admin_first_name',
        'admin_users.last_name as admin_last_name'
      )
      .leftJoin('vendors', 'vendor_messages.vendor_id', 'vendors.id')
      .leftJoin('admin_users', 'vendor_messages.sender_id', 'admin_users.id');

    if (filters.status) {
      query.where('vendor_messages.status', filters.status);
    }

    if (filters.priority) {
      query.where('vendor_messages.priority', filters.priority);
    }

    if (filters.unreadOnly) {
      query.whereNull('vendor_messages.read_at');
    }

    if (filters.vendorId) {
      query.where('vendor_messages.vendor_id', filters.vendorId);
    }

    return query.orderBy('vendor_messages.created_at', 'desc');
  }
}

module.exports = VendorMessage;