const express = require('express');
const OrderMonitoringController = require('../controllers/orderMonitoringController');
const { anyAuth, adminAuth } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/security');

const router = express.Router();

// Apply rate limiting
router.use(generalLimiter);

// Get vendor alerts
router.get('/vendor/:vendor_id/alerts', anyAuth, OrderMonitoringController.getVendorAlerts);

// Get admin alerts
router.get('/admin/alerts', adminAuth, OrderMonitoringController.getAdminAlerts);

// Mark alert as read
router.put('/alerts/:id/read', anyAuth, OrderMonitoringController.markAlertAsRead);

// Admin-only monitoring operations
router.post('/check', adminAuth, OrderMonitoringController.runOrderCheck);
router.get('/stats', adminAuth, OrderMonitoringController.getMonitoringStats);
router.put('/thresholds', adminAuth, OrderMonitoringController.updateThresholds);

module.exports = router;