exports.up = function(knex) {
  return knex.schema.createTable('product_variants', function(table) {
    table.increments('id').primary();
    table.integer('product_id').unsigned().notNullable();
    table.string('variant_name', 255).notNullable();
    table.string('variant_sku', 100);
    table.decimal('additional_price', 10, 2).defaultTo(0);
    table.integer('stock_quantity').defaultTo(0);
    table.json('attributes'); // color, size, material, etc.
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.integer('bigcommerce_variant_id').unsigned();
    
    table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
    table.index(['product_id']);
    table.index(['variant_sku']);
    table.index(['is_active']);
    table.index(['bigcommerce_variant_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('product_variants');
};