const db = require('../config/database');

class ProductCategory {
  static async create(categoryData) {
    const [category] = await db('product_categories').insert(categoryData).returning('*');
    return category;
  }

  static async findById(id) {
    return await db('product_categories').where({ id }).first();
  }

  static async findBySlug(slug) {
    return await db('product_categories').where({ slug }).first();
  }

  static async getAll(includeInactive = false) {
    let query = db('product_categories').orderBy('sort_order').orderBy('name');
    
    if (!includeInactive) {
      query = query.where('is_active', true);
    }
    
    return await query;
  }

  static async getTree(includeInactive = false) {
    let categories = await this.getAll(includeInactive);
    
    // Build tree structure
    const categoryMap = new Map();
    const rootCategories = [];

    // First pass: create map and identify roots
    categories.forEach(category => {
      category.children = [];
      categoryMap.set(category.id, category);
      
      if (!category.parent_id) {
        rootCategories.push(category);
      }
    });

    // Second pass: build tree
    categories.forEach(category => {
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children.push(category);
        }
      }
    });

    return rootCategories;
  }

  static async getChildren(parentId) {
    return await db('product_categories')
      .where({ parent_id: parentId, is_active: true })
      .orderBy('sort_order')
      .orderBy('name');
  }

  static async getParents(categoryId) {
    const parents = [];
    let currentId = categoryId;

    while (currentId) {
      const category = await this.findById(currentId);
      if (!category) break;
      
      parents.unshift(category);
      currentId = category.parent_id;
    }

    return parents;
  }

  static async update(id, updateData) {
    updateData.updated_at = new Date();
    const [category] = await db('product_categories')
      .where({ id })
      .update(updateData)
      .returning('*');
    return category;
  }

  static async delete(id) {
    // Check if category has children
    const children = await this.getChildren(id);
    if (children.length > 0) {
      throw new Error('Cannot delete category that has child categories');
    }

    // Check if category has products
    const productCount = await db('products')
      .where({ category_id: id })
      .count('id as count')
      .first();
    
    if (parseInt(productCount.count) > 0) {
      throw new Error('Cannot delete category that has products');
    }

    return await db('product_categories').where({ id }).delete();
  }

  static async getWithProductCount(includeInactive = false) {
    let query = db('product_categories')
      .select(
        'product_categories.*',
        db.raw('COUNT(products.id) as product_count')
      )
      .leftJoin('products', function() {
        this.on('product_categories.id', 'products.category_id')
          .andOn('products.status', db.raw('?', ['approved']));
      })
      .groupBy('product_categories.id')
      .orderBy('product_categories.sort_order')
      .orderBy('product_categories.name');

    if (!includeInactive) {
      query = query.where('product_categories.is_active', true);
    }

    return await query;
  }

  static async getCategoryPath(categoryId) {
    const parents = await this.getParents(categoryId);
    return parents.map(p => p.name).join(' > ');
  }

  static async searchCategories(searchTerm) {
    return await db('product_categories')
      .where('name', 'ilike', `%${searchTerm}%`)
      .orWhere('description', 'ilike', `%${searchTerm}%`)
      .where('is_active', true)
      .orderBy('name');
  }

  static async reorderCategories(categoryOrders) {
    const transaction = await db.transaction();
    
    try {
      for (const { id, sort_order } of categoryOrders) {
        await transaction('product_categories')
          .where({ id })
          .update({ sort_order, updated_at: new Date() });
      }
      
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async getTopCategories(limit = 10) {
    return await db('product_categories')
      .select(
        'product_categories.*',
        db.raw('COUNT(products.id) as product_count')
      )
      .leftJoin('products', function() {
        this.on('product_categories.id', 'products.category_id')
          .andOn('products.status', db.raw('?', ['approved']));
      })
      .where('product_categories.is_active', true)
      .groupBy('product_categories.id')
      .orderBy('product_count', 'desc')
      .orderBy('product_categories.name')
      .limit(limit);
  }

  static async getCategoryStats(categoryId = null) {
    let query = db('products')
      .select(
        db.raw('COUNT(*) as total_products'),
        db.raw('COUNT(CASE WHEN status = "approved" THEN 1 END) as approved_products'),
        db.raw('COUNT(CASE WHEN status = "pending_review" THEN 1 END) as pending_products'),
        db.raw('AVG(base_price) as avg_price')
      );

    if (categoryId) {
      query = query.where('category_id', categoryId);
    }

    const stats = await query.first();

    return {
      total_products: parseInt(stats.total_products),
      approved_products: parseInt(stats.approved_products),
      pending_products: parseInt(stats.pending_products),
      avg_price: parseFloat(stats.avg_price) || 0
    };
  }

  static async getPopularCategories(days = 30) {
    return await db('product_categories')
      .select(
        'product_categories.*',
        db.raw('COUNT(products.id) as recent_products')
      )
      .join('products', 'product_categories.id', 'products.category_id')
      .where('products.created_at', '>=', db.raw(`NOW() - INTERVAL '${days} days'`))
      .where('product_categories.is_active', true)
      .groupBy('product_categories.id')
      .orderBy('recent_products', 'desc')
      .limit(10);
  }

  static async validateCategoryHierarchy(categoryId, parentId) {
    if (!parentId) return true;

    // Check if parent would create a circular reference
    const parents = await this.getParents(parentId);
    const parentIds = parents.map(p => p.id);
    
    return !parentIds.includes(categoryId);
  }

  static async moveCategory(categoryId, newParentId) {
    // Validate hierarchy
    const isValidHierarchy = await this.validateCategoryHierarchy(categoryId, newParentId);
    if (!isValidHierarchy) {
      throw new Error('Invalid category hierarchy: circular reference detected');
    }

    return await this.update(categoryId, { parent_id: newParentId });
  }

  static async getCategoriesWithDepth() {
    const categories = await this.getAll();
    const categoryMap = new Map();
    
    categories.forEach(category => {
      category.depth = 0;
      categoryMap.set(category.id, category);
    });

    // Calculate depth
    const calculateDepth = (category, visited = new Set()) => {
      if (visited.has(category.id)) return 0; // Circular reference protection
      visited.add(category.id);

      if (!category.parent_id) {
        category.depth = 0;
      } else {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          if (parent.depth === undefined) {
            calculateDepth(parent, visited);
          }
          category.depth = parent.depth + 1;
        }
      }
      
      visited.delete(category.id);
      return category.depth;
    };

    categories.forEach(category => {
      if (category.depth === undefined) {
        calculateDepth(category);
      }
    });

    return categories.sort((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth;
      return a.sort_order - b.sort_order;
    });
  }

  static async findByBigCommerceId(bigcommerceId) {
    return await db('product_categories').where({ bigcommerce_category_id: bigcommerceId }).first();
  }

  static async update(id, updateData) {
    const [updated] = await db('product_categories')
      .where({ id })
      .update(updateData)
      .returning('*');
    return updated;
  }

  static async getCount() {
    const result = await db('product_categories').count('id as count').first();
    return parseInt(result.count);
  }

  static async deleteDuplicates() {
    // Delete categories that have duplicate BigCommerce IDs, keeping the first one
    const duplicates = await db('product_categories')
      .select('bigcommerce_category_id')
      .whereNotNull('bigcommerce_category_id')
      .groupBy('bigcommerce_category_id')
      .havingRaw('count(*) > 1');

    let deletedCount = 0;
    for (const duplicate of duplicates) {
      const categories = await db('product_categories')
        .where('bigcommerce_category_id', duplicate.bigcommerce_category_id)
        .orderBy('id', 'asc');
      
      // Keep the first one, delete the rest
      for (let i = 1; i < categories.length; i++) {
        await db('product_categories').where('id', categories[i].id).del();
        deletedCount++;
      }
    }

    return deletedCount;
  }

  static async deleteAll() {
    const count = await this.getCount();
    await db('product_categories').del();
    return count;
  }
}

module.exports = ProductCategory;