const express = require('express');
const ProductSyncController = require('../controllers/productSyncController');
const { adminAuth, anyAuth } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/security');

const router = express.Router();

// Apply rate limiting
router.use(generalLimiter);

// Get synced products (admin and vendors can view)
router.get('/products', anyAuth, ProductSyncController.getSyncedProducts);

// Get product sync statistics
router.get('/stats', anyAuth, ProductSyncController.getProductSyncStats);

// Get unassigned products
router.get('/unassigned', adminAuth, ProductSyncController.getUnassignedProducts);

// Get vendor assignments for product
router.get('/products/:product_id/vendors', anyAuth, ProductSyncController.getProductVendors);

// Admin-only product management routes
router.post('/sync-products', adminAuth, ProductSyncController.syncStoreProducts);
router.post('/assign-vendor', adminAuth, ProductSyncController.assignVendorToProduct);
router.delete('/remove-assignment', adminAuth, ProductSyncController.removeVendorAssignment);
router.post('/bulk-assign', adminAuth, ProductSyncController.bulkAssignVendor);

// Assignment settings
router.get('/settings', adminAuth, ProductSyncController.getAssignmentSettings);
router.put('/settings', adminAuth, ProductSyncController.updateAssignmentSettings);

module.exports = router;