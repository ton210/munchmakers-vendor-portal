const ProductCategory = require('../models/ProductCategory');
const Product = require('../models/Product');
const ActivityLogger = require('../services/activityLogger');

class CategoryController {
  static async getAllCategories(req, res) {
    try {
      const { include_inactive = false } = req.query;
      
      const categories = await ProductCategory.getWithProductCount(
        include_inactive === 'true'
      );

      res.json({
        success: true,
        data: { categories }
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

  static async getCategoryTree(req, res) {
    try {
      const { include_inactive = false } = req.query;
      
      const categoryTree = await ProductCategory.getTree(
        include_inactive === 'true'
      );

      res.json({
        success: true,
        data: { categories: categoryTree }
      });

    } catch (error) {
      console.error('Get category tree error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get category tree',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async getCategory(req, res) {
    try {
      const { id } = req.params;
      
      const [category, children, parents, stats] = await Promise.all([
        ProductCategory.findById(id),
        ProductCategory.getChildren(id),
        ProductCategory.getParents(id),
        ProductCategory.getCategoryStats(id)
      ]);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.json({
        success: true,
        data: {
          category,
          children,
          parents,
          stats
        }
      });

    } catch (error) {
      console.error('Get category error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get category',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async getCategoryProducts(req, res) {
    try {
      const { id } = req.params;
      const { limit = 20 } = req.query;

      const products = await Product.getProductsByCategory(id, parseInt(limit));

      res.json({
        success: true,
        data: { products }
      });

    } catch (error) {
      console.error('Get category products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get category products',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async getPopularCategories(req, res) {
    try {
      const { days = 30, limit = 10 } = req.query;

      const categories = await ProductCategory.getPopularCategories(
        parseInt(days)
      );

      res.json({
        success: true,
        data: { categories }
      });

    } catch (error) {
      console.error('Get popular categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get popular categories',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async getCategoryStats(req, res) {
    try {
      const { id } = req.params;

      const stats = await ProductCategory.getCategoryStats(id);

      res.json({
        success: true,
        data: { stats }
      });

    } catch (error) {
      console.error('Get category stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get category statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Admin-only methods
  static async createCategory(req, res) {
    try {
      const { name, parent_id, description, slug, sort_order } = req.body;

      // Check if slug already exists
      if (slug) {
        const existingCategory = await ProductCategory.findBySlug(slug);
        if (existingCategory) {
          return res.status(400).json({
            success: false,
            message: 'Category with this slug already exists'
          });
        }
      }

      // Validate parent hierarchy if parent_id is provided
      if (parent_id) {
        const parent = await ProductCategory.findById(parent_id);
        if (!parent) {
          return res.status(400).json({
            success: false,
            message: 'Parent category not found'
          });
        }
      }

      const categoryData = {
        name,
        parent_id: parent_id || null,
        description: description || '',
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        sort_order: sort_order || 0,
        is_active: true
      };

      const category = await ProductCategory.create(categoryData);

      // Log activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        'category_create',
        'category',
        category.id,
        { 
          category_name: name,
          parent_id 
        },
        req
      );

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: { category }
      });

    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create category',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const existingCategory = await ProductCategory.findById(id);
      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Check slug uniqueness if slug is being changed
      if (updateData.slug && updateData.slug !== existingCategory.slug) {
        const existingSlug = await ProductCategory.findBySlug(updateData.slug);
        if (existingSlug) {
          return res.status(400).json({
            success: false,
            message: 'Category with this slug already exists'
          });
        }
      }

      // Validate hierarchy if parent_id is being changed
      if (updateData.parent_id !== undefined) {
        if (updateData.parent_id) {
          const isValidHierarchy = await ProductCategory.validateCategoryHierarchy(
            id, 
            updateData.parent_id
          );
          
          if (!isValidHierarchy) {
            return res.status(400).json({
              success: false,
              message: 'Invalid parent category - would create circular reference'
            });
          }
        }
      }

      const category = await ProductCategory.update(id, updateData);

      // Log activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        'category_update',
        'category',
        id,
        { 
          category_name: existingCategory.name,
          updated_fields: Object.keys(updateData)
        },
        req
      );

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: { category }
      });

    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update category',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      const category = await ProductCategory.findById(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Check if category can be deleted
      try {
        await ProductCategory.delete(id);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      // Log activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        'category_delete',
        'category',
        id,
        { 
          category_name: category.name
        },
        req
      );

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });

    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete category',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async reorderCategories(req, res) {
    try {
      const { categoryOrders } = req.body;

      if (!Array.isArray(categoryOrders)) {
        return res.status(400).json({
          success: false,
          message: 'Category orders must be an array'
        });
      }

      await ProductCategory.reorderCategories(categoryOrders);

      // Log activity
      await ActivityLogger.logAdminAction(
        req.user.id,
        'categories_reorder',
        'category',
        null,
        { 
          category_count: categoryOrders.length
        },
        req
      );

      res.json({
        success: true,
        message: 'Categories reordered successfully'
      });

    } catch (error) {
      console.error('Reorder categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reorder categories',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = CategoryController;