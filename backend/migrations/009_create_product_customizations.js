exports.up = function(knex) {
  return knex.schema.createTable('product_customizations', function(table) {
    table.increments('id').primary();
    table.integer('product_id').unsigned().notNullable();
    table.enum('customization_type', ['embroidery', 'printing', 'engraving', 'embossing', 'other']);
    table.json('options'); // available customization options
    table.decimal('additional_cost', 10, 2).defaultTo(0);
    table.integer('setup_time'); // additional setup time in days
    table.text('description');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
    table.index(['product_id']);
    table.index(['customization_type']);
    table.index(['is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('product_customizations');
};