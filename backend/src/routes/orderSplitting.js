const express = require('express');
const OrderSplittingController = require('../controllers/orderSplittingController');
const { adminAuth, anyAuth } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/security');

const router = express.Router();

// Apply rate limiting
router.use(generalLimiter);

// Create partial vendor assignment (admin only)
router.post('/assign-partial', adminAuth, OrderSplittingController.createPartialAssignment);

// Get order splitting details
router.get('/order/:order_id', anyAuth, OrderSplittingController.getOrderSplitting);

// Remove item assignment (admin only)
router.delete('/item-assignment/:id', adminAuth, OrderSplittingController.removeItemAssignment);

// Get splitting analytics (admin only)
router.get('/analytics', adminAuth, OrderSplittingController.getSplittingAnalytics);

module.exports = router;