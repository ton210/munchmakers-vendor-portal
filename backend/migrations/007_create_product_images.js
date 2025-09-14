exports.up = function(knex) {
  return knex.schema.createTable('product_images', function(table) {
    table.increments('id').primary();
    table.integer('product_id').unsigned().notNullable();
    table.string('image_url', 500).notNullable();
    table.string('alt_text', 255);
    table.boolean('is_primary').defaultTo(false);
    table.integer('display_order').defaultTo(0);
    table.string('file_name', 255);
    table.integer('file_size');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
    table.index(['product_id']);
    table.index(['is_primary']);
    table.index(['display_order']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('product_images');
};