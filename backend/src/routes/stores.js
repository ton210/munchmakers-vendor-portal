const express = require('express');
const Store = require('../models/Store');
const { adminAuth } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/security');
const ActivityLogger = require('../services/activityLogger');

const router = express.Router();

// Apply rate limiting
router.use(generalLimiter);

// All store routes require admin authentication
router.use(adminAuth);

// Get all stores
router.get('/', async (req, res) => {
  try {
    const { type, is_active } = req.query;
    const filters = { type, is_active };
    const stores = await Store.getAll(filters);

    res.json({
      success: true,
      data: { stores }
    });

  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stores',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get single store with statistics
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const store = await Store.getWithStats(id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    res.json({
      success: true,
      data: { store }
    });

  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get store',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create new store
router.post('/', async (req, res) => {
  try {
    const storeData = req.body;

    // Test connection before creating
    const connectionTest = await Store.testConnection(storeData);
    if (!connectionTest.success) {
      return res.status(400).json({
        success: false,
        message: `Connection test failed: ${connectionTest.message}`
      });
    }

    const store = await Store.create(storeData);

    // Log activity
    await ActivityLogger.logAdminAction(
      req.user.id,
      'store_create',
      'store',
      store.id,
      {
        store_name: store.name,
        store_type: store.type,
        store_url: store.store_url
      },
      req
    );

    res.status(201).json({
      success: true,
      message: 'Store created successfully',
      data: { store }
    });

  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create store',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update store
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existingStore = await Store.findById(id);
    if (!existingStore) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    const store = await Store.update(id, updateData);

    // Log activity
    await ActivityLogger.logAdminAction(
      req.user.id,
      'store_update',
      'store',
      id,
      {
        store_name: store.name,
        updated_fields: Object.keys(updateData)
      },
      req
    );

    res.json({
      success: true,
      message: 'Store updated successfully',
      data: { store }
    });

  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update store',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete store
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const store = await Store.findById(id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    await Store.delete(id);

    // Log activity
    await ActivityLogger.logAdminAction(
      req.user.id,
      'store_delete',
      'store',
      id,
      {
        store_name: store.name,
        store_type: store.type
      },
      req
    );

    res.json({
      success: true,
      message: 'Store deleted successfully'
    });

  } catch (error) {
    console.error('Delete store error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete store',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Test store connection
router.post('/:id/test-connection', async (req, res) => {
  try {
    const { id } = req.params;
    const store = await Store.findById(id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    const result = await Store.testConnection(store);

    res.json({
      success: result.success,
      message: result.message,
      data: result
    });

  } catch (error) {
    console.error('Test store connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test store connection',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Sync orders from store
router.post('/:id/sync', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Order.syncFromStore(id);

    res.json({
      success: true,
      message: `Synced ${result.syncedCount} new orders`,
      data: result
    });

  } catch (error) {
    console.error('Sync store orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync orders',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;