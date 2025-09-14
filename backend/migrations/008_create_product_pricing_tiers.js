exports.up = function(knex) {
  return knex.schema.createTable('product_pricing_tiers', function(table) {
    table.increments('id').primary();
    table.integer('product_id').unsigned().notNullable();
    table.integer('min_quantity').notNullable();
    table.integer('max_quantity');
    table.decimal('unit_price', 10, 2).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
    table.index(['product_id']);
    table.index(['min_quantity']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('product_pricing_tiers');
};