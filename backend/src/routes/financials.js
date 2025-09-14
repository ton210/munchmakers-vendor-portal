const express = require('express');
const router = express.Router();
const { vendorAuth, adminAuth, vendorOwnershipOrAdmin } = require('../middleware/auth');
const VendorFinancial = require('../models/VendorFinancial');
const rateLimit = require('express-rate-limit');

// Rate limiting
const financialLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Get vendor financial summary
router.get('/summary/:vendorId', financialLimit, vendorOwnershipOrAdmin, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const summary = await VendorFinancial.getVendorSummary(vendorId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial summary',
      error: error.message
    });
  }
});

// Get vendor transactions
router.get('/transactions/:vendorId', financialLimit, vendorOwnershipOrAdmin, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const {
      transactionType,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const filters = {
      transactionType,
      status,
      startDate,
      endDate
    };

    const transactions = await VendorFinancial.findByVendor(vendorId, filters);

    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedTransactions = transactions.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: transactions.length,
          pages: Math.ceil(transactions.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// Get recent transactions for quick view
router.get('/recent/:vendorId', financialLimit, vendorOwnershipOrAdmin, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { limit = 10 } = req.query;

    const transactions = await VendorFinancial.getRecentTransactions(vendorId, parseInt(limit));

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent transactions',
      error: error.message
    });
  }
});

// Admin only: Create financial transaction
router.post('/transactions', adminAuth, async (req, res) => {
  try {
    const {
      vendorId,
      transactionType,
      referenceId,
      amount,
      currency,
      description,
      status,
      transactionDate,
      payoutDate,
      payoutMethod,
      metadata
    } = req.body;

    const transaction = await VendorFinancial.createTransaction({
      vendorId,
      transactionType,
      referenceId,
      amount,
      currency,
      description,
      status,
      transactionDate,
      payoutDate,
      payoutMethod,
      metadata
    });

    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Transaction created successfully'
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: error.message
    });
  }
});

// Admin only: Update transaction
router.put('/transactions/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const transaction = await VendorFinancial.update(id, {
      ...updateData,
      updated_at: new Date()
    });

    res.json({
      success: true,
      data: transaction,
      message: 'Transaction updated successfully'
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update transaction',
      error: error.message
    });
  }
});

module.exports = router;