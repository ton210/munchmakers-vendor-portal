exports.up = function(knex) {
  return knex.schema
    // Synced products from stores (separate from vendor-uploaded products)
    .createTable('synced_products', function(table) {
      table.increments('id').primary();
      table.integer('store_id').unsigned().references('id').inTable('stores').onDelete('CASCADE');
      table.string('external_product_id', 255).notNullable();
      table.string('name', 500).notNullable();
      table.text('description');
      table.string('sku', 255);
      table.decimal('price', 10, 2);
      table.integer('inventory_quantity').defaultTo(0);
      table.string('product_type', 255);
      table.json('images');
      table.json('variants');
      table.json('store_data'); // Raw product data from store
      table.boolean('is_active').defaultTo(true);
      table.timestamp('last_synced_at').defaultTo(knex.fn.now());
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.unique(['store_id', 'external_product_id']);
      table.index(['store_id']);
      table.index(['sku']);
      table.index(['is_active']);
    })

    // Product vendor assignments (default vendors for synced products)
    .createTable('product_vendor_assignments', function(table) {
      table.increments('id').primary();
      table.integer('synced_product_id').unsigned().references('id').inTable('synced_products').onDelete('CASCADE');
      table.integer('vendor_id').unsigned().references('id').inTable('vendors').onDelete('CASCADE');
      table.boolean('is_default').defaultTo(false);
      table.integer('priority').defaultTo(1); // For multiple vendors, priority order
      table.decimal('commission_rate', 5, 2); // Override vendor's default commission
      table.integer('assigned_by').unsigned().references('id').inTable('admin_users');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.unique(['synced_product_id', 'vendor_id']);
      table.index(['synced_product_id']);
      table.index(['vendor_id']);
      table.index(['is_default']);
    })

    // Global product assignment settings
    .createTable('product_assignment_settings', function(table) {
      table.increments('id').primary();
      table.string('setting_key', 255).unique().notNullable();
      table.json('setting_value').notNullable();
      table.text('description');
      table.integer('updated_by').unsigned().references('id').inTable('admin_users');
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('product_assignment_settings')
    .dropTableIfExists('product_vendor_assignments')
    .dropTableIfExists('synced_products');
};