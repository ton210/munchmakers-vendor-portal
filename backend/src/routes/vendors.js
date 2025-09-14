const express = require('express');
const multer = require('multer');
const VendorController = require('../controllers/vendorController');
const { vendorAuth, adminAuth, vendorOwnershipOrAdmin } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/security');
const { validateId } = require('../middleware/validation');

const router = express.Router();

// Configure multer for document uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB for documents
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, and Word documents are allowed.'), false);
    }
  }
});

// Apply general rate limiting
router.use(generalLimiter);

// Vendor profile operations
router.get('/profile', vendorAuth, VendorController.getVendorProfile);
router.put('/profile', vendorAuth, VendorController.updateVendorProfile);

// Vendor dashboard
router.get('/dashboard/stats', vendorAuth, VendorController.getDashboardStats);
router.get('/dashboard', vendorAuth, VendorController.getVendorDashboard);

// BigCommerce Integration for vendors
router.post('/sync/bigcommerce', vendorAuth, VendorController.syncWithBigCommerce);
router.get('/bigcommerce/status', vendorAuth, VendorController.getBigCommerceStatus);

// Order management for vendors
router.get('/orders', vendorAuth, VendorController.getOrders);
router.get('/orders/:id', vendorAuth, VendorController.getOrder);
router.put('/orders/:id/status', vendorAuth, VendorController.updateOrderStatus);

// Vendor users management
router.get('/:vendorId/users', vendorOwnershipOrAdmin, validateId, VendorController.getVendorUsers);
router.post('/:vendorId/users', vendorOwnershipOrAdmin, validateId, VendorController.createVendorUser);
router.put('/:vendorId/users/:userId', vendorOwnershipOrAdmin, validateId, VendorController.updateVendorUser);
router.delete('/:vendorId/users/:userId', vendorOwnershipOrAdmin, validateId, VendorController.deleteVendorUser);

// Document management
router.get('/:vendorId/documents', vendorOwnershipOrAdmin, validateId, VendorController.getVendorDocuments);
router.post('/:vendorId/documents', 
  vendorOwnershipOrAdmin, 
  validateId,
  upload.array('documents', 5),
  VendorController.uploadVendorDocuments
);
router.delete('/:vendorId/documents/:documentId', 
  vendorOwnershipOrAdmin, 
  validateId,
  VendorController.deleteVendorDocument
);

// Vendor statistics and analytics
router.get('/:vendorId/analytics', vendorOwnershipOrAdmin, validateId, VendorController.getVendorAnalytics);

module.exports = router;