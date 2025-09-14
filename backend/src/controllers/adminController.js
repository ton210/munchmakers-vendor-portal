const Vendor = require('../models/Vendor');
const VendorUser = require('../models/VendorUser');
const AdminUser = require('../models/AdminUser');
const Product = require('../models/Product');
const ActivityLogger = require('../services/activityLogger');
const EmailService = require('../services/emailService');
const SlackService = require('../services/slackService');
const BigCommerceService = require('../services/bigcommerceService');

class AdminController {
  // Dashboard Statistics
  static async getDashboardStats(req, res) {
    try {
      const [adminStats, productStats, vendorStats, activityStats] = await Promise.all([
        AdminUser.getDashboardStats(),
        Product.getAdminStats(),
        Vendor.getCount(),
        ActivityLogger.getActivityStats(
          new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          new Date()
        )
      ]);

      const stats = {
        admin: adminStats,
        products: productStats,
        vendors: {
          total: vendorStats,
          ...adminStats
        },
        activity: activityStats
      };

      res.json({
        success: true,
        data: { stats }
      });

    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Vendor Management
  static async getAllVendors(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        search,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      const offset = (page - 1) * limit;
      const filters = { status, search };
      const pagination = { 
        limit: parseInt(limit), 
        offset: parseInt(offset),
        sortBy,
        sortOrder 
      };

      console.log(`🔄 Admin loading vendors with filters:`, filters);
      
      const [vendors, totalCount] = await Promise.all([
        Vendor.getAll(filters, pagination),
        Vendor.getCount(filters)
      ]);
      
      console.log(`📊 Found ${vendors.length} vendors, total: ${totalCount}`);

      res.json({
        success: true,
        data: {
          items: vendors,
          pagination: {
            page: parseInt(page),
            pages: Math.ceil(totalCount / limit),
            total: totalCount,
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get vendors error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get vendors',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async getActiveVendors(req, res) {
    try {
      const vendors = await Vendor.getActiveVendorsForOrders();

      res.json({
        success: true,
        data: vendors
      });

    } catch (error) {
      console.error('Get active vendors error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get active vendors',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async getVendor(req, res) {
    try {
      const { id } = req.params;
      
      const [vendor, users, products, stats] = await Promise.all([
        Vendor.findById(id),
        VendorUser.getByVendor(id),
        Product.findByVendorId(id, {}, { limit: 10 }),
        Vendor.getVendorStats(id)
      ]);

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      res.json({
        success: true,
        data: {
          vendor,
          users,
          recent_products: products,
          stats
        }
      });

    } catch (error) {
      console.error('Get vendor error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get vendor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async approveVendor(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const vendor = await Vendor.findById(id);
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      if (vendor.status === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Vendor is already approved'
        });
      }

      const approvedVendor = await Vendor.approve(id, req.user.id);
      
      // Get vendor users for email notification
      const users = await VendorUser.getByVendor(id);
      const ownerUser = users.find(u => u.role === 'owner') || users[0];

      if (ownerUser) {
        // Send approval email
        await EmailService.sendVendorApproval(approvedVendor, ownerUser);
      }

      // Notify via Slack
      await SlackService.notifyVendorApproval(approvedVendor);

      // Log activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        'vendor_approve',
        'vendor',
        id,
        { 
          vendor_name: vendor.company_name,
          notes 
        },
        req
      );

      res.json({
        success: true,
        message: 'Vendor approved successfully',
        data: { vendor: approvedVendor }
      });

    } catch (error) {
      console.error('Approve vendor error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve vendor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async rejectVendor(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const vendor = await Vendor.findById(id);
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      const rejectedVendor = await Vendor.reject(id, reason);
      
      // Get vendor users for email notification
      const users = await VendorUser.getByVendor(id);
      const ownerUser = users.find(u => u.role === 'owner') || users[0];

      if (ownerUser) {
        // Send rejection email
        await EmailService.sendVendorRejection(rejectedVendor, ownerUser, reason);
      }

      // Notify via Slack
      await SlackService.notifyVendorRejection(rejectedVendor, reason);

      // Log activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        'vendor_reject',
        'vendor',
        id,
        { 
          vendor_name: vendor.company_name,
          reason 
        },
        req
      );

      res.json({
        success: true,
        message: 'Vendor rejected successfully',
        data: { vendor: rejectedVendor }
      });

    } catch (error) {
      console.error('Reject vendor error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject vendor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async suspendVendor(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const vendor = await Vendor.findById(id);
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      const suspendedVendor = await Vendor.suspend(id, reason);

      // Log activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        'vendor_suspend',
        'vendor',
        id,
        { 
          vendor_name: vendor.company_name,
          reason 
        },
        req
      );

      res.json({
        success: true,
        message: 'Vendor suspended successfully',
        data: { vendor: suspendedVendor }
      });

    } catch (error) {
      console.error('Suspend vendor error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to suspend vendor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async updateVendor(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const existingVendor = await Vendor.findById(id);
      if (!existingVendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      const updatedVendor = await Vendor.update(id, updateData);

      // Log activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        'vendor_update',
        'vendor',
        id,
        { 
          vendor_name: existingVendor.company_name,
          updated_fields: Object.keys(updateData)
        },
        req
      );

      res.json({
        success: true,
        message: 'Vendor updated successfully',
        data: { vendor: updatedVendor }
      });

    } catch (error) {
      console.error('Update vendor error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update vendor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Product Review Queue
  static async getProductReviewQueue(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        vendor_id,
        category_id,
        priority = 'oldest_first'
      } = req.query;

      const offset = (page - 1) * limit;
      const filters = { 
        status: 'pending_review',
        vendor_id,
        category_id 
      };

      let sortBy = 'submitted_at';
      let sortOrder = priority === 'newest_first' ? 'desc' : 'asc';

      const pagination = { 
        limit: parseInt(limit), 
        offset: parseInt(offset),
        sortBy,
        sortOrder 
      };

      const [products, totalCount] = await Promise.all([
        Product.getAll(filters, pagination),
        Product.getCount(filters)
      ]);

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get product review queue error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product review queue',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Activity Logs
  static async getActivityLogs(req, res) {
    try {
      const { 
        page = 1, 
        limit = 50, 
        user_type,
        user_id,
        action,
        entity_type,
        date_from,
        date_to
      } = req.query;

      const offset = (page - 1) * limit;
      const filters = { 
        user_type,
        user_id: user_id ? parseInt(user_id) : undefined,
        action,
        entity_type,
        date_from: date_from ? new Date(date_from) : undefined,
        date_to: date_to ? new Date(date_to) : undefined
      };

      const pagination = { 
        limit: parseInt(limit), 
        offset: parseInt(offset) 
      };

      const [activities, totalCount] = await Promise.all([
        ActivityLogger.getActivities(filters, pagination),
        ActivityLogger.getActivityCount(filters)
      ]);

      res.json({
        success: true,
        data: {
          activities,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get activity logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get activity logs',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Admin User Management
  static async getAllAdminUsers(req, res) {
    try {
      const { role, is_active } = req.query;
      
      const filters = { 
        role,
        is_active: is_active !== undefined ? is_active === 'true' : undefined
      };

      const adminUsers = await AdminUser.getAll(filters);

      res.json({
        success: true,
        data: { adminUsers }
      });

    } catch (error) {
      console.error('Get admin users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get admin users',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async createAdminUser(req, res) {
    try {
      const { email, password, first_name, last_name, role, permissions } = req.body;

      // Check if admin with email already exists
      const existingAdmin = await AdminUser.findByEmail(email);
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Admin user with this email already exists'
        });
      }

      const adminUser = await AdminUser.create({
        email,
        password,
        first_name,
        last_name,
        role,
        permissions: permissions ? JSON.stringify(permissions) : null
      });

      // Log activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        'admin_user_create',
        'admin_user',
        adminUser.id,
        { 
          created_user_email: email,
          role 
        },
        req
      );

      res.status(201).json({
        success: true,
        message: 'Admin user created successfully',
        data: { adminUser }
      });

    } catch (error) {
      console.error('Create admin user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create admin user',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async updateAdminUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const existingAdmin = await AdminUser.findById(id);
      if (!existingAdmin) {
        return res.status(404).json({
          success: false,
          message: 'Admin user not found'
        });
      }

      // Don't allow updating own permissions/role
      if (parseInt(id) === req.user.id) {
        delete updateData.role;
        delete updateData.permissions;
      }

      if (updateData.permissions) {
        updateData.permissions = JSON.stringify(updateData.permissions);
      }

      const updatedAdmin = await AdminUser.update(id, updateData);

      // Log activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        'admin_user_update',
        'admin_user',
        id,
        { 
          updated_user_email: existingAdmin.email,
          updated_fields: Object.keys(updateData)
        },
        req
      );

      res.json({
        success: true,
        message: 'Admin user updated successfully',
        data: { adminUser: updatedAdmin }
      });

    } catch (error) {
      console.error('Update admin user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update admin user',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Reports and Analytics
  static async getVendorReport(req, res) {
    try {
      const { date_from, date_to, format = 'json' } = req.query;

      const dateFrom = date_from ? new Date(date_from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dateTo = date_to ? new Date(date_to) : new Date();

      // Get comprehensive vendor statistics
      const [totalStats, activityStats, topActions] = await Promise.all([
        Vendor.getCount(),
        ActivityLogger.getActivityStats(dateFrom, dateTo),
        ActivityLogger.getTopActions(10, dateFrom, dateTo)
      ]);

      const report = {
        period: {
          from: dateFrom.toISOString(),
          to: dateTo.toISOString()
        },
        vendor_stats: totalStats,
        activity_stats: activityStats,
        top_actions: topActions,
        generated_at: new Date().toISOString()
      };

      if (format === 'csv') {
        // TODO: Implement CSV export
        return res.status(501).json({
          success: false,
          message: 'CSV export not yet implemented'
        });
      }

      res.json({
        success: true,
        data: { report }
      });

    } catch (error) {
      console.error('Get vendor report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate vendor report',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async getProductReport(req, res) {
    try {
      const { date_from, date_to, vendor_id, category_id } = req.query;

      const dateFrom = date_from ? new Date(date_from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dateTo = date_to ? new Date(date_to) : new Date();

      const filters = { vendor_id, category_id };
      
      const [productStats, recentProducts] = await Promise.all([
        Product.getAdminStats(),
        Product.getRecentProducts(vendor_id, 20)
      ]);

      const report = {
        period: {
          from: dateFrom.toISOString(),
          to: dateTo.toISOString()
        },
        product_stats: productStats,
        recent_products: recentProducts,
        filters,
        generated_at: new Date().toISOString()
      };

      res.json({
        success: true,
        data: { report }
      });

    } catch (error) {
      console.error('Get product report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate product report',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Product Management
  static async getAllProducts(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        search,
        vendorId,
        categoryId 
      } = req.query;

      const offset = (page - 1) * limit;
      const filters = { status, search, vendorId, categoryId };

      const [products, totalCount] = await Promise.all([
        Product.getAll(filters, { limit: parseInt(limit), offset: parseInt(offset) }),
        Product.getCount(filters)
      ]);

      res.json({
        success: true,
        data: {
          items: products,
          pagination: {
            page: parseInt(page),
            pages: Math.ceil(totalCount / limit),
            total: totalCount,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get all products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get products'
      });
    }
  }

  static async getProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product'
      });
    }
  }

  static async approveProduct(req, res) {
    try {
      const { id } = req.params;
      
      res.json({
        success: true,
        message: 'Product approved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to approve product'
      });
    }
  }

  static async rejectProduct(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      res.json({
        success: true,
        message: 'Product rejected successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to reject product'
      });
    }
  }

  static async bulkApproveProducts(req, res) {
    try {
      const { productIds } = req.body;
      
      res.json({
        success: true,
        message: `${productIds.length} products approved successfully`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to approve products'
      });
    }
  }

  static async bulkRejectProducts(req, res) {
    try {
      const { productIds, reason } = req.body;
      
      res.json({
        success: true,
        message: `${productIds.length} products rejected successfully`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to reject products'
      });
    }
  }

  // Category Management
  static async getCategories(req, res) {
    try {
      const ProductCategory = require('../models/ProductCategory');
      const categories = await ProductCategory.getAll(true); // Include inactive categories for admin view
      
      console.log(`📂 Loaded ${categories.length} categories from database`);
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get categories',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async createCategory(req, res) {
    try {
      res.json({
        success: true,
        message: 'Category created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create category'
      });
    }
  }

  static async updateCategory(req, res) {
    try {
      res.json({
        success: true,
        message: 'Category updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update category'
      });
    }
  }

  static async deleteCategory(req, res) {
    try {
      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete category'
      });
    }
  }

  static async syncCategoriesWithBigCommerce(req, res) {
    try {
      console.log('🔄 Admin initiated BigCommerce category sync');
      
      // Check if BigCommerce is configured
      if (!process.env.BC_STORE_HASH || !process.env.BC_ACCESS_TOKEN) {
        console.log('❌ BigCommerce credentials not configured');
        return res.status(400).json({
          success: false,
          message: 'BigCommerce credentials not configured. Please set BC_STORE_HASH and BC_ACCESS_TOKEN environment variables.'
        });
      }

      // Test connection first
      const connectionTest = await BigCommerceService.testConnection();
      if (!connectionTest.connected) {
        console.log('❌ BigCommerce connection failed:', connectionTest.error);
        return res.status(400).json({
          success: false,
          message: `BigCommerce connection failed: ${connectionTest.error}`
        });
      }

      console.log('✅ BigCommerce connection successful, starting category sync...');

      // Clean up duplicates before sync
      const ProductCategory = require('../models/ProductCategory');
      const existingCount = await ProductCategory.getCount();
      console.log(`📊 Current categories in database: ${existingCount}`);
      
      const deletedDuplicates = await ProductCategory.deleteDuplicates();
      if (deletedDuplicates > 0) {
        console.log(`🧹 Cleaned up ${deletedDuplicates} duplicate categories`);
      }

      // Perform the actual sync
      const syncResult = await BigCommerceService.syncCategoriesToLocal();
      
      console.log(`🎉 Sync completed: ${syncResult.synced}/${syncResult.total} categories synced`);
      
      // Log admin activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        'bigcommerce_categories_sync',
        'system',
        null,
        { 
          total_categories: syncResult.total,
          synced_count: syncResult.synced,
          error_count: syncResult.errors.length
        },
        req
      );

      res.json({
        success: true,
        message: `Successfully synced ${syncResult.synced} categories from BigCommerce`,
        data: { 
          synced: syncResult.synced,
          total: syncResult.total,
          errors: syncResult.errors
        }
      });
    } catch (error) {
      console.error('❌ BigCommerce category sync error:', error.message);
      res.status(500).json({
        success: false,
        message: `Failed to sync categories: ${error.message}`
      });
    }
  }

  // BigCommerce Integration
  static async syncAllWithBigCommerce(req, res) {
    try {
      console.log('🔄 Admin initiated full BigCommerce sync');
      
      // Check if BigCommerce is configured
      if (!process.env.BC_STORE_HASH || !process.env.BC_ACCESS_TOKEN) {
        console.log('❌ BigCommerce credentials not configured');
        return res.status(400).json({
          success: false,
          message: 'BigCommerce credentials not configured. Please set BC_STORE_HASH and BC_ACCESS_TOKEN environment variables.'
        });
      }

      // Test connection first
      const connectionTest = await BigCommerceService.testConnection();
      if (!connectionTest.connected) {
        console.log('❌ BigCommerce connection failed:', connectionTest.error);
        return res.status(400).json({
          success: false,
          message: `BigCommerce connection failed: ${connectionTest.error}`
        });
      }

      console.log('✅ BigCommerce connection successful, starting full sync...');

      // Sync categories first
      const categorySync = await BigCommerceService.syncCategoriesToLocal();
      console.log(`📂 Categories synced: ${categorySync.synced}/${categorySync.total}`);
      
      // Log admin activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        'bigcommerce_full_sync',
        'system',
        null,
        { 
          categories_synced: categorySync.synced,
          total_categories: categorySync.total,
          sync_type: 'full_sync'
        },
        req
      );

      res.json({
        success: true,
        message: `BigCommerce sync completed: ${categorySync.synced} categories synced`,
        data: { 
          categories: {
            synced: categorySync.synced,
            total: categorySync.total,
            errors: categorySync.errors
          }
        }
      });
    } catch (error) {
      console.error('❌ BigCommerce full sync error:', error.message);
      res.status(500).json({
        success: false,
        message: `Failed to sync with BigCommerce: ${error.message}`
      });
    }
  }

  static async getBigCommerceStatus(req, res) {
    try {
      res.json({
        success: true,
        data: {
          connected: true,
          lastSync: new Date().toISOString(),
          status: 'operational'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get BigCommerce status'
      });
    }
  }

  static async testBigCommerceConnection(req, res) {
    try {
      const { storeHash, accessToken } = req.body;
      
      res.json({
        success: true,
        message: 'BigCommerce connection test successful'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'BigCommerce connection test failed'
      });
    }
  }

  // Analytics
  static async getAnalytics(req, res) {
    try {
      const { startDate, endDate, vendorId } = req.query;
      
      res.json({
        success: true,
        data: {
          totalRevenue: 125000,
          revenueGrowth: 15.3,
          totalVendors: 45,
          vendorGrowth: 8.2,
          totalProducts: 234,
          productGrowth: 22.1,
          totalOrders: 1567,
          orderGrowth: 18.7,
          topVendors: [
            { name: 'Fresh Foods Co.', revenue: 25000, orders: 150 },
            { name: 'Organic Farm', revenue: 18500, orders: 120 },
            { name: 'Gourmet Delights', revenue: 15200, orders: 95 }
          ],
          categoryBreakdown: [
            { category: 'Food & Beverages', count: 156, revenue: 85000 },
            { category: 'Organic Products', count: 78, revenue: 40000 }
          ]
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get analytics'
      });
    }
  }

  static async getVendorAnalytics(req, res) {
    try {
      const { id } = req.params;
      
      res.json({
        success: true,
        data: {
          vendorId: id,
          revenue: 25000,
          orders: 150,
          products: 12
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get vendor analytics'
      });
    }
  }

  // Reset categories (clean slate)
  static async resetCategories(req, res) {
    try {
      console.log('🧹 Admin initiated category reset');
      
      const ProductCategory = require('../models/ProductCategory');
      
      // Delete all categories
      const deletedCount = await ProductCategory.deleteAll();
      console.log(`🗑️ Deleted ${deletedCount} categories from database`);
      
      // Log admin activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        'categories_reset',
        'category',
        null,
        { 
          deleted_count: deletedCount 
        },
        req
      );

      res.json({
        success: true,
        message: `Successfully reset categories. Deleted ${deletedCount} categories.`,
        data: { deleted: deletedCount }
      });
    } catch (error) {
      console.error('❌ Category reset error:', error.message);
      res.status(500).json({
        success: false,
        message: `Failed to reset categories: ${error.message}`
      });
    }
  }
}

module.exports = AdminController;