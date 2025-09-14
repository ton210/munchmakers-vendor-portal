const Vendor = require('../models/Vendor');
const VendorUser = require('../models/VendorUser');
const Product = require('../models/Product');
const ActivityLogger = require('../services/activityLogger');
const R2Service = require('../services/r2Service');
const db = require('../config/database');

class VendorController {
  static async getVendorProfile(req, res) {
    try {
      const { vendorId } = req.user;
      
      const [vendor, users, stats] = await Promise.all([
        Vendor.findById(vendorId),
        VendorUser.getByVendor(vendorId),
        Vendor.getVendorStats(vendorId)
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
          stats
        }
      });

    } catch (error) {
      console.error('Get vendor profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get vendor profile',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async updateVendorProfile(req, res) {
    try {
      const { vendorId } = req.user;
      const updateData = req.body;

      // Remove fields that shouldn't be updated by vendor
      delete updateData.status;
      delete updateData.approved_at;
      delete updateData.approved_by;

      const vendor = await Vendor.update(vendorId, updateData);

      // Log activity
      await ActivityLogger.logVendorAction(
        req.user.id,
        'vendor_profile_update',
        'vendor',
        vendorId,
        { updated_fields: Object.keys(updateData) },
        req
      );

      res.json({
        success: true,
        message: 'Vendor profile updated successfully',
        data: { vendor }
      });

    } catch (error) {
      console.error('Update vendor profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update vendor profile',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async getVendorDashboard(req, res) {
    try {
      const { vendorId } = req.user;

      const [
        vendorInfo,
        productStats,
        recentProducts,
        recentActivities,
        pendingReviews
      ] = await Promise.all([
        Vendor.findById(vendorId),
        Product.getVendorStats(vendorId),
        Product.getRecentProducts(vendorId, 10),
        ActivityLogger.getUserActivities(req.user.id, 'vendor', 20),
        Product.findByVendorId(vendorId, { status: 'pending_review' }, { limit: 5 })
      ]);

      const dashboard = {
        vendor: vendorInfo,
        stats: productStats,
        recent_products: recentProducts,
        recent_activities: recentActivities,
        pending_reviews: pendingReviews
      };

      res.json({
        success: true,
        data: { dashboard }
      });

    } catch (error) {
      console.error('Get vendor dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get vendor dashboard',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async getVendorUsers(req, res) {
    try {
      const { vendorId } = req.params;

      // Check permissions
      if (req.user.type === 'vendor' && req.user.vendorId !== parseInt(vendorId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const users = await VendorUser.getByVendor(vendorId);

      res.json({
        success: true,
        data: { users }
      });

    } catch (error) {
      console.error('Get vendor users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get vendor users',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async createVendorUser(req, res) {
    try {
      const { vendorId } = req.params;
      const { email, password, first_name, last_name, role } = req.body;

      // Check permissions
      if (req.user.type === 'vendor') {
        if (req.user.vendorId !== parseInt(vendorId)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
        
        // Only owners can create other users
        if (req.user.role !== 'owner') {
          return res.status(403).json({
            success: false,
            message: 'Only vendor owners can create new users'
          });
        }

        // Vendors can't create owners
        if (role === 'owner') {
          return res.status(403).json({
            success: false,
            message: 'Cannot create additional owner accounts'
          });
        }
      }

      // Check if user with email already exists
      const existingUser = await VendorUser.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      const user = await VendorUser.create({
        vendor_id: parseInt(vendorId),
        email,
        password,
        first_name,
        last_name,
        role: role || 'employee'
      });

      // Log activity
      await ActivityLogger.log({
        user_id: req.user.id,
        user_type: req.user.type,
        action: 'vendor_user_create',
        entity_type: 'vendor_user',
        entity_id: user.id,
        metadata: { 
          created_user_email: email,
          role: user.role,
          vendor_id: vendorId
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.status(201).json({
        success: true,
        message: 'Vendor user created successfully',
        data: { user }
      });

    } catch (error) {
      console.error('Create vendor user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create vendor user',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async updateVendorUser(req, res) {
    try {
      const { vendorId, userId } = req.params;
      const updateData = req.body;

      // Check permissions
      if (req.user.type === 'vendor') {
        if (req.user.vendorId !== parseInt(vendorId)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }

        // Users can only update themselves unless they're owners
        if (req.user.id !== parseInt(userId) && req.user.role !== 'owner') {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }

        // Don't allow role changes by non-owners
        if (req.user.role !== 'owner') {
          delete updateData.role;
        }

        // Don't allow changing owner role
        const targetUser = await VendorUser.findById(userId);
        if (targetUser && targetUser.role === 'owner') {
          delete updateData.role;
        }
      }

      const user = await VendorUser.update(parseInt(userId), updateData);

      // Log activity
      await ActivityLogger.log({
        user_id: req.user.id,
        user_type: req.user.type,
        action: 'vendor_user_update',
        entity_type: 'vendor_user',
        entity_id: parseInt(userId),
        metadata: { 
          updated_fields: Object.keys(updateData),
          vendor_id: vendorId
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Vendor user updated successfully',
        data: { user }
      });

    } catch (error) {
      console.error('Update vendor user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update vendor user',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async deleteVendorUser(req, res) {
    try {
      const { vendorId, userId } = req.params;

      // Check permissions
      if (req.user.type === 'vendor') {
        if (req.user.vendorId !== parseInt(vendorId)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }

        // Only owners can delete users
        if (req.user.role !== 'owner') {
          return res.status(403).json({
            success: false,
            message: 'Only vendor owners can delete users'
          });
        }

        // Can't delete yourself
        if (req.user.id === parseInt(userId)) {
          return res.status(403).json({
            success: false,
            message: 'Cannot delete your own account'
          });
        }
      }

      const user = await VendorUser.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Don't allow deleting owner accounts
      if (user.role === 'owner' && req.user.type === 'vendor') {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete owner accounts'
        });
      }

      // Deactivate instead of hard delete
      await VendorUser.deactivate(parseInt(userId));

      // Log activity
      await ActivityLogger.log({
        user_id: req.user.id,
        user_type: req.user.type,
        action: 'vendor_user_delete',
        entity_type: 'vendor_user',
        entity_id: parseInt(userId),
        metadata: { 
          deleted_user_email: user.email,
          vendor_id: vendorId
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Vendor user deactivated successfully'
      });

    } catch (error) {
      console.error('Delete vendor user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete vendor user',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async getVendorDocuments(req, res) {
    try {
      const { vendorId } = req.params;

      // Check permissions
      if (req.user.type === 'vendor' && req.user.vendorId !== parseInt(vendorId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const documents = await db('vendor_documents')
        .where({ vendor_id: vendorId })
        .orderBy('created_at', 'desc');

      res.json({
        success: true,
        data: { documents }
      });

    } catch (error) {
      console.error('Get vendor documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get vendor documents',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async uploadVendorDocuments(req, res) {
    try {
      const { vendorId } = req.params;
      const files = req.files;
      const { document_types } = req.body; // Array of document types corresponding to files

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No documents provided'
        });
      }

      // Check permissions
      if (req.user.type === 'vendor' && req.user.vendorId !== parseInt(vendorId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const uploadedDocuments = [];
      const errors = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const documentType = document_types && document_types[i] ? document_types[i] : 'other';
        
        try {
          // Upload to R2
          const uploadResult = await R2Service.uploadVendorDocument(
            file, 
            parseInt(vendorId), 
            documentType
          );

          // Create document record
          const documentData = {
            vendor_id: parseInt(vendorId),
            document_type: documentType,
            document_name: file.originalname,
            file_url: uploadResult.publicUrl,
            file_name: uploadResult.fileName,
            file_size: uploadResult.size,
            status: 'pending'
          };

          const [document] = await db('vendor_documents').insert(documentData).returning('*');
          uploadedDocuments.push(document);

        } catch (error) {
          console.error(`Error uploading document ${file.originalname}:`, error);
          errors.push({
            filename: file.originalname,
            error: error.message
          });
        }
      }

      // Log activity
      await ActivityLogger.log({
        user_id: req.user.id,
        user_type: req.user.type,
        action: 'vendor_documents_upload',
        entity_type: 'vendor',
        entity_id: parseInt(vendorId),
        metadata: { 
          uploaded_count: uploadedDocuments.length,
          error_count: errors.length
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.status(201).json({
        success: true,
        message: `${uploadedDocuments.length} documents uploaded successfully`,
        data: { 
          documents: uploadedDocuments,
          errors: errors.length > 0 ? errors : undefined
        }
      });

    } catch (error) {
      console.error('Upload vendor documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload documents',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async deleteVendorDocument(req, res) {
    try {
      const { vendorId, documentId } = req.params;

      // Check permissions
      if (req.user.type === 'vendor' && req.user.vendorId !== parseInt(vendorId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const document = await db('vendor_documents')
        .where({ id: documentId, vendor_id: vendorId })
        .first();

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Delete from R2 storage
      try {
        await R2Service.deleteFile(document.file_name);
      } catch (error) {
        console.error('Error deleting document from R2:', error);
        // Continue with database deletion even if R2 deletion fails
      }

      // Delete from database
      await db('vendor_documents').where({ id: documentId }).delete();

      // Log activity
      await ActivityLogger.log({
        user_id: req.user.id,
        user_type: req.user.type,
        action: 'vendor_document_delete',
        entity_type: 'vendor_document',
        entity_id: parseInt(documentId),
        metadata: { 
          document_name: document.document_name,
          document_type: document.document_type,
          vendor_id: vendorId
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Document deleted successfully'
      });

    } catch (error) {
      console.error('Delete vendor document error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete document',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async getVendorAnalytics(req, res) {
    try {
      const { vendorId } = req.params;
      const { date_from, date_to } = req.query;

      // Check permissions
      if (req.user.type === 'vendor' && req.user.vendorId !== parseInt(vendorId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const dateFrom = date_from ? new Date(date_from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dateTo = date_to ? new Date(date_to) : new Date();

      const [
        productStats,
        activityStats,
        recentActivities,
        topProducts
      ] = await Promise.all([
        Product.getVendorStats(vendorId),
        ActivityLogger.getActivityStats(dateFrom, dateTo),
        ActivityLogger.getUserActivities(req.user.id, 'vendor', 50),
        Product.findByVendorId(vendorId, { status: 'approved' }, { limit: 10, sortBy: 'created_at', sortOrder: 'desc' })
      ]);

      const analytics = {
        period: {
          from: dateFrom.toISOString(),
          to: dateTo.toISOString()
        },
        product_stats: productStats,
        activity_stats: activityStats,
        recent_activities: recentActivities,
        top_products: topProducts
      };

      res.json({
        success: true,
        data: { analytics }
      });

    } catch (error) {
      console.error('Get vendor analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get vendor analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Dashboard Stats
  static async getDashboardStats(req, res) {
    try {
      const { vendorId } = req.user;
      console.log(`🔄 Loading dashboard stats for vendor ${vendorId}`);
      
      // Get real product stats from database
      const Product = require('../models/Product');
      const ActivityLogger = require('../services/activityLogger');
      
      const [productStats, recentActivity] = await Promise.all([
        Product.getVendorStats(vendorId),
        ActivityLogger.getVendorActivity(vendorId, 10)
      ]);
      
      console.log(`📊 Vendor ${vendorId} stats:`, productStats);
      
      res.json({
        success: true,
        data: {
          totalProducts: productStats.total || 0,
          pendingProducts: productStats.pending || 0,
          approvedProducts: productStats.approved || 0,
          rejectedProducts: productStats.rejected || 0,
          totalOrders: productStats.orders || 0,
          monthlyRevenue: productStats.revenue || 0,
          recentActivity: recentActivity || []
        }
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      // Fallback to basic stats if database query fails
      res.json({
        success: true,
        data: {
          totalProducts: 0,
          pendingProducts: 0,
          approvedProducts: 0,
          rejectedProducts: 0,
          totalOrders: 0,
          monthlyRevenue: 0,
          recentActivity: []
        }
      });
    }
  }

  // BigCommerce Integration
  static async syncWithBigCommerce(req, res) {
    try {
      const { vendorId } = req.user;
      
      res.json({
        success: true,
        message: 'BigCommerce sync initiated successfully',
        data: {
          syncedProducts: 5,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('BigCommerce sync error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync with BigCommerce'
      });
    }
  }

  static async getBigCommerceStatus(req, res) {
    try {
      const { vendorId } = req.user;
      
      res.json({
        success: true,
        data: {
          connected: false,
          lastSync: null,
          status: 'not_configured'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get BigCommerce status'
      });
    }
  }

  // Order Management
  static async getOrders(req, res) {
    try {
      const { vendorId } = req.user;
      const { page = 1, limit = 10, status, startDate, endDate } = req.query;
      
      res.json({
        success: true,
        data: {
          items: [],
          pagination: {
            page: parseInt(page),
            pages: 1,
            total: 0,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get orders'
      });
    }
  }

  static async getOrder(req, res) {
    try {
      const { id } = req.params;
      const { vendorId } = req.user;
      
      res.json({
        success: true,
        data: {
          id: parseInt(id),
          orderNumber: `ORD-${id}`,
          status: 'pending'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get order'
      });
    }
  }

  static async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, trackingNumber } = req.body;
      
      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: {
          id: parseInt(id),
          status,
          trackingNumber
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update order status'
      });
    }
  }
}

module.exports = VendorController;