const express = require('express');
const AdminController = require('../controllers/adminController');
const { adminAuth, adminPermission } = require('../middleware/auth');
const { strictLimiter } = require('../middleware/security');
const { 
  validateId, 
  validatePagination,
  validateUserRegistration 
} = require('../middleware/validation');

const router = express.Router();

// Apply admin authentication to all routes
router.use(adminAuth);

// Apply strict rate limiting only to sensitive admin routes
// Note: Categories API needs higher limits for BigCommerce sync operations

// Dashboard and Statistics
router.get('/dashboard/stats', AdminController.getDashboardStats);
router.get('/reports/vendors', AdminController.getVendorReport);
router.get('/reports/products', AdminController.getProductReport);

// Vendor Management
router.get('/vendors', validatePagination, AdminController.getAllVendors);
router.get('/vendors/:id', validateId, AdminController.getVendor);
router.put('/vendors/:id', validateId, AdminController.updateVendor);
router.post('/vendors/:id/approve', validateId, AdminController.approveVendor);
router.post('/vendors/:id/reject', validateId, AdminController.rejectVendor);
router.post('/vendors/:id/suspend', validateId, AdminController.suspendVendor);

// Product Management
router.get('/products', validatePagination, AdminController.getAllProducts);
router.get('/products/:id', validateId, AdminController.getProduct);
router.post('/products/:id/approve', validateId, AdminController.approveProduct);
router.post('/products/:id/reject', validateId, AdminController.rejectProduct);
router.post('/products/bulk-approve', AdminController.bulkApproveProducts);
router.post('/products/bulk-reject', AdminController.bulkRejectProducts);
router.get('/products/review-queue', validatePagination, AdminController.getProductReviewQueue);

// Category Management
router.get('/categories', AdminController.getCategories);
router.post('/categories', AdminController.createCategory);
router.put('/categories/:id', validateId, AdminController.updateCategory);
router.delete('/categories/:id', validateId, AdminController.deleteCategory);
router.post('/categories/sync-bigcommerce', AdminController.syncCategoriesWithBigCommerce);
router.post('/categories/reset', strictLimiter, AdminController.resetCategories);

// BigCommerce Integration
router.post('/bigcommerce/sync-all', AdminController.syncAllWithBigCommerce);
router.get('/bigcommerce/status', AdminController.getBigCommerceStatus);
router.post('/bigcommerce/test-connection', AdminController.testBigCommerceConnection);

// Analytics and Reports
router.get('/analytics', AdminController.getAnalytics);
router.get('/vendors/:id/analytics', validateId, AdminController.getVendorAnalytics);

// Activity Logs
router.get('/activity-logs', validatePagination, AdminController.getActivityLogs);

// Admin User Management (super admin only) - Apply strict limiting to user management
router.get('/users', 
  adminPermission('manage_admins'),
  strictLimiter,
  AdminController.getAllAdminUsers
);

router.post('/users', 
  adminPermission('manage_admins'),
  strictLimiter,
  validateUserRegistration,
  AdminController.createAdminUser
);

router.put('/users/:id', 
  adminPermission('manage_admins'),
  strictLimiter,
  validateId,
  AdminController.updateAdminUser
);

module.exports = router;