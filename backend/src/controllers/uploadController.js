const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const ActivityLogger = require('../services/activityLogger');
const R2Service = require('../services/r2Service');
const db = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

class UploadController {
  // Upload design files for order
  static async uploadDesignFiles(req, res) {
    try {
      const { order_id, vendor_assignment_id, file_type = 'design', is_public = false } = req.body;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      // Verify order access
      if (req.user.type === 'vendor') {
        const vendor = await Vendor.findByUserId(req.user.id);
        const assignment = await db('vendor_assignments')
          .where({ id: vendor_assignment_id, vendor_id: vendor?.id })
          .first();

        if (!assignment) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this order assignment'
          });
        }
      }

      const uploadedFiles = [];

      for (const file of req.files) {
        try {
          // Upload to R2 storage
          let fileUrl = null;
          if (R2Service) {
            try {
              fileUrl = await R2Service.uploadFile(file);
            } catch (r2Error) {
              console.error('R2 upload failed, using local storage:', r2Error.message);
            }
          }

          // Save file record to database
          const fileRecord = {
            order_id,
            vendor_assignment_id: vendor_assignment_id || null,
            filename: file.filename,
            original_filename: file.originalname,
            file_path: fileUrl || file.path,
            file_size: file.size,
            mime_type: file.mimetype,
            file_type,
            uploaded_by: req.user.id,
            is_public: is_public === 'true' || is_public === true
          };

          const [attachment] = await db('order_attachments')
            .insert(fileRecord)
            .returning('*');

          uploadedFiles.push(attachment);

        } catch (fileError) {
          console.error(`Failed to process file ${file.originalname}:`, fileError);
        }
      }

      // Log activity
      await ActivityLogger.log({
        user_id: req.user.id,
        user_type: req.user.type,
        action: 'design_files_uploaded',
        entity_type: 'order',
        entity_id: order_id,
        metadata: {
          files_count: uploadedFiles.length,
          file_type,
          total_size: uploadedFiles.reduce((sum, f) => sum + f.file_size, 0)
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.status(201).json({
        success: true,
        message: `${uploadedFiles.length} files uploaded successfully`,
        data: { files: uploadedFiles }
      });

    } catch (error) {
      console.error('Upload design files error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload files',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get files for order
  static async getOrderFiles(req, res) {
    try {
      const { order_id } = req.params;
      const { file_type, is_public } = req.query;

      // Check order access
      if (req.user.type === 'vendor') {
        const vendor = await Vendor.findByUserId(req.user.id);
        const hasAccess = await db('vendor_assignments')
          .where({ order_id, vendor_id: vendor?.id })
          .first();

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this order'
          });
        }
      }

      let query = db('order_attachments')
        .select(
          'order_attachments.*',
          'admin_users.first_name as uploaded_by_name',
          'admin_users.last_name as uploaded_by_last_name'
        )
        .leftJoin('admin_users', 'order_attachments.uploaded_by', 'admin_users.id')
        .where('order_attachments.order_id', order_id);

      if (file_type) {
        query = query.where('order_attachments.file_type', file_type);
      }

      if (is_public !== undefined) {
        query = query.where('order_attachments.is_public', is_public === 'true');
      }

      const files = await query.orderBy('order_attachments.created_at', 'desc');

      res.json({
        success: true,
        data: { files }
      });

    } catch (error) {
      console.error('Get order files error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get order files',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Download file
  static async downloadFile(req, res) {
    try {
      const { id } = req.params;

      const file = await db('order_attachments').where({ id }).first();
      if (!file) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      // Check permissions
      if (req.user.type === 'vendor') {
        const vendor = await Vendor.findByUserId(req.user.id);
        const hasAccess = await db('vendor_assignments')
          .where({ order_id: file.order_id, vendor_id: vendor?.id })
          .first();

        if (!hasAccess && !file.is_public) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this file'
          });
        }
      }

      // If file is in R2, redirect to R2 URL
      if (file.file_path.startsWith('http')) {
        return res.redirect(file.file_path);
      }

      // Serve local file
      if (fs.existsSync(file.file_path)) {
        res.download(file.file_path, file.original_filename);
      } else {
        res.status(404).json({
          success: false,
          message: 'File not found on disk'
        });
      }

    } catch (error) {
      console.error('Download file error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download file',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Delete file
  static async deleteFile(req, res) {
    try {
      const { id } = req.params;

      const file = await db('order_attachments').where({ id }).first();
      if (!file) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      // Check permissions
      if (req.user.type === 'vendor') {
        const vendor = await Vendor.findByUserId(req.user.id);
        const hasAccess = await db('vendor_assignments')
          .where({ order_id: file.order_id, vendor_id: vendor?.id })
          .first();

        if (!hasAccess || file.uploaded_by !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied - you can only delete your own files'
          });
        }
      }

      // Delete from R2 if applicable
      if (R2Service && file.file_path.includes('r2.dev')) {
        try {
          await R2Service.deleteFile(file.filename);
        } catch (r2Error) {
          console.error('R2 delete failed:', r2Error.message);
        }
      }

      // Delete local file if exists
      if (fs.existsSync(file.file_path)) {
        fs.unlinkSync(file.file_path);
      }

      // Delete database record
      await db('order_attachments').where({ id }).delete();

      // Log activity
      await ActivityLogger.log({
        user_id: req.user.id,
        user_type: req.user.type,
        action: 'design_file_deleted',
        entity_type: 'order_attachment',
        entity_id: id,
        metadata: {
          filename: file.original_filename,
          order_id: file.order_id
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'File deleted successfully'
      });

    } catch (error) {
      console.error('Delete file error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete file',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get upload statistics
  static async getUploadStats(req, res) {
    try {
      let query = db('order_attachments');

      // Filter by vendor if vendor user
      if (req.user.type === 'vendor') {
        const vendor = await Vendor.findByUserId(req.user.id);
        query = query
          .leftJoin('vendor_assignments', 'order_attachments.vendor_assignment_id', 'vendor_assignments.id')
          .where('vendor_assignments.vendor_id', vendor?.id);
      }

      const stats = await query
        .select(
          db.raw('COUNT(*) as total_files'),
          db.raw('SUM(file_size) as total_size'),
          db.raw('COUNT(CASE WHEN file_type = \'design\' THEN 1 END) as design_files'),
          db.raw('COUNT(CASE WHEN file_type = \'proof\' THEN 1 END) as proof_files'),
          db.raw('COUNT(CASE WHEN file_type = \'specification\' THEN 1 END) as spec_files')
        )
        .first();

      res.json({
        success: true,
        data: {
          stats: {
            total_files: parseInt(stats.total_files),
            total_size: parseInt(stats.total_size) || 0,
            design_files: parseInt(stats.design_files),
            proof_files: parseInt(stats.proof_files),
            spec_files: parseInt(stats.spec_files)
          }
        }
      });

    } catch (error) {
      console.error('Get upload stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get upload statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = UploadController;