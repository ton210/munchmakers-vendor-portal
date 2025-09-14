const db = require('../config/database');

class Product {
  static async create(productData) {
    const [product] = await db('products').insert(productData).returning('*');
    return product;
  }

  static async findById(id) {
    return await db('products').where({ id }).first();
  }

  static async findBySku(sku) {
    return await db('products').where({ sku }).first();
  }

  static async findByVendorId(vendorId, filters = {}, pagination = {}) {
    let query = db('products')
      .select(
        'products.*',
        'product_categories.name as category_name',
        db.raw('COUNT(product_images.id) as image_count')
      )
      .leftJoin('product_categories', 'products.category_id', 'product_categories.id')
      .leftJoin('product_images', 'products.id', 'product_images.product_id')
      .where('products.vendor_id', vendorId)
      .groupBy('products.id', 'product_categories.name');

    // Apply filters
    if (filters.status) {
      query = query.where('products.status', filters.status);
    }

    if (filters.category_id) {
      query = query.where('products.category_id', filters.category_id);
    }

    if (filters.search) {
      query = query.where(function() {
        this.where('products.name', 'ilike', `%${filters.search}%`)
          .orWhere('products.sku', 'ilike', `%${filters.search}%`)
          .orWhere('products.description', 'ilike', `%${filters.search}%`);
      });
    }

    // Apply pagination
    if (pagination.limit) {
      query = query.limit(pagination.limit);
    }

    if (pagination.offset) {
      query = query.offset(pagination.offset);
    }

    // Apply sorting
    const sortBy = pagination.sortBy || 'created_at';
    const sortOrder = pagination.sortOrder || 'desc';
    query = query.orderBy(`products.${sortBy}`, sortOrder);

    return await query;
  }

  static async getAll(filters = {}, pagination = {}) {
    let query = db('products')
      .select(
        'products.*',
        'vendors.company_name as vendor_name',
        'product_categories.name as category_name',
        db.raw('COUNT(product_images.id) as image_count')
      )
      .leftJoin('vendors', 'products.vendor_id', 'vendors.id')
      .leftJoin('product_categories', 'products.category_id', 'product_categories.id')
      .leftJoin('product_images', 'products.id', 'product_images.product_id')
      .groupBy('products.id', 'vendors.company_name', 'product_categories.name');

    // Apply filters
    if (filters.status) {
      query = query.where('products.status', filters.status);
    }

    if (filters.vendor_id) {
      query = query.where('products.vendor_id', filters.vendor_id);
    }

    if (filters.category_id) {
      query = query.where('products.category_id', filters.category_id);
    }

    if (filters.search) {
      query = query.where(function() {
        this.where('products.name', 'ilike', `%${filters.search}%`)
          .orWhere('products.sku', 'ilike', `%${filters.search}%`)
          .orWhere('vendors.company_name', 'ilike', `%${filters.search}%`);
      });
    }

    // Apply pagination
    if (pagination.limit) {
      query = query.limit(pagination.limit);
    }

    if (pagination.offset) {
      query = query.offset(pagination.offset);
    }

    // Apply sorting
    const sortBy = pagination.sortBy || 'created_at';
    const sortOrder = pagination.sortOrder || 'desc';
    query = query.orderBy(`products.${sortBy}`, sortOrder);

    return await query;
  }

  static async getCount(filters = {}) {
    let query = db('products').count('id as count');

    if (filters.status) {
      query = query.where('status', filters.status);
    }

    if (filters.vendor_id) {
      query = query.where('vendor_id', filters.vendor_id);
    }

    if (filters.category_id) {
      query = query.where('category_id', filters.category_id);
    }

    if (filters.search) {
      query = query.where(function() {
        this.where('name', 'ilike', `%${filters.search}%`)
          .orWhere('sku', 'ilike', `%${filters.search}%`)
          .orWhere('description', 'ilike', `%${filters.search}%`);
      });
    }

    const result = await query.first();
    return parseInt(result.count);
  }

  static async update(id, updateData) {
    updateData.updated_at = new Date();
    const [product] = await db('products')
      .where({ id })
      .update(updateData)
      .returning('*');
    return product;
  }

  static async delete(id) {
    return await db('products').where({ id }).delete();
  }

  static async submit(id, submittedBy) {
    return await this.update(id, {
      status: 'pending_review',
      submitted_at: new Date()
    });
  }

  static async approve(id, reviewedBy, bigcommerceId = null) {
    const updateData = {
      status: 'approved',
      reviewed_at: new Date(),
      reviewed_by: reviewedBy
    };

    if (bigcommerceId) {
      updateData.bigcommerce_id = bigcommerceId;
    }

    return await this.update(id, updateData);
  }

  static async reject(id, reviewedBy) {
    return await this.update(id, {
      status: 'rejected',
      reviewed_at: new Date(),
      reviewed_by: reviewedBy
    });
  }

  static async requestRevision(id, reviewedBy) {
    return await this.update(id, {
      status: 'draft',
      reviewed_at: new Date(),
      reviewed_by: reviewedBy
    });
  }

  static async getWithDetails(id) {
    const product = await db('products')
      .select(
        'products.*',
        'vendors.company_name as vendor_name',
        'vendors.email as vendor_email',
        'product_categories.name as category_name'
      )
      .leftJoin('vendors', 'products.vendor_id', 'vendors.id')
      .leftJoin('product_categories', 'products.category_id', 'product_categories.id')
      .where('products.id', id)
      .first();

    if (!product) return null;

    // Get images
    const images = await db('product_images')
      .where('product_id', id)
      .orderBy('display_order');

    // Get variants
    const variants = await db('product_variants')
      .where('product_id', id)
      .where('is_active', true)
      .orderBy('variant_name');

    // Get pricing tiers
    const pricingTiers = await db('product_pricing_tiers')
      .where('product_id', id)
      .orderBy('min_quantity');

    // Get customizations
    const customizations = await db('product_customizations')
      .where('product_id', id)
      .where('is_active', true)
      .orderBy('customization_type');

    // Get latest review
    const latestReview = await db('product_reviews')
      .select(
        'product_reviews.*',
        'admin_users.first_name',
        'admin_users.last_name'
      )
      .leftJoin('admin_users', 'product_reviews.reviewer_id', 'admin_users.id')
      .where('product_reviews.product_id', id)
      .orderBy('product_reviews.created_at', 'desc')
      .first();

    return {
      ...product,
      images,
      variants,
      pricing_tiers: pricingTiers,
      customizations,
      latest_review: latestReview
    };
  }

  static async getVendorStats(vendorId) {
    const stats = await db.raw(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_products,
        COUNT(CASE WHEN status = 'pending_review' THEN 1 END) as pending_products,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_products,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_products,
        AVG(CASE WHEN base_price IS NOT NULL THEN base_price END) as avg_price
      FROM products 
      WHERE vendor_id = ?
    `, [vendorId]);

    return stats.rows[0];
  }

  static async getAdminStats() {
    const stats = await db.raw(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN status = 'pending_review' THEN 1 END) as pending_review,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_products,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_products,
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as products_today,
        COUNT(CASE WHEN submitted_at >= CURRENT_DATE THEN 1 END) as submitted_today
      FROM products
    `);

    return stats.rows[0];
  }

  static async searchProducts(searchTerm, filters = {}, pagination = {}) {
    let query = db('products')
      .select(
        'products.*',
        'vendors.company_name as vendor_name',
        'product_categories.name as category_name'
      )
      .leftJoin('vendors', 'products.vendor_id', 'vendors.id')
      .leftJoin('product_categories', 'products.category_id', 'product_categories.id')
      .where(function() {
        this.where('products.name', 'ilike', `%${searchTerm}%`)
          .orWhere('products.sku', 'ilike', `%${searchTerm}%`)
          .orWhere('products.description', 'ilike', `%${searchTerm}%`)
          .orWhere('vendors.company_name', 'ilike', `%${searchTerm}%`);
      });

    // Apply additional filters
    if (filters.status) {
      query = query.where('products.status', filters.status);
    }

    if (filters.vendor_id) {
      query = query.where('products.vendor_id', filters.vendor_id);
    }

    if (filters.category_id) {
      query = query.where('products.category_id', filters.category_id);
    }

    // Apply pagination
    if (pagination.limit) {
      query = query.limit(pagination.limit);
    }

    if (pagination.offset) {
      query = query.offset(pagination.offset);
    }

    return await query.orderBy('products.updated_at', 'desc');
  }

  static async bulkUpdateStatus(productIds, status, reviewedBy = null) {
    const updateData = {
      status,
      updated_at: new Date()
    };

    if (reviewedBy) {
      updateData.reviewed_by = reviewedBy;
      updateData.reviewed_at = new Date();
    }

    return await db('products')
      .whereIn('id', productIds)
      .update(updateData);
  }

  static async getProductsByCategory(categoryId, limit = 10) {
    return await db('products')
      .select(
        'products.*',
        'vendors.company_name as vendor_name'
      )
      .leftJoin('vendors', 'products.vendor_id', 'vendors.id')
      .where('products.category_id', categoryId)
      .where('products.status', 'approved')
      .orderBy('products.created_at', 'desc')
      .limit(limit);
  }

  static async getRecentProducts(vendorId = null, limit = 10) {
    let query = db('products')
      .select(
        'products.*',
        'vendors.company_name as vendor_name',
        'product_categories.name as category_name'
      )
      .leftJoin('vendors', 'products.vendor_id', 'vendors.id')
      .leftJoin('product_categories', 'products.category_id', 'product_categories.id')
      .orderBy('products.created_at', 'desc')
      .limit(limit);

    if (vendorId) {
      query = query.where('products.vendor_id', vendorId);
    }

    return await query;
  }
}

module.exports = Product;