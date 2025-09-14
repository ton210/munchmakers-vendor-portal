const express = require('express');
const ZakekeController = require('../controllers/zakekeController');
const { anyAuth, adminAuth } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/security');

const router = express.Router();

// Apply rate limiting
router.use(generalLimiter);

// Create Zakeke order (admin only)
router.post('/orders', adminAuth, ZakekeController.createZakekeOrder);

// Get Zakeke orders
router.get('/orders', anyAuth, ZakekeController.getZakekeOrders);

// Sync Zakeke order status
router.post('/orders/:order_id/sync', anyAuth, ZakekeController.syncZakekeOrder);

// Download design files
router.get('/orders/:order_id/design-files', anyAuth, ZakekeController.downloadDesignFiles);

// Update Zakeke status manually
router.put('/orders/:id/status', anyAuth, ZakekeController.updateZakekeStatus);

module.exports = router;