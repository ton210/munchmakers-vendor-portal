exports.up = function(knex) {
  return knex.schema.alterTable('products', function(table) {
    table.json('shipping_options'); // air or fast boat with pricing
    table.json('design_tool_info'); // design tool information
    table.text('design_tool_template'); // design tool template
    table.decimal('height', 8, 2); // product height in cm
    table.json('production_images'); // URLs for production images
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('products', function(table) {
    table.dropColumn('shipping_options');
    table.dropColumn('design_tool_info');
    table.dropColumn('design_tool_template');
    table.dropColumn('height');
    table.dropColumn('production_images');
  });
};