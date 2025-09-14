exports.up = function(knex) {
  return knex.schema.table('product_categories', function(table) {
    table.integer('bigcommerce_category_id').unsigned().unique();
    table.index('bigcommerce_category_id');
  });
};

exports.down = function(knex) {
  return knex.schema.table('product_categories', function(table) {
    table.dropColumn('bigcommerce_category_id');
  });
};