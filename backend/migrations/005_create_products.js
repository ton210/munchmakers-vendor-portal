exports.up = function(knex) {
  return knex.schema.createTable('products', function(table) {
    table.increments('id').primary();
    table.integer('vendor_id').unsigned().notNullable();
    table.string('sku', 100).unique().notNullable();
    table.string('name', 255).notNullable();
    table.text('description');
    table.integer('category_id').unsigned();
    table.enum('status', ['draft', 'pending_review', 'approved', 'rejected', 'archived']).defaultTo('draft');
    table.decimal('base_price', 10, 2);
    table.integer('moq').defaultTo(1); // Minimum Order Quantity
    table.integer('production_time'); // in days
    table.decimal('weight', 8, 2); // in kg
    table.string('dimensions', 100); // L x W x H
    table.string('brand', 100);
    table.string('material', 255);
    table.json('attributes'); // flexible attributes storage
    table.json('seo_data'); // meta title, description, keywords
    table.text('internal_notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('submitted_at');
    table.timestamp('reviewed_at');
    table.integer('reviewed_by').unsigned();
    table.integer('bigcommerce_id').unsigned();
    
    table.foreign('vendor_id').references('id').inTable('vendors').onDelete('CASCADE');
    table.foreign('category_id').references('id').inTable('product_categories').onDelete('SET NULL');
    table.foreign('reviewed_by').references('id').inTable('admin_users').onDelete('SET NULL');
    
    table.index(['vendor_id']);
    table.index(['sku']);
    table.index(['status']);
    table.index(['category_id']);
    table.index(['created_at']);
    table.index(['bigcommerce_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('products');
};