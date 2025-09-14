const express = require('express');
const TrackingController = require('../controllers/trackingController');
const { anyAuth, adminAuth } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/security');

const router = express.Router();

// Apply rate limiting
router.use(generalLimiter);

// Add tracking number to order
router.post('/', anyAuth, TrackingController.addTracking);

// Update tracking status
router.put('/:id/status', anyAuth, TrackingController.updateTrackingStatus);

// Get tracking information for order
router.get('/order/:order_id', anyAuth, TrackingController.getOrderTracking);

// Get supported carriers
router.get('/carriers', anyAuth, TrackingController.getSupportedCarriers);

// Admin-only routes
router.post('/sync-all', adminAuth, TrackingController.syncAllTracking);

module.exports = router;