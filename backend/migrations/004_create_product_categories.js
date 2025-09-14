exports.up = function(knex) {
  return knex.schema.createTable('product_categories', function(table) {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.integer('parent_id').unsigned();
    table.string('slug', 255).unique().notNullable();
    table.text('description');
    table.boolean('is_active').defaultTo(true);
    table.integer('sort_order').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.foreign('parent_id').references('id').inTable('product_categories').onDelete('SET NULL');
    table.index(['parent_id']);
    table.index(['slug']);
    table.index(['is_active']);
    table.index(['sort_order']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('product_categories');
};