const ProductImage = require('../models/ProductImage');
const Product = require('../models/Product');
const R2Service = require('../services/r2Service');
const ActivityLogger = require('../services/activityLogger');

class ProductImageController {
  static async getProductImages(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check permissions
      if (req.user.type === 'vendor' && product.vendor_id !== req.user.vendorId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const images = await ProductImage.findByProductId(id);

      res.json({
        success: true,
        data: { images }
      });

    } catch (error) {
      console.error('Get product images error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product images',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async uploadProductImages(req, res) {
    try {
      const { id } = req.params;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No images provided'
        });
      }

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check permissions
      if (req.user.type === 'vendor' && product.vendor_id !== req.user.vendorId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check current image count
      const currentImageCount = await ProductImage.getImageCount(id);
      if (currentImageCount + files.length > 10) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 10 images allowed per product'
        });
      }

      const uploadedImages = [];
      const errors = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          // Upload to R2
          const uploadResult = await R2Service.uploadProductImage(
            file, 
            product.vendor_id, 
            id,
            req.body[`alt_text_${i}`] || ''
          );

          // Create image record
          const imageData = {
            product_id: id,
            image_url: uploadResult.publicUrl,
            alt_text: uploadResult.altText,
            is_primary: currentImageCount === 0 && i === 0, // First image is primary if no images exist
            display_order: currentImageCount + i,
            file_name: uploadResult.fileName,
            file_size: uploadResult.size
          };

          const image = await ProductImage.create(imageData);
          uploadedImages.push(image);

        } catch (error) {
          console.error(`Error uploading image ${file.originalname}:`, error);
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
        action: 'product_images_upload',
        entity_type: 'product',
        entity_id: id,
        metadata: { 
          product_name: product.name,
          uploaded_count: uploadedImages.length,
          error_count: errors.length
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.status(201).json({
        success: true,
        message: `${uploadedImages.length} images uploaded successfully`,
        data: { 
          images: uploadedImages,
          errors: errors.length > 0 ? errors : undefined
        }
      });

    } catch (error) {
      console.error('Upload product images error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload images',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async updateProductImage(req, res) {
    try {
      const { imageId } = req.params;
      const { alt_text, is_primary } = req.body;

      const image = await ProductImage.findById(imageId);
      if (!image) {
        return res.status(404).json({
          success: false,
          message: 'Image not found'
        });
      }

      // Check permissions
      if (req.user.type === 'vendor') {
        const isOwner = await ProductImage.validateImageOwnership(imageId, req.user.vendorId);
        if (!isOwner) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      const updateData = {};
      if (alt_text !== undefined) updateData.alt_text = alt_text;

      // Handle primary image setting
      if (is_primary === true) {
        await ProductImage.setPrimary(image.product_id, imageId);
      } else if (alt_text !== undefined) {
        updateData.is_primary = false;
      }

      let updatedImage;
      if (Object.keys(updateData).length > 0) {
        updatedImage = await ProductImage.update(imageId, updateData);
      } else {
        updatedImage = image;
      }

      // Log activity
      await ActivityLogger.log({
        user_id: req.user.id,
        user_type: req.user.type,
        action: 'product_image_update',
        entity_type: 'product_image',
        entity_id: imageId,
        metadata: { 
          product_id: image.product_id,
          changes: updateData
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Image updated successfully',
        data: { image: updatedImage }
      });

    } catch (error) {
      console.error('Update product image error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update image',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async deleteProductImage(req, res) {
    try {
      const { imageId } = req.params;

      const image = await ProductImage.findById(imageId);
      if (!image) {
        return res.status(404).json({
          success: false,
          message: 'Image not found'
        });
      }

      // Check permissions
      if (req.user.type === 'vendor') {
        const isOwner = await ProductImage.validateImageOwnership(imageId, req.user.vendorId);
        if (!isOwner) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      // Delete from R2 storage
      try {
        await R2Service.deleteFile(image.file_name);
      } catch (error) {
        console.error('Error deleting image from R2:', error);
        // Continue with database deletion even if R2 deletion fails
      }

      // Delete from database
      await ProductImage.delete(imageId);

      // If this was the primary image, make the first remaining image primary
      if (image.is_primary) {
        const remainingImages = await ProductImage.findByProductId(image.product_id);
        if (remainingImages.length > 0) {
          await ProductImage.update(remainingImages[0].id, { is_primary: true });
        }
      }

      // Log activity
      await ActivityLogger.log({
        user_id: req.user.id,
        user_type: req.user.type,
        action: 'product_image_delete',
        entity_type: 'product_image',
        entity_id: imageId,
        metadata: { 
          product_id: image.product_id,
          file_name: image.file_name,
          was_primary: image.is_primary
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Image deleted successfully'
      });

    } catch (error) {
      console.error('Delete product image error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete image',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async reorderProductImages(req, res) {
    try {
      const { id } = req.params;
      const { imageOrders } = req.body;

      if (!Array.isArray(imageOrders)) {
        return res.status(400).json({
          success: false,
          message: 'Image orders must be an array'
        });
      }

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check permissions
      if (req.user.type === 'vendor' && product.vendor_id !== req.user.vendorId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await ProductImage.reorderImages(id, imageOrders);

      // Log activity
      await ActivityLogger.log({
        user_id: req.user.id,
        user_type: req.user.type,
        action: 'product_images_reorder',
        entity_type: 'product',
        entity_id: id,
        metadata: { 
          product_name: product.name,
          image_count: imageOrders.length
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Images reordered successfully'
      });

    } catch (error) {
      console.error('Reorder product images error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reorder images',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = ProductImageController;