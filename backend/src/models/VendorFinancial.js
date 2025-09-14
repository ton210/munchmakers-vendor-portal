const BaseModel = require('./BaseModel');

class VendorFinancial extends BaseModel {
  static get tableName() {
    return 'vendor_financials';
  }

  static async findByVendor(vendorId, filters = {}) {
    const query = this.knex().where('vendor_id', vendorId);

    if (filters.transactionType) {
      query.where('transaction_type', filters.transactionType);
    }

    if (filters.status) {
      query.where('status', filters.status);
    }

    if (filters.startDate) {
      query.where('transaction_date', '>=', filters.startDate);
    }

    if (filters.endDate) {
      query.where('transaction_date', '<=', filters.endDate);
    }

    return query.orderBy('transaction_date', 'desc');
  }

  static async getVendorSummary(vendorId) {
    const summary = await this.knex()
      .select(
        this.knex().raw("transaction_type"),
        this.knex().raw("SUM(amount) as total_amount"),
        this.knex().raw("COUNT(*) as transaction_count")
      )
      .where('vendor_id', vendorId)
      .where('status', 'completed')
      .groupBy('transaction_type');

    const pendingPayouts = await this.knex()
      .sum('amount as total_pending')
      .where('vendor_id', vendorId)
      .where('transaction_type', 'sale')
      .where('status', 'completed')
      .whereNull('payout_date')
      .first();

    const lastPayout = await this.knex()
      .where('vendor_id', vendorId)
      .where('transaction_type', 'payout')
      .where('status', 'completed')
      .orderBy('transaction_date', 'desc')
      .first();

    return {
      summary: summary.reduce((acc, item) => {
        acc[item.transaction_type] = {
          total: parseFloat(item.total_amount) || 0,
          count: parseInt(item.transaction_count) || 0
        };
        return acc;
      }, {}),
      pending_payout: parseFloat(pendingPayouts?.total_pending) || 0,
      last_payout_date: lastPayout?.transaction_date || null,
      last_payout_amount: parseFloat(lastPayout?.amount) || 0
    };
  }

  static async createTransaction(data) {
    return this.create({
      vendor_id: data.vendorId,
      transaction_type: data.transactionType,
      reference_id: data.referenceId,
      amount: data.amount,
      currency: data.currency || 'USD',
      description: data.description,
      status: data.status || 'pending',
      transaction_date: data.transactionDate || new Date(),
      payout_date: data.payoutDate,
      payout_method: data.payoutMethod,
      metadata: data.metadata
    });
  }

  static async getRecentTransactions(vendorId, limit = 10) {
    return this.knex()
      .where('vendor_id', vendorId)
      .orderBy('created_at', 'desc')
      .limit(limit);
  }
}

module.exports = VendorFinancial;