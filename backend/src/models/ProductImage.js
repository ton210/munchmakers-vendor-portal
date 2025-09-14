const db = require('../config/database');

class ProductImage {
  static async create(imageData) {
    const [image] = await db('product_images').insert(imageData).returning('*');
    return image;
  }

  static async findById(id) {
    return await db('product_images').where({ id }).first();
  }

  static async findByProductId(productId) {
    return await db('product_images')
      .where({ product_id: productId })
      .orderBy('display_order');
  }

  static async update(id, updateData) {
    updateData.updated_at = new Date();
    const [image] = await db('product_images')
      .where({ id })
      .update(updateData)
      .returning('*');
    return image;
  }

  static async delete(id) {
    return await db('product_images').where({ id }).delete();
  }

  static async deleteByProductId(productId) {
    return await db('product_images').where({ product_id: productId }).delete();
  }

  static async setPrimary(productId, imageId) {
    // First, unset all primary images for this product
    await db('product_images')
      .where({ product_id: productId })
      .update({ is_primary: false, updated_at: new Date() });

    // Then set the specified image as primary
    return await this.update(imageId, { is_primary: true });
  }

  static async getPrimaryImage(productId) {
    return await db('product_images')
      .where({ product_id: productId, is_primary: true })
      .first();
  }

  static async reorderImages(productId, imageOrders) {
    const transaction = await db.transaction();
    
    try {
      for (const { id, display_order } of imageOrders) {
        await transaction('product_images')
          .where({ id, product_id: productId })
          .update({ display_order, updated_at: new Date() });
      }
      
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async bulkCreate(productId, images) {
    const imageData = images.map((image, index) => ({
      product_id: productId,
      image_url: image.image_url,
      alt_text: image.alt_text || '',
      is_primary: index === 0, // First image is primary by default
      display_order: index,
      file_name: image.file_name,
      file_size: image.file_size,
      created_at: new Date(),
      updated_at: new Date()
    }));

    return await db('product_images').insert(imageData).returning('*');
  }

  static async getImageCount(productId) {
    const result = await db('product_images')
      .where({ product_id: productId })
      .count('id as count')
      .first();
    
    return parseInt(result.count);
  }

  static async validateImageOwnership(imageId, vendorId) {
    const result = await db('product_images')
      .join('products', 'product_images.product_id', 'products.id')
      .where('product_images.id', imageId)
      .where('products.vendor_id', vendorId)
      .first();

    return !!result;
  }

  static async getImagesWithProducts(vendorId = null, limit = 50) {
    let query = db('product_images')
      .select(
        'product_images.*',
        'products.name as product_name',
        'products.sku as product_sku',
        'vendors.company_name as vendor_name'
      )
      .join('products', 'product_images.product_id', 'products.id')
      .join('vendors', 'products.vendor_id', 'vendors.id')
      .orderBy('product_images.created_at', 'desc')
      .limit(limit);

    if (vendorId) {
      query = query.where('vendors.id', vendorId);
    }

    return await query;
  }

  static async getImagesByStatus(productStatus, limit = 50) {
    return await db('product_images')
      .select(
        'product_images.*',
        'products.name as product_name',
        'products.status as product_status'
      )
      .join('products', 'product_images.product_id', 'products.id')
      .where('products.status', productStatus)
      .orderBy('product_images.created_at', 'desc')
      .limit(limit);
  }

  // Analytics methods
  static async getImageStats(vendorId = null) {
    let query = db('product_images')
      .join('products', 'product_images.product_id', 'products.id');

    if (vendorId) {
      query = query.where('products.vendor_id', vendorId);
    }

    const stats = await query
      .select(
        db.raw('COUNT(*) as total_images'),
        db.raw('COUNT(CASE WHEN product_images.is_primary THEN 1 END) as primary_images'),
        db.raw('AVG(product_images.file_size) as avg_file_size'),
        db.raw('SUM(product_images.file_size) as total_file_size')
      )
      .first();

    return {
      total_images: parseInt(stats.total_images),
      primary_images: parseInt(stats.primary_images),
      avg_file_size: parseFloat(stats.avg_file_size) || 0,
      total_file_size: parseInt(stats.total_file_size) || 0
    };
  }

  static async getLargestImages(limit = 10) {
    return await db('product_images')
      .select(
        'product_images.*',
        'products.name as product_name',
        'vendors.company_name as vendor_name'
      )
      .join('products', 'product_images.product_id', 'products.id')
      .join('vendors', 'products.vendor_id', 'vendors.id')
      .orderBy('product_images.file_size', 'desc')
      .limit(limit);
  }

  static async getImagesNeedingAltText() {
    return await db('product_images')
      .select(
        'product_images.*',
        'products.name as product_name',
        'vendors.company_name as vendor_name'
      )
      .join('products', 'product_images.product_id', 'products.id')
      .join('vendors', 'products.vendor_id', 'vendors.id')
      .where(function() {
        this.whereNull('product_images.alt_text')
          .orWhere('product_images.alt_text', '');
      })
      .orderBy('product_images.created_at', 'desc');
  }
}

module.exports = ProductImage;