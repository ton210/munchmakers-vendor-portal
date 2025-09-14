exports.up = function(knex) {
  return knex.schema.alterTable('products', function(table) {
    table.text('original_name'); // Store original Chinese name
    table.text('original_description'); // Store original Chinese description
    table.string('source_language', 10).defaultTo('en'); // Track source language
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('products', function(table) {
    table.dropColumn('original_name');
    table.dropColumn('original_description');
    table.dropColumn('source_language');
  });
};