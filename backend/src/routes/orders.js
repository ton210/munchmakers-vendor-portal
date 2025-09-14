const express = require('express');
const OrderController = require('../controllers/orderController');
const { anyAuth, adminAuth, vendorAuth } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/security');

const router = express.Router();

// Apply rate limiting
router.use(generalLimiter);

// Get orders (with role-based filtering)
router.get('/', anyAuth, OrderController.getOrders);

// Get single order
router.get('/:id', anyAuth, OrderController.getOrder);

// Get order statistics
router.get('/stats/overview', anyAuth, OrderController.getOrderStats);

// Vendor-specific routes
router.get('/vendor/assignments', vendorAuth, OrderController.getVendorOrders);

// Admin-only routes
router.post('/:id/assign-vendor', adminAuth, OrderController.assignVendor);
router.put('/:id/status', anyAuth, OrderController.updateOrderStatus);
router.put('/assignments/:id/status', anyAuth, OrderController.updateAssignmentStatus);
router.post('/sync-store', adminAuth, OrderController.syncStoreOrders);

module.exports = router;