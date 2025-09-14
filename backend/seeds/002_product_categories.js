exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('product_categories').del()
    .then(function () {
      // Inserts seed entries
      return knex('product_categories').insert([
        // Root categories
        {
          id: 1,
          name: 'Smoking Accessories',
          slug: 'smoking-accessories',
          description: 'High-quality smoking accessories and equipment',
          parent_id: null,
          sort_order: 1,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          name: 'Custom Merchandise',
          slug: 'custom-merchandise',
          description: 'Customizable promotional products and merchandise',
          parent_id: null,
          sort_order: 2,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 3,
          name: 'Vaping Products',
          slug: 'vaping-products',
          description: 'Vaporizers and vaping accessories',
          parent_id: null,
          sort_order: 3,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        
        // Smoking Accessories subcategories
        {
          id: 4,
          name: 'Grinders',
          slug: 'grinders',
          description: 'Herb grinders in various sizes and materials',
          parent_id: 1,
          sort_order: 1,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 5,
          name: 'Rolling Papers',
          slug: 'rolling-papers',
          description: 'Premium rolling papers and wraps',
          parent_id: 1,
          sort_order: 2,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 6,
          name: 'Rolling Trays',
          slug: 'rolling-trays',
          description: 'Rolling trays for organized preparation',
          parent_id: 1,
          sort_order: 3,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 7,
          name: 'Lighters',
          slug: 'lighters',
          description: 'Butane lighters and torch lighters',
          parent_id: 1,
          sort_order: 4,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        
        // Custom Merchandise subcategories
        {
          id: 8,
          name: 'Custom Lighters',
          slug: 'custom-lighters',
          description: 'Personalized and branded lighters',
          parent_id: 2,
          sort_order: 1,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 9,
          name: 'Custom Rolling Papers',
          slug: 'custom-rolling-papers',
          description: 'Branded rolling papers with custom designs',
          parent_id: 2,
          sort_order: 2,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 10,
          name: 'Custom Trays',
          slug: 'custom-trays',
          description: 'Personalized rolling trays and serving trays',
          parent_id: 2,
          sort_order: 3,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        
        // Vaping Products subcategories
        {
          id: 11,
          name: 'Dry Herb Vaporizers',
          slug: 'dry-herb-vaporizers',
          description: 'Portable and desktop dry herb vaporizers',
          parent_id: 3,
          sort_order: 1,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 12,
          name: 'Vape Accessories',
          slug: 'vape-accessories',
          description: 'Vaporizer accessories and replacement parts',
          parent_id: 3,
          sort_order: 2,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    });
};