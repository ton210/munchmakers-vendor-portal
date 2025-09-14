const db = require('../config/database');

class SyncedProduct {
  static async create(productData) {
    const [product] = await db('synced_products').insert(productData).returning('*');
    return product;
  }

  static async findById(id) {
    return await db('synced_products').where({ id }).first();
  }

  static async findByExternalId(storeId, externalProductId) {
    return await db('synced_products')
      .where({ store_id: storeId, external_product_id: externalProductId })
      .first();
  }

  static async getAll(filters = {}, pagination = {}) {
    const { store_id, is_active, search, has_vendor } = filters;
    const { limit = 50, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = pagination;

    let query = db('synced_products')
      .select(
        'synced_products.*',
        'stores.name as store_name',
        'stores.type as store_type',
        db.raw('COUNT(product_vendor_assignments.id) as assigned_vendors_count')
      )
      .leftJoin('stores', 'synced_products.store_id', 'stores.id')
      .leftJoin('product_vendor_assignments', 'synced_products.id', 'product_vendor_assignments.synced_product_id')
      .groupBy('synced_products.id', 'stores.name', 'stores.type');

    if (store_id) {
      query = query.where('synced_products.store_id', store_id);
    }

    if (is_active !== undefined) {
      query = query.where('synced_products.is_active', is_active);
    }

    if (search) {
      query = query.where(function() {
        this.where('synced_products.name', 'ilike', `%${search}%`)
          .orWhere('synced_products.sku', 'ilike', `%${search}%`);
      });
    }

    if (has_vendor === 'true') {
      query = query.having(db.raw('COUNT(product_vendor_assignments.id) > 0'));
    } else if (has_vendor === 'false') {
      query = query.having(db.raw('COUNT(product_vendor_assignments.id) = 0'));
    }

    return await query
      .limit(limit)
      .offset(offset)
      .orderBy(`synced_products.${sortBy}`, sortOrder);
  }

  static async getCount(filters = {}) {
    const { store_id, is_active, search, has_vendor } = filters;

    let query = db('synced_products')
      .leftJoin('product_vendor_assignments', 'synced_products.id', 'product_vendor_assignments.synced_product_id')
      .count('DISTINCT synced_products.id as count');

    if (store_id) {
      query = query.where('synced_products.store_id', store_id);
    }

    if (is_active !== undefined) {
      query = query.where('synced_products.is_active', is_active);
    }

    if (search) {
      query = query.where(function() {
        this.where('synced_products.name', 'ilike', `%${search}%`)
          .orWhere('synced_products.sku', 'ilike', `%${search}%`);
      });
    }

    const result = await query.first();
    return parseInt(result.count);
  }

  static async update(id, updateData) {
    updateData.updated_at = new Date();
    const [product] = await db('synced_products')
      .where({ id })
      .update(updateData)
      .returning('*');
    return product;
  }

  static async delete(id) {
    return await db('synced_products').where({ id }).delete();
  }

  static async syncFromStore(storeId) {
    try {
      const store = await db('stores').where({ id: storeId }).first();
      if (!store) throw new Error('Store not found');

      const StoreIntegrationService = require('../services/storeIntegrationService');
      const integration = new StoreIntegrationService();
      const storeIntegration = integration.getIntegration(store.type);

      const products = await storeIntegration.getProducts(store);

      let syncedCount = 0;
      let updatedCount = 0;

      for (const productData of products) {
        const existingProduct = await SyncedProduct.findByExternalId(storeId, productData.external_product_id);

        if (existingProduct) {
          // Update existing product
          await SyncedProduct.update(existingProduct.id, {
            name: productData.name,
            description: productData.description,
            sku: productData.sku,
            price: productData.price,
            inventory_quantity: productData.inventory_quantity,
            product_type: productData.product_type,
            images: productData.images,
            variants: productData.variants,
            store_data: productData.store_data,
            last_synced_at: new Date()
          });
          updatedCount++;
        } else {
          // Create new product
          await SyncedProduct.create({
            store_id: storeId,
            external_product_id: productData.external_product_id,
            name: productData.name,
            description: productData.description,
            sku: productData.sku,
            price: productData.price,
            inventory_quantity: productData.inventory_quantity,
            product_type: productData.product_type,
            images: productData.images,
            variants: productData.variants,
            store_data: productData.store_data
          });
          syncedCount++;
        }
      }

      // Update store last sync time
      await db('stores').where({ id: storeId }).update({ last_sync_at: new Date() });

      return { syncedCount, updatedCount, totalProducts: products.length };

    } catch (error) {
      console.error('Error syncing products from store:', error);
      throw error;
    }
  }

  static async assignVendor(productId, vendorId, isDefault = false, commissionRate = null, assignedBy) {
    // Check if assignment already exists
    const existing = await db('product_vendor_assignments')
      .where({ synced_product_id: productId, vendor_id: vendorId })
      .first();

    if (existing) {
      throw new Error('Vendor is already assigned to this product');
    }

    // If setting as default, remove other defaults for this product
    if (isDefault) {
      await db('product_vendor_assignments')
        .where({ synced_product_id: productId })
        .update({ is_default: false });
    }

    const assignmentData = {
      synced_product_id: productId,
      vendor_id: vendorId,
      is_default: isDefault,
      commission_rate: commissionRate,
      assigned_by: assignedBy
    };

    const [assignment] = await db('product_vendor_assignments')
      .insert(assignmentData)
      .returning('*');

    return assignment;
  }

  static async removeVendorAssignment(productId, vendorId) {
    return await db('product_vendor_assignments')
      .where({ synced_product_id: productId, vendor_id: vendorId })
      .delete();
  }

  static async getProductVendors(productId) {
    return await db('product_vendor_assignments')
      .select(
        'product_vendor_assignments.*',
        'vendors.company_name',
        'vendors.commission_rate as default_commission_rate',
        'vendor_users.first_name',
        'vendor_users.last_name',
        'vendor_users.email'
      )
      .leftJoin('vendors', 'product_vendor_assignments.vendor_id', 'vendors.id')
      .leftJoin('vendor_users', 'vendors.id', 'vendor_users.vendor_id')
      .where('product_vendor_assignments.synced_product_id', productId)
      .where('vendor_users.role', 'owner')
      .orderBy('product_vendor_assignments.priority');
  }

  static async getUnassignedProducts(storeId = null) {
    let query = db('synced_products')
      .select('synced_products.*', 'stores.name as store_name')
      .leftJoin('stores', 'synced_products.store_id', 'stores.id')
      .leftJoin('product_vendor_assignments', 'synced_products.id', 'product_vendor_assignments.synced_product_id')
      .whereNull('product_vendor_assignments.id')
      .where('synced_products.is_active', true);

    if (storeId) {
      query = query.where('synced_products.store_id', storeId);
    }

    return await query.orderBy('synced_products.created_at', 'desc');
  }

  static async bulkAssignVendor(productIds, vendorId, isDefault = false, commissionRate = null, assignedBy) {
    const assignments = productIds.map(productId => ({
      synced_product_id: productId,
      vendor_id: vendorId,
      is_default: isDefault,
      commission_rate: commissionRate,
      assigned_by: assignedBy
    }));

    return await db('product_vendor_assignments').insert(assignments).returning('*');
  }

  static async getProductStats(storeId = null) {
    let query = db('synced_products')
      .leftJoin('product_vendor_assignments', 'synced_products.id', 'product_vendor_assignments.synced_product_id');

    if (storeId) {
      query = query.where('synced_products.store_id', storeId);
    }

    const stats = await query
      .select(
        db.raw('COUNT(DISTINCT synced_products.id) as total_products'),
        db.raw('COUNT(DISTINCT CASE WHEN synced_products.is_active THEN synced_products.id END) as active_products'),
        db.raw('COUNT(DISTINCT CASE WHEN product_vendor_assignments.id IS NOT NULL THEN synced_products.id END) as assigned_products'),
        db.raw('COUNT(DISTINCT CASE WHEN product_vendor_assignments.is_default THEN synced_products.id END) as default_assigned_products'),
        db.raw('SUM(synced_products.inventory_quantity) as total_inventory'),
        db.raw('AVG(synced_products.price) as average_price')
      )
      .first();

    return {
      total_products: parseInt(stats.total_products),
      active_products: parseInt(stats.active_products),
      assigned_products: parseInt(stats.assigned_products),
      unassigned_products: parseInt(stats.total_products) - parseInt(stats.assigned_products),
      default_assigned_products: parseInt(stats.default_assigned_products),
      total_inventory: parseInt(stats.total_inventory) || 0,
      average_price: parseFloat(stats.average_price) || 0
    };
  }
}

module.exports = SyncedProduct;