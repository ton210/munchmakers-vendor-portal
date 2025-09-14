const express = require('express');
const CategoryController = require('../controllers/categoryController');
const { anyAuth, adminAuth } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/security');
const { validateId } = require('../middleware/validation');

const router = express.Router();

// Apply general rate limiting
router.use(generalLimiter);

// Public category routes (no auth required for viewing)
router.get('/', CategoryController.getAllCategories);
router.get('/tree', CategoryController.getCategoryTree);
router.get('/popular', CategoryController.getPopularCategories);
router.get('/:id', validateId, CategoryController.getCategory);
router.get('/:id/products', validateId, CategoryController.getCategoryProducts);

// Authenticated routes
router.get('/:id/stats', anyAuth, validateId, CategoryController.getCategoryStats);

// Admin-only routes
router.post('/', adminAuth, CategoryController.createCategory);
router.put('/:id', adminAuth, validateId, CategoryController.updateCategory);
router.delete('/:id', adminAuth, validateId, CategoryController.deleteCategory);
router.post('/reorder', adminAuth, CategoryController.reorderCategories);

module.exports = router;