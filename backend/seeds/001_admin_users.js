const bcrypt = require('bcryptjs');

exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('admin_users').del()
    .then(function () {
      // Inserts seed entries
      return knex('admin_users').insert([
        {
          id: 1,
          email: 'admin@munchmakers.com',
          password_hash: bcrypt.hashSync('Admin123!', 10),
          first_name: 'Super',
          last_name: 'Admin',
          role: 'super_admin',
          permissions: JSON.stringify([
            'manage_vendors',
            'manage_products', 
            'manage_admins',
            'view_reports',
            'manage_categories'
          ]),
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          email: 'reviewer@munchmakers.com',
          password_hash: bcrypt.hashSync('Reviewer123!', 10),
          first_name: 'Product',
          last_name: 'Reviewer',
          role: 'reviewer',
          permissions: JSON.stringify([
            'review_products',
            'view_vendors'
          ]),
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 3,
          email: 'demo@admin.com',
          password_hash: bcrypt.hashSync('admin123', 10),
          first_name: 'Demo',
          last_name: 'Admin',
          role: 'admin',
          permissions: JSON.stringify([
            'manage_vendors',
            'manage_products',
            'view_reports',
            'manage_categories'
          ]),
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    });
};