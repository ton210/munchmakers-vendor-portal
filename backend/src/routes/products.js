const express = require('express');
const multer = require('multer');
const ProductController = require('../controllers/productController');
const ProductImageController = require('../controllers/productImageController');
const { vendorAuth, adminAuth, anyAuth, approvedVendorAuth, vendorOwnershipOrAdmin } = require('../middleware/auth');
const { generalLimiter, strictLimiter } = require('../middleware/security');
const { 
  validateProduct, 
  validateId, 
  validatePagination 
} = require('../middleware/validation');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'csv') {
      // CSV files for bulk import
      if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
        cb(null, true);
      } else {
        cb(new Error('Only CSV files are allowed for bulk import'), false);
      }
    } else {
      // Image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    }
  }
});

// Apply general rate limiting to all routes
router.use(generalLimiter);

// Product CRUD operations
router.get('/', anyAuth, validatePagination, ProductController.getAllProducts);
router.get('/stats', anyAuth, ProductController.getProductStats);
router.get('/search', anyAuth, ProductController.searchProducts);
router.get('/vendor/:vendorId', vendorOwnershipOrAdmin, validateId, validatePagination, ProductController.getVendorProducts);
router.get('/:id', anyAuth, validateId, ProductController.getProduct);

router.post('/', approvedVendorAuth, validateProduct, ProductController.createProduct);
router.put('/:id', anyAuth, validateId, validateProduct, ProductController.updateProduct);
router.delete('/:id', anyAuth, validateId, ProductController.deleteProduct);

// Product workflow operations
router.post('/:id/submit', vendorAuth, validateId, ProductController.submitProduct);
router.post('/:id/approve', adminAuth, validateId, ProductController.approveProduct);
router.post('/:id/reject', adminAuth, validateId, ProductController.rejectProduct);

// Bulk operations (admin only)
router.post('/bulk/update', adminAuth, strictLimiter, ProductController.bulkUpdateProducts);

// CSV import/export
router.post('/import/csv', 
  approvedVendorAuth, 
  strictLimiter,
  upload.single('csv'), 
  ProductController.importProductsCSV
);

router.get('/export/csv', anyAuth, ProductController.exportProductsCSV);

// Product Images
router.get('/:id/images', anyAuth, validateId, ProductImageController.getProductImages);
router.post('/:id/images', 
  approvedVendorAuth, 
  validateId,
  upload.array('images', 10), 
  ProductImageController.uploadProductImages
);
router.put('/images/:imageId', 
  anyAuth, 
  validateId,
  ProductImageController.updateProductImage
);
router.delete('/images/:imageId', 
  anyAuth, 
  validateId,
  ProductImageController.deleteProductImage
);
router.post('/:id/images/reorder', 
  anyAuth, 
  validateId,
  ProductImageController.reorderProductImages
);

// Bulk Product Upload
router.post('/bulk-upload', 
  approvedVendorAuth,
  upload.single('csvFile'),
  ProductController.bulkUploadProducts
);

module.exports = router;