const db = require('../config/database');

class VendorFinancial {

  static async findByVendor(vendorId, filters = {}) {
    const query = db('vendor_financials').where('vendor_id', vendorId);

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
    const summary = await db('vendor_financials')
      .select(
        db.raw("transaction_type"),
        db.raw("SUM(amount) as total_amount"),
        db.raw("COUNT(*) as transaction_count")
      )
      .where('vendor_id', vendorId)
      .where('status', 'completed')
      .groupBy('transaction_type');

    const pendingPayouts = await db('vendor_financials')
      .sum('amount as total_pending')
      .where('vendor_id', vendorId)
      .where('transaction_type', 'sale')
      .where('status', 'completed')
      .whereNull('payout_date')
      .first();

    const lastPayout = await db('vendor_financials')
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
    const [transaction] = await db('vendor_financials').insert({
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
    }).returning('*');
    return transaction;
  }

  static async getRecentTransactions(vendorId, limit = 10) {
    return db('vendor_financials')
      .where('vendor_id', vendorId)
      .orderBy('created_at', 'desc')
      .limit(limit);
  }
}

module.exports = VendorFinancial;