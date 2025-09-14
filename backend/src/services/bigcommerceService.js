const axios = require('axios');
const ActivityLogger = require('./activityLogger');

class BigCommerceService {
  constructor() {
    this.storeHash = process.env.BC_STORE_HASH;
    this.accessToken = process.env.BC_ACCESS_TOKEN;
    this.baseURLv3 = `https://api.bigcommerce.com/stores/${this.storeHash}/v3`;
    this.baseURLv2 = `https://api.bigcommerce.com/stores/${this.storeHash}/v2`;
    
    // V3 client for most operations (categories, products)
    this.client = axios.create({
      baseURL: this.baseURLv3,
      headers: {
        'X-Auth-Token': this.accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    // V2 client for store info and legacy endpoints
    this.v2Client = axios.create({
      baseURL: this.baseURLv2,
      headers: {
        'X-Auth-Token': this.accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000
    });
  }

  // Product Management
  async createProduct(productData, vendorData) {
    try {
      const bcProduct = this.transformProductForBC(productData, vendorData);
      
      const response = await this.client.post('/catalog/products', bcProduct);
      
      console.log(`BigCommerce product created: ${response.data.data.id}`);
      return response.data.data;

    } catch (error) {
      console.error('BigCommerce create product error:', error.response?.data || error.message);
      throw new Error(`Failed to create product in BigCommerce: ${error.response?.data?.title || error.message}`);
    }
  }

  async updateProduct(bigcommerceId, productData, vendorData) {
    try {
      const bcProduct = this.transformProductForBC(productData, vendorData);
      
      const response = await this.client.put(`/catalog/products/${bigcommerceId}`, bcProduct);
      
      console.log(`BigCommerce product updated: ${bigcommerceId}`);
      return response.data.data;

    } catch (error) {
      console.error('BigCommerce update product error:', error.response?.data || error.message);
      throw new Error(`Failed to update product in BigCommerce: ${error.response?.data?.title || error.message}`);
    }
  }

  async deleteProduct(bigcommerceId) {
    try {
      await this.client.delete(`/catalog/products/${bigcommerceId}`);
      
      console.log(`BigCommerce product deleted: ${bigcommerceId}`);
      return true;

    } catch (error) {
      console.error('BigCommerce delete product error:', error.response?.data || error.message);
      throw new Error(`Failed to delete product in BigCommerce: ${error.response?.data?.title || error.message}`);
    }
  }

  async getProduct(bigcommerceId) {
    try {
      const response = await this.client.get(`/catalog/products/${bigcommerceId}`);
      return response.data.data;

    } catch (error) {
      console.error('BigCommerce get product error:', error.response?.data || error.message);
      throw new Error(`Failed to get product from BigCommerce: ${error.response?.data?.title || error.message}`);
    }
  }

  // Product Images
  async createProductImages(bigcommerceId, images) {
    try {
      const createdImages = [];
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        
        const bcImage = {
          image_url: image.image_url,
          is_thumbnail: image.is_primary || i === 0,
          sort_order: image.display_order || i,
          description: image.alt_text || ''
        };

        const response = await this.client.post(
          `/catalog/products/${bigcommerceId}/images`, 
          bcImage
        );
        
        createdImages.push(response.data.data);
      }

      console.log(`${createdImages.length} images created for product ${bigcommerceId}`);
      return createdImages;

    } catch (error) {
      console.error('BigCommerce create images error:', error.response?.data || error.message);
      throw new Error(`Failed to create product images in BigCommerce: ${error.response?.data?.title || error.message}`);
    }
  }

  async updateProductImage(bigcommerceId, imageId, imageData) {
    try {
      const bcImage = {
        image_url: imageData.image_url,
        is_thumbnail: imageData.is_primary,
        sort_order: imageData.display_order,
        description: imageData.alt_text || ''
      };

      const response = await this.client.put(
        `/catalog/products/${bigcommerceId}/images/${imageId}`, 
        bcImage
      );
      
      return response.data.data;

    } catch (error) {
      console.error('BigCommerce update image error:', error.response?.data || error.message);
      throw new Error(`Failed to update product image in BigCommerce: ${error.response?.data?.title || error.message}`);
    }
  }

  async deleteProductImage(bigcommerceId, imageId) {
    try {
      await this.client.delete(`/catalog/products/${bigcommerceId}/images/${imageId}`);
      return true;

    } catch (error) {
      console.error('BigCommerce delete image error:', error.response?.data || error.message);
      throw new Error(`Failed to delete product image in BigCommerce: ${error.response?.data?.title || error.message}`);
    }
  }

  // Categories
  async getCategories() {
    try {
      console.log('Starting BigCommerce categories fetch...');
      let allCategories = [];
      let page = 1;
      const limit = 250; // Max limit for BigCommerce API
      
      while (true) {
        console.log(`Fetching categories page ${page}...`);
        const response = await this.client.get('/catalog/categories', {
          params: {
            limit,
            page,
            sort: 'sort_order'
          }
        });

        const categories = response.data.data || [];
        allCategories = allCategories.concat(categories);
        console.log(`Fetched ${categories.length} categories from page ${page}`);

        // Check if we've got all pages
        const pagination = response.data.meta?.pagination;
        if (!pagination || page >= pagination.total_pages) {
          break;
        }
        page++;
        
        // Small delay to respect rate limits
        await this.delay(100);
      }

      console.log(`✅ Total BigCommerce categories fetched: ${allCategories.length}`);
      return allCategories;

    } catch (error) {
      console.error('❌ BigCommerce get categories error:', error.response?.data || error.message);
      throw new Error(`Failed to get categories from BigCommerce: ${error.response?.data?.title || error.message}`);
    }
  }

  // Sync categories from BigCommerce to local database
  async syncCategoriesToLocal() {
    try {
      console.log('🔄 Starting BigCommerce category sync...');
      
      // Get categories from BigCommerce
      const bcCategories = await this.getCategories();
      
      if (!bcCategories || bcCategories.length === 0) {
        console.log('⚠️ No categories found in BigCommerce');
        return { synced: 0, errors: [] };
      }

      console.log(`📦 Processing ${bcCategories.length} categories from BigCommerce...`);
      
      // Import ProductCategory model inside the function to avoid circular dependencies
      const ProductCategory = require('../models/ProductCategory');
      
      let syncedCount = 0;
      const errors = [];

      // Sort categories to process parent categories first (parent_id=0 first)
      bcCategories.sort((a, b) => {
        if (a.parent_id === 0 && b.parent_id !== 0) return -1;
        if (a.parent_id !== 0 && b.parent_id === 0) return 1;
        return a.sort_order - b.sort_order;
      });

      console.log(`📦 Sorted categories: ${bcCategories.filter(c => c.parent_id === 0).length} root categories first`);

      // Process each category
      for (const bcCategory of bcCategories) {
        try {
          console.log(`🔍 Processing category: ${bcCategory.name} (ID: ${bcCategory.id})`);
          
          // Check if category already exists by BigCommerce ID
          let existingCategory = null;
          try {
            existingCategory = await ProductCategory.findByBigCommerceId(bcCategory.id);
            console.log(`🔍 Existing category check: ${existingCategory ? 'Found' : 'Not found'}`);
          } catch (modelError) {
            console.error(`❌ ProductCategory model error:`, modelError.message);
            throw new Error(`Model operation failed: ${modelError.message}`);
          }
          
          // Generate unique slug from category name
          let baseSlug = bcCategory.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
          
          // Ensure slug is unique by appending BigCommerce ID if needed
          let slug = baseSlug;
          try {
            const existingSlug = await ProductCategory.findBySlug(slug);
            if (existingSlug && existingSlug.bigcommerce_category_id !== bcCategory.id) {
              slug = `${baseSlug}-${bcCategory.id}`;
            }
          } catch (slugError) {
            // If slug check fails, use base slug with BC ID to ensure uniqueness
            slug = `${baseSlug}-${bcCategory.id}`;
          }

          // Map BigCommerce parent_id to local database parent_id
          let localParentId = null;
          if (bcCategory.parent_id > 0) {
            try {
              const parentCategory = await ProductCategory.findByBigCommerceId(bcCategory.parent_id);
              localParentId = parentCategory ? parentCategory.id : null;
              console.log(`🔍 Parent mapping: BC ${bcCategory.parent_id} → Local ${localParentId}`);
            } catch (parentError) {
              console.log(`⚠️ Parent category BC ID ${bcCategory.parent_id} not found, creating as root category`);
              localParentId = null;
            }
          }

          const categoryData = {
            name: bcCategory.name,
            slug: slug,
            description: '', // Remove descriptions to prevent issues and improve performance
            parent_id: localParentId,
            sort_order: bcCategory.sort_order || 0,
            is_active: bcCategory.is_visible,
            bigcommerce_category_id: bcCategory.id,
            updated_at: new Date()
          };

          if (existingCategory) {
            // Update existing category (don't count as new sync)
            await ProductCategory.update(existingCategory.id, categoryData);
            console.log(`🔄 Updated existing category: ${bcCategory.name} (BC ID: ${bcCategory.id}) → Local ID: ${existingCategory.id}`);
          } else {
            // Create new category only if it doesn't exist
            categoryData.created_at = new Date();
            const newCategory = await ProductCategory.create(categoryData);
            console.log(`✅ Created NEW category: ${bcCategory.name} (BC ID: ${bcCategory.id}) → Local ID: ${newCategory.id}`);
            syncedCount++; // Only count new categories
          }
          
        } catch (error) {
          console.error(`❌ Failed to sync category ${bcCategory.name}:`, error.message);
          console.error(`❌ Full error:`, error);
          errors.push({
            categoryName: bcCategory.name,
            bigcommerceId: bcCategory.id,
            error: error.message
          });
        }
      }

      console.log(`🎉 BigCommerce category sync completed: ${syncedCount} synced, ${errors.length} errors`);
      
      // Log the sync activity (use admin user_type since system isn't allowed)
      await ActivityLogger.log({
        user_id: 1, // Use admin user ID
        user_type: 'admin',
        action: 'bigcommerce_categories_sync',
        entity_type: 'category',
        entity_id: null,
        metadata: {
          total_categories: bcCategories.length,
          synced_count: syncedCount,
          error_count: errors.length
        }
      });

      return { synced: syncedCount, total: bcCategories.length, errors };

    } catch (error) {
      console.error('❌ BigCommerce category sync failed:', error.message);
      throw error;
    }
  }

  async createCategory(categoryData) {
    try {
      const bcCategory = {
        name: categoryData.name,
        description: categoryData.description || '',
        parent_id: categoryData.parent_id || 0,
        sort_order: categoryData.sort_order || 0,
        is_visible: categoryData.is_active !== undefined ? categoryData.is_active : true
      };

      const response = await this.client.post('/catalog/categories', bcCategory);
      return response.data.data;

    } catch (error) {
      console.error('BigCommerce create category error:', error.response?.data || error.message);
      throw new Error(`Failed to create category in BigCommerce: ${error.response?.data?.title || error.message}`);
    }
  }

  // Product Variants
  async createProductVariants(bigcommerceId, variants) {
    try {
      const createdVariants = [];
      
      for (const variant of variants) {
        const bcVariant = {
          sku: variant.variant_sku,
          price: variant.additional_price || 0,
          inventory_level: variant.stock_quantity || 0,
          option_values: this.transformVariantAttributes(variant.attributes)
        };

        const response = await this.client.post(
          `/catalog/products/${bigcommerceId}/variants`, 
          bcVariant
        );
        
        createdVariants.push(response.data.data);
      }

      return createdVariants;

    } catch (error) {
      console.error('BigCommerce create variants error:', error.response?.data || error.message);
      throw new Error(`Failed to create product variants in BigCommerce: ${error.response?.data?.title || error.message}`);
    }
  }

  // Transform product data for BigCommerce format
  transformProductForBC(product, vendor) {
    const bcProduct = {
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      price: product.base_price || 0,
      weight: product.weight || 0,
      categories: product.category_id ? [product.category_id] : [],
      brand_id: 0, // Default brand, could be mapped
      inventory_level: 0, // Default inventory
      inventory_warning_level: 0,
      inventory_tracking: 'none',
      is_visible: true,
      is_featured: false,
      availability: 'available',
      condition: 'New',
      type: 'physical',
      tax_class_id: 0
    };

    // Add custom fields for vendor information
    bcProduct.custom_fields = [
      {
        name: 'vendor_id',
        value: product.vendor_id.toString()
      },
      {
        name: 'vendor_name',
        value: vendor.company_name
      },
      {
        name: 'portal_product_id',
        value: product.id.toString()
      }
    ];

    // Add dimensions if available
    if (product.dimensions) {
      const dimensions = product.dimensions.split('x').map(d => parseFloat(d.trim()));
      if (dimensions.length >= 3) {
        bcProduct.width = dimensions[0];
        bcProduct.depth = dimensions[1];
        bcProduct.height = dimensions[2];
      }
    }

    // Add SEO data if available
    if (product.seo_data) {
      const seoData = typeof product.seo_data === 'string' ? 
        JSON.parse(product.seo_data) : product.seo_data;
      
      bcProduct.page_title = seoData.title || product.name;
      bcProduct.meta_description = seoData.description || '';
      bcProduct.meta_keywords = seoData.keywords ? seoData.keywords.split(',') : [];
    }

    // Add product attributes as custom fields
    if (product.attributes) {
      const attributes = typeof product.attributes === 'string' ? 
        JSON.parse(product.attributes) : product.attributes;
      
      Object.entries(attributes).forEach(([key, value]) => {
        bcProduct.custom_fields.push({
          name: `attr_${key}`,
          value: value.toString()
        });
      });
    }

    return bcProduct;
  }

  transformVariantAttributes(attributes) {
    // This would need to be customized based on your variant structure
    // BigCommerce expects option_values array with option_id and option_value_id
    if (!attributes) return [];

    const optionValues = [];
    const attrData = typeof attributes === 'string' ? JSON.parse(attributes) : attributes;

    // This is a simplified transformation - you'd need to map to actual BC option IDs
    Object.entries(attrData).forEach(([key, value]) => {
      optionValues.push({
        option_display_name: key,
        label: value.toString()
      });
    });

    return optionValues;
  }

  // Inventory Management
  async updateInventory(bigcommerceId, quantity) {
    try {
      const response = await this.client.put(`/catalog/products/${bigcommerceId}`, {
        inventory_level: quantity,
        inventory_tracking: 'product'
      });
      
      return response.data.data;

    } catch (error) {
      console.error('BigCommerce update inventory error:', error.response?.data || error.message);
      throw new Error(`Failed to update inventory in BigCommerce: ${error.response?.data?.title || error.message}`);
    }
  }

  // Order Management (for future use)
  async getOrders(params = {}) {
    try {
      const response = await this.client.get('/orders', { params });
      return response.data.data;

    } catch (error) {
      console.error('BigCommerce get orders error:', error.response?.data || error.message);
      throw new Error(`Failed to get orders from BigCommerce: ${error.response?.data?.title || error.message}`);
    }
  }

  async getOrder(orderId) {
    try {
      const response = await this.client.get(`/orders/${orderId}`);
      return response.data.data;

    } catch (error) {
      console.error('BigCommerce get order error:', error.response?.data || error.message);
      throw new Error(`Failed to get order from BigCommerce: ${error.response?.data?.title || error.message}`);
    }
  }

  // Webhooks
  async createWebhook(scope, destination) {
    try {
      const webhook = {
        scope: scope, // e.g., 'store/order/created'
        destination: destination, // URL to receive webhook
        is_active: true
      };

      const response = await this.client.post('/hooks', webhook);
      return response.data.data;

    } catch (error) {
      console.error('BigCommerce create webhook error:', error.response?.data || error.message);
      throw new Error(`Failed to create webhook in BigCommerce: ${error.response?.data?.title || error.message}`);
    }
  }

  // Sync operations
  async syncProductToBigCommerce(product, vendor, images = [], variants = []) {
    try {
      // Create product
      const bcProduct = await this.createProduct(product, vendor);
      
      // Add images if provided
      if (images && images.length > 0) {
        await this.createProductImages(bcProduct.id, images);
      }

      // Add variants if provided
      if (variants && variants.length > 0) {
        await this.createProductVariants(bcProduct.id, variants);
      }

      // Log activity
      await ActivityLogger.log({
        user_id: null, // System action
        user_type: 'system',
        action: 'bigcommerce_product_sync',
        entity_type: 'product',
        entity_id: product.id,
        metadata: {
          bigcommerce_id: bcProduct.id,
          vendor_id: product.vendor_id,
          images_count: images.length,
          variants_count: variants.length
        }
      });

      return bcProduct;

    } catch (error) {
      console.error('BigCommerce sync error:', error);
      throw error;
    }
  }

  async removeProductFromBigCommerce(bigcommerceId, productId) {
    try {
      await this.deleteProduct(bigcommerceId);

      // Log activity
      await ActivityLogger.log({
        user_id: null, // System action
        user_type: 'system',
        action: 'bigcommerce_product_remove',
        entity_type: 'product',
        entity_id: productId,
        metadata: {
          bigcommerce_id: bigcommerceId
        }
      });

      return true;

    } catch (error) {
      console.error('BigCommerce remove error:', error);
      throw error;
    }
  }

  // Health check
  async testConnection() {
    try {
      const response = await this.v2Client.get('/store');
      console.log('✅ BigCommerce connection successful');
      console.log(`🏪 Store: ${response.data.name} (${response.data.domain})`);
      return {
        connected: true,
        store: response.data
      };

    } catch (error) {
      console.error('❌ BigCommerce connection failed:', error.response?.data || error.message);
      console.error('🔍 Attempted URL:', `${this.baseURLv2}/store`);
      console.error('🔑 Store Hash:', this.storeHash ? 'Present' : 'Missing');
      console.error('🗝️ Access Token:', this.accessToken ? 'Present' : 'Missing');
      
      return {
        connected: false,
        error: error.response?.data?.title || error.message || 'Connection failed'
      };
    }
  }

  // Rate limiting helper
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Batch operations with rate limiting
  async batchOperation(items, operation, batchSize = 5, delayMs = 1000) {
    const results = [];
    const errors = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (item, index) => {
        try {
          const result = await operation(item);
          return { index: i + index, result };
        } catch (error) {
          return { index: i + index, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        if (result.error) {
          errors.push({ index: result.index, error: result.error });
        } else {
          results.push(result.result);
        }
      });

      // Delay between batches to respect rate limits
      if (i + batchSize < items.length) {
        await this.delay(delayMs);
      }
    }

    return { results, errors };
  }
}

module.exports = new BigCommerceService();