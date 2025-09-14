const Product = require('../models/Product');
const ProductImage = require('../models/ProductImage');
const ProductCategory = require('../models/ProductCategory');
const Vendor = require('../models/Vendor');
const VendorUser = require('../models/VendorUser');
const EmailService = require('../services/emailService');
const SlackService = require('../services/slackService');
const ActivityLogger = require('../services/activityLogger');
const R2Service = require('../services/r2Service');
const CSVService = require('../services/csvService');
const TranslationService = require('../services/translationService');
const db = require('../config/database');


class ProductController {
  // Get products for vendor
  static async getVendorProducts(req, res) {
    try {
      const { vendorId } = req.user;
      const {
        page = 1,
        limit = 20,
        status,
        category_id,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;


      const offset = (page - 1) * limit;

      const filters = { status, category_id, search };
      const pagination = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        sortBy,
        sortOrder
      };

      const [products, totalCount] = await Promise.all([
        Product.findByVendorId(vendorId, filters, pagination),
        Product.getCount({ ...filters, vendor_id: vendorId })
      ]);

      res.json({
        success: true,
        data: {
          items: products, // Frontend expects 'items' not 'products'
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            pages: Math.ceil(totalCount / limit) // Frontend expects 'pages' not 'totalPages'
          }
        }
      });

    } catch (error) {
      console.error('Get vendor products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get products',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get all products for admin
  static async getAllProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        vendor_id,
        category_id,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      const offset = (page - 1) * limit;

      const filters = { status, vendor_id, category_id, search };
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
          items: products, // Frontend expects 'items' not 'products'
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            pages: Math.ceil(totalCount / limit) // Frontend expects 'pages' not 'totalPages'
          }
        }
      });

    } catch (error) {
      console.error('Get all products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get products',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get single product
  static async getProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.getWithDetails(id);

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

      res.json({
        success: true,
        data: { product }
      });

    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Create product
  static async createProduct(req, res) {
    try {
      const { vendorId } = req.user;
      const {
        // Basic fields
        name,
        description,
        sku,
        price,
        moq,
        weight,
        dimensions,
        productionTime,
        categoryId,

        // New fields (optional)
        shippingOptions,
        designToolInfo,
        designToolTemplate,
        productionImages,

        // Complex fields
        variants,
        pricingTiers,
        productImages,

        status = 'draft'
      } = req.body;

      // Generate SKU if not provided
      const finalSku = sku || `${vendorId}-${Date.now()}`;

      // Check if SKU already exists
      const existingSku = await Product.findBySku(finalSku);
      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: 'Product with this SKU already exists'
        });
      }

      // Auto-translate Chinese product data to English for admin/customer view
      const translationService = new TranslationService();

      let translatedName = name;
      let translatedDescription = description;

      try {
        // Detect if content is in Chinese and translate to English
        const nameLanguage = await translationService.detectLanguage(name);
        const descLanguage = await translationService.detectLanguage(description || '');

        if (nameLanguage === 'zh') {
          translatedName = await translationService.translateToEnglish(name, 'product');
          console.log(`🌐 Auto-translated product name: "${name}" -> "${translatedName}"`);
        }

        if (description && descLanguage === 'zh') {
          translatedDescription = await translationService.translateToEnglish(description, 'description');
          console.log(`🌐 Auto-translated description: "${description.substring(0, 50)}..." -> "${translatedDescription.substring(0, 50)}..."`);
        }
      } catch (translationError) {
        console.error('Auto-translation failed, using original text:', translationError.message);
        // Continue with original text if translation fails
      }

      const productData = {
        vendor_id: vendorId,
        name: translatedName, // Use translated name for English admin interface
        description: translatedDescription, // Use translated description
        sku: finalSku,
        base_price: price,
        moq: moq || 1,
        weight,
        dimensions,
        production_time: productionTime,
        category_id: categoryId,
        status,
        // Store original Chinese data in separate fields
        original_name: name !== translatedName ? name : null,
        original_description: description !== translatedDescription ? description : null
      };

      // Add optional fields only if they exist and migration has been applied
      try {
        if (shippingOptions) productData.shipping_options = shippingOptions;
        if (designToolInfo) productData.design_tool_info = designToolInfo;
        if (designToolTemplate) productData.design_tool_template = designToolTemplate;
        if (productionImages) productData.production_images = productionImages;
      } catch (e) {
        console.log('Some optional fields not available in database schema yet');
      }

      const product = await Product.create(productData);

      // Handle variants
      if (variants && variants.length > 0) {
        for (const variant of variants) {
          const variantData = {
            product_id: product.id,
            variant_name: variant.name,
            variant_sku: variant.sku || `${finalSku}-${variant.name.toLowerCase().replace(/\s+/g, '-')}`,
            additional_price: variant.additionalPrice || 0,
            stock_quantity: 0,
            attributes: variant.attributes || {},
            is_active: true
          };

          const createdVariant = await db('product_variants').insert(variantData).returning('*');

          // Handle variant images
          if (variant.images && variant.images.length > 0) {
            for (let i = 0; i < variant.images.length; i++) {
              const image = variant.images[i];
              await db('product_images').insert({
                product_id: product.id,
                variant_id: createdVariant[0].id,
                image_url: image.url,
                alt_text: `${variant.name} image ${i + 1}`,
                is_primary: i === 0,
                display_order: i,
                file_name: image.file ? image.file.name : `variant-${createdVariant[0].id}-${i}`
              });
            }
          }
        }
      }

      // Handle pricing tiers
      if (pricingTiers && pricingTiers.length > 0) {
        for (const tier of pricingTiers) {
          await db('product_pricing_tiers').insert({
            product_id: product.id,
            min_quantity: tier.minQuantity,
            max_quantity: tier.maxQuantity,
            unit_price: tier.unitPrice
          });
        }
      }

      // Handle product images
      if (productImages && productImages.length > 0) {
        for (let i = 0; i < productImages.length; i++) {
          const image = productImages[i];
          await db('product_images').insert({
            product_id: product.id,
            image_url: image.url,
            alt_text: `${name} image ${i + 1}`,
            is_primary: i === 0,
            display_order: i,
            file_name: image.file ? image.file.name : `product-${product.id}-${i}`
          });
        }
      }

      // Log activity
      try {
        await ActivityLogger.logVendorAction(
          req.user.id,
          'product_create',
          'product',
          product.id,
          {
            product_name: product.name,
            sku: product.sku,
            variants_count: variants ? variants.length : 0,
            pricing_tiers_count: pricingTiers ? pricingTiers.length : 0,
            images_count: productImages ? productImages.length : 0
          },
          req
        );
      } catch (activityError) {
        console.log('Activity logging not available, continuing...');
      }

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: { product }
      });

    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create product',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Update product
  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const existingProduct = await Product.findById(id);
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check permissions
      if (req.user.type === 'vendor' && existingProduct.vendor_id !== req.user.vendorId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // If vendor is updating an approved product, change status back to draft
      if (req.user.type === 'vendor' && existingProduct.status === 'approved') {
        updateData.status = 'draft';
      }

      // Check SKU uniqueness if SKU is being changed
      if (updateData.sku && updateData.sku !== existingProduct.sku) {
        const existingSku = await Product.findBySku(updateData.sku);
        if (existingSku) {
          return res.status(400).json({
            success: false,
            message: 'Product with this SKU already exists'
          });
        }
      }

      const product = await Product.update(id, updateData);

      // Log activity
      await ActivityLogger.log({
        user_id: req.user.id,
        user_type: req.user.type,
        action: 'product_update',
        entity_type: 'product',
        entity_id: id,
        metadata: { 
          updated_fields: Object.keys(updateData),
          product_name: product.name 
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: { product }
      });

    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update product',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Submit product for review
  static async submitProduct(req, res) {
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
      if (product.vendor_id !== req.user.vendorId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Validate product has required data
      if (!product.name || !product.sku || !product.base_price) {
        return res.status(400).json({
          success: false,
          message: 'Product must have name, SKU, and base price before submission'
        });
      }

      // Check if product has at least one image
      const imageCount = await ProductImage.getImageCount(id);
      if (imageCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Product must have at least one image before submission'
        });
      }

      const updatedProduct = await Product.submit(id, req.user.id);

      // Get vendor and user details for notifications
      const [vendor, user] = await Promise.all([
        Vendor.findById(product.vendor_id),
        VendorUser.findById(req.user.id)
      ]);

      // Send notifications
      await Promise.all([
        EmailService.sendProductSubmissionConfirmation(updatedProduct, vendor, user),
        SlackService.notifyProductSubmission(updatedProduct, vendor)
      ]);

      // Log activity
      await ActivityLogger.logVendorAction(
        req.user.id,
        'product_submit',
        'product',
        id,
        { product_name: product.name, sku: product.sku },
        req
      );

      res.json({
        success: true,
        message: 'Product submitted for review successfully',
        data: { product: updatedProduct }
      });

    } catch (error) {
      console.error('Submit product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit product',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Approve product (admin only)
  static async approveProduct(req, res) {
    try {
      const { id } = req.params;
      const { bigcommerce_id } = req.body;

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const updatedProduct = await Product.approve(id, req.user.id, bigcommerce_id);

      // Get vendor and user details for notifications
      const [vendor, user] = await Promise.all([
        Vendor.findById(product.vendor_id),
        VendorUser.getByVendor(product.vendor_id)
      ]);

      const ownerUser = user.find(u => u.role === 'owner') || user[0];

      // Send notifications
      await Promise.all([
        EmailService.sendProductApproval(updatedProduct, vendor, ownerUser),
        SlackService.notifyProductApproval(updatedProduct, vendor)
      ]);

      // Log activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        'product_approve',
        'product',
        id,
        { 
          product_name: product.name, 
          sku: product.sku,
          vendor_id: product.vendor_id,
          bigcommerce_id 
        },
        req
      );

      res.json({
        success: true,
        message: 'Product approved successfully',
        data: { product: updatedProduct }
      });

    } catch (error) {
      console.error('Approve product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve product',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Reject product (admin only)
  static async rejectProduct(req, res) {
    try {
      const { id } = req.params;
      const { feedback, request_revision = false } = req.body;

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Update product status
      let updatedProduct;
      if (request_revision) {
        updatedProduct = await Product.requestRevision(id, req.user.id);
      } else {
        updatedProduct = await Product.reject(id, req.user.id);
      }

      // Create product review record
      await db('product_reviews').insert({
        product_id: id,
        reviewer_id: req.user.id,
        status: request_revision ? 'needs_revision' : 'rejected',
        feedback_message: feedback
      });

      // Get vendor and user details for notifications
      const [vendor, user] = await Promise.all([
        Vendor.findById(product.vendor_id),
        VendorUser.getByVendor(product.vendor_id)
      ]);

      const ownerUser = user.find(u => u.role === 'owner') || user[0];

      // Send notifications
      await Promise.all([
        EmailService.sendProductRejection(updatedProduct, vendor, ownerUser, feedback),
        SlackService.notifyProductRejection(updatedProduct, vendor, feedback)
      ]);

      // Log activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        request_revision ? 'product_request_revision' : 'product_reject',
        'product',
        id,
        { 
          product_name: product.name, 
          sku: product.sku,
          vendor_id: product.vendor_id,
          feedback 
        },
        req
      );

      res.json({
        success: true,
        message: request_revision ? 
          'Product revision requested successfully' : 
          'Product rejected successfully',
        data: { product: updatedProduct }
      });

    } catch (error) {
      console.error('Reject product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process product review',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Delete product
  static async deleteProduct(req, res) {
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

      // Don't allow deletion of approved products by vendors
      if (req.user.type === 'vendor' && product.status === 'approved') {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete approved products. Please contact support.'
        });
      }

      // Get product images to delete from storage
      const images = await ProductImage.findByProductId(id);
      
      // Delete images from R2 storage
      for (const image of images) {
        try {
          await R2Service.deleteFile(image.file_name);
        } catch (error) {
          console.error('Error deleting image from R2:', error);
        }
      }

      // Delete product (cascades to related tables)
      await Product.delete(id);

      // Log activity
      await ActivityLogger.log({
        user_id: req.user.id,
        user_type: req.user.type,
        action: 'product_delete',
        entity_type: 'product',
        entity_id: id,
        metadata: { 
          product_name: product.name, 
          sku: product.sku,
          vendor_id: product.vendor_id 
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });

    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete product',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Bulk operations (admin only)
  static async bulkUpdateProducts(req, res) {
    try {
      const { productIds, action, status, reviewerId } = req.body;

      if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Product IDs are required'
        });
      }

      let result;
      switch (action) {
        case 'approve':
          result = await Product.bulkUpdateStatus(productIds, 'approved', req.user.id);
          break;
        case 'reject':
          result = await Product.bulkUpdateStatus(productIds, 'rejected', req.user.id);
          break;
        case 'archive':
          result = await Product.bulkUpdateStatus(productIds, 'archived', req.user.id);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid bulk action'
          });
      }

      // Log activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        `product_bulk_${action}`,
        'product',
        null,
        { 
          product_ids: productIds,
          action,
          count: productIds.length 
        },
        req
      );

      res.json({
        success: true,
        message: `Products ${action}d successfully`,
        data: { updatedCount: productIds.length }
      });

    } catch (error) {
      console.error('Bulk update products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update products',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Search products
  static async searchProducts(req, res) {
    try {
      const { q, filters = {}, page = 1, limit = 20 } = req.query;
      
      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }

      const offset = (page - 1) * limit;
      const pagination = { 
        limit: parseInt(limit), 
        offset: parseInt(offset) 
      };

      // Add vendor filter if user is vendor
      if (req.user.type === 'vendor') {
        filters.vendor_id = req.user.vendorId;
      }

      const products = await Product.searchProducts(q.trim(), filters, pagination);

      res.json({
        success: true,
        data: {
          products,
          query: q,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Search products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search products',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get product statistics
  static async getProductStats(req, res) {
    try {
      let stats;
      
      if (req.user.type === 'vendor') {
        stats = await Product.getVendorStats(req.user.vendorId);
      } else {
        stats = await Product.getAdminStats();
      }

      res.json({
        success: true,
        data: { stats }
      });

    } catch (error) {
      console.error('Get product stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Import products from CSV (vendor only)
  static async importProductsCSV(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'CSV file is required'
        });
      }

      const results = await CSVService.importProducts(req.file, req.user.vendorId);

      // Log activity
      await ActivityLogger.logVendorAction(
        req.user.id,
        'product_bulk_import',
        'product',
        null,
        { 
          total_products: results.totalProcessed,
          successful_imports: results.successCount,
          failed_imports: results.errorCount,
          file_name: req.file.originalname
        },
        req
      );

      // Notify admin via Slack
      const vendor = await Vendor.findById(req.user.vendorId);
      await SlackService.notifyBulkProductImport(
        req.user.vendorId,
        vendor.company_name,
        results.totalProcessed,
        results.successCount,
        results.errorCount
      );

      res.json({
        success: true,
        message: 'CSV import completed',
        data: results
      });

    } catch (error) {
      console.error('Import products CSV error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to import products',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Export products to CSV
  static async exportProductsCSV(req, res) {
    try {
      const { filters = {} } = req.query;
      
      // Add vendor filter if user is vendor
      if (req.user.type === 'vendor') {
        filters.vendor_id = req.user.vendorId;
      }

      const csvBuffer = await CSVService.exportProducts(filters);

      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="products-${new Date().toISOString().split('T')[0]}.csv"`
      });

      res.send(csvBuffer);

    } catch (error) {
      console.error('Export products CSV error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export products',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Bulk Product Upload via CSV
  static async bulkUploadProducts(req, res) {
    try {
      const { vendorId } = req.user;
      console.log(`🔄 Processing CSV bulk upload for vendor ${vendorId}`);

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No CSV file uploaded'
        });
      }

      const csvData = req.file.buffer.toString('utf-8');
      const Papa = require('papaparse');
      
      // Parse CSV data
      const parseResult = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.toLowerCase().trim()
      });

      if (parseResult.errors.length > 0) {
        console.error('CSV parsing errors:', parseResult.errors);
        return res.status(400).json({
          success: false,
          message: 'CSV parsing failed',
          errors: parseResult.errors
        });
      }

      const products = parseResult.data;
      console.log(`📦 Parsed ${products.length} products from CSV`);

      let processed = 0;
      let created = 0;
      let updated = 0;
      const errors = [];

      // Process each product
      for (let i = 0; i < products.length; i++) {
        const row = products[i];
        const rowNumber = i + 2; // +2 because of 0-index and header row
        
        try {
          // Validate required fields
          if (!row.name || !row.sku || !row.price) {
            errors.push({
              row: rowNumber,
              error: 'Missing required fields: name, sku, or price',
              data: row
            });
            continue;
          }

          // Check if product with SKU already exists
          const existingProduct = await Product.findBySku(row.sku);
          
          const productData = {
            name: row.name,
            description: row.description || '',
            sku: row.sku,
            price: parseFloat(row.price) || 0,
            compare_price: row.compare_price ? parseFloat(row.compare_price) : null,
            category_id: parseInt(row.category_id) || 1,
            weight: row.weight ? parseFloat(row.weight) : 0,
            dimensions: row.dimensions || '',
            status: row.status || 'draft',
            vendor_id: vendorId,
            updated_at: new Date()
          };

          if (existingProduct && existingProduct.vendor_id === vendorId) {
            // Update existing product
            await Product.update(existingProduct.id, productData);
            console.log(`✅ Updated product: ${row.name} (SKU: ${row.sku})`);
            updated++;
          } else if (existingProduct) {
            // SKU belongs to another vendor
            errors.push({
              row: rowNumber,
              error: 'SKU already exists for another vendor',
              data: row
            });
            continue;
          } else {
            // Create new product
            productData.created_at = new Date();
            const newProduct = await Product.create(productData);
            console.log(`✅ Created product: ${row.name} (SKU: ${row.sku}) → ID: ${newProduct.id}`);
            created++;
          }
          
          processed++;
          
        } catch (error) {
          console.error(`❌ Failed to process row ${rowNumber}:`, error.message);
          errors.push({
            row: rowNumber,
            error: error.message,
            data: row
          });
        }
      }

      console.log(`🎉 CSV upload completed: ${processed} processed, ${created} created, ${updated} updated, ${errors.length} errors`);

      // Log the bulk upload activity
      const ActivityLogger = require('../services/activityLogger');
      await ActivityLogger.log({
        user_id: req.user.id,
        user_type: 'vendor',
        action: 'bulk_product_upload',
        entity_type: 'product',
        entity_id: null,
        metadata: {
          total_rows: products.length,
          processed_count: processed,
          created_count: created,
          updated_count: updated,
          error_count: errors.length,
          file_name: req.file.originalname
        }
      });

      res.json({
        success: true,
        message: `Successfully processed ${processed} products`,
        data: {
          processed,
          created,
          updated,
          errors
        }
      });

    } catch (error) {
      console.error('❌ Bulk upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Bulk upload failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = ProductController;