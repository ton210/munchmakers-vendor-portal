const SyncedProduct = require('../models/SyncedProduct');
const Store = require('../models/Store');
const Vendor = require('../models/Vendor');
const ActivityLogger = require('../services/activityLogger');
const db = require('../config/database');

class ProductSyncController {
  // Get synced products with filtering
  static async getSyncedProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        store_id,
        is_active,
        search,
        has_vendor
      } = req.query;

      const offset = (page - 1) * limit;

      const filters = { store_id, is_active, search, has_vendor };
      const pagination = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        sortBy: 'last_synced_at',
        sortOrder: 'desc'
      };

      const [products, totalCount] = await Promise.all([
        SyncedProduct.getAll(filters, pagination),
        SyncedProduct.getCount(filters)
      ]);

      res.json({
        success: true,
        data: {
          items: products,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            pages: Math.ceil(totalCount / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get synced products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get synced products',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Sync products from store
  static async syncStoreProducts(req, res) {
    try {
      const { store_id } = req.body;

      if (!store_id) {
        return res.status(400).json({
          success: false,
          message: 'Store ID is required'
        });
      }

      const result = await SyncedProduct.syncFromStore(store_id);

      // Log activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        'store_products_sync',
        'store',
        store_id,
        {
          synced_count: result.syncedCount,
          updated_count: result.updatedCount,
          total_products: result.totalProducts
        },
        req
      );

      res.json({
        success: true,
        message: `Synced ${result.syncedCount} new products, updated ${result.updatedCount} existing products`,
        data: result
      });

    } catch (error) {
      console.error('Sync store products error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to sync products',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Assign vendor to product
  static async assignVendorToProduct(req, res) {
    try {
      const { product_id, vendor_id, is_default = false, commission_rate } = req.body;

      const assignment = await SyncedProduct.assignVendor(
        product_id,
        vendor_id,
        is_default,
        commission_rate,
        req.user.id
      );

      // Log activity
      const vendor = await Vendor.findById(vendor_id);
      const product = await SyncedProduct.findById(product_id);

      await ActivityLogger.logAdminAction(
        req.user.id,
        'product_vendor_assignment',
        'synced_product',
        product_id,
        {
          vendor_id,
          vendor_name: vendor?.company_name,
          product_name: product?.name,
          is_default,
          commission_rate
        },
        req
      );

      res.status(201).json({
        success: true,
        message: 'Vendor assigned to product successfully',
        data: { assignment }
      });

    } catch (error) {
      console.error('Assign vendor to product error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to assign vendor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Remove vendor assignment from product
  static async removeVendorAssignment(req, res) {
    try {
      const { product_id, vendor_id } = req.body;

      await SyncedProduct.removeVendorAssignment(product_id, vendor_id);

      // Log activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        'product_vendor_assignment_removed',
        'synced_product',
        product_id,
        {
          vendor_id,
          removed_at: new Date()
        },
        req
      );

      res.json({
        success: true,
        message: 'Vendor assignment removed successfully'
      });

    } catch (error) {
      console.error('Remove vendor assignment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove vendor assignment',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get product vendor assignments
  static async getProductVendors(req, res) {
    try {
      const { product_id } = req.params;

      const vendors = await SyncedProduct.getProductVendors(product_id);

      res.json({
        success: true,
        data: { vendors }
      });

    } catch (error) {
      console.error('Get product vendors error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product vendors',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Bulk assign vendor to multiple products
  static async bulkAssignVendor(req, res) {
    try {
      const { product_ids, vendor_id, is_default = false, commission_rate } = req.body;

      if (!Array.isArray(product_ids) || product_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Product IDs array is required'
        });
      }

      const assignments = await SyncedProduct.bulkAssignVendor(
        product_ids,
        vendor_id,
        is_default,
        commission_rate,
        req.user.id
      );

      // Log activity
      const vendor = await Vendor.findById(vendor_id);
      await ActivityLogger.logAdminAction(
        req.user.id,
        'bulk_product_vendor_assignment',
        'synced_product',
        null,
        {
          vendor_id,
          vendor_name: vendor?.company_name,
          products_count: product_ids.length,
          is_default,
          commission_rate
        },
        req
      );

      res.status(201).json({
        success: true,
        message: `Vendor assigned to ${product_ids.length} products successfully`,
        data: { assignments }
      });

    } catch (error) {
      console.error('Bulk assign vendor error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk assign vendor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get unassigned products
  static async getUnassignedProducts(req, res) {
    try {
      const { store_id } = req.query;

      const products = await SyncedProduct.getUnassignedProducts(store_id);

      res.json({
        success: true,
        data: { products }
      });

    } catch (error) {
      console.error('Get unassigned products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get unassigned products',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get product sync statistics
  static async getProductSyncStats(req, res) {
    try {
      const { store_id } = req.query;

      const stats = await SyncedProduct.getProductStats(store_id);

      res.json({
        success: true,
        data: { stats }
      });

    } catch (error) {
      console.error('Get product sync stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product sync statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get or update product assignment settings
  static async getAssignmentSettings(req, res) {
    try {
      const settings = await db('product_assignment_settings')
        .select('setting_key', 'setting_value', 'description')
        .orderBy('setting_key');

      const settingsMap = {};
      settings.forEach(setting => {
        settingsMap[setting.setting_key] = setting.setting_value;
      });

      res.json({
        success: true,
        data: { settings: settingsMap }
      });

    } catch (error) {
      console.error('Get assignment settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get assignment settings',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async updateAssignmentSettings(req, res) {
    try {
      const { settings } = req.body;

      for (const [key, value] of Object.entries(settings)) {
        await db('product_assignment_settings')
          .insert({
            setting_key: key,
            setting_value: JSON.stringify(value),
            updated_by: req.user.id
          })
          .onConflict('setting_key')
          .merge({
            setting_value: JSON.stringify(value),
            updated_by: req.user.id,
            updated_at: new Date()
          });
      }

      // Log activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        'product_assignment_settings_updated',
        'system',
        null,
        { updated_settings: Object.keys(settings) },
        req
      );

      res.json({
        success: true,
        message: 'Assignment settings updated successfully'
      });

    } catch (error) {
      console.error('Update assignment settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update assignment settings',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = ProductSyncController;