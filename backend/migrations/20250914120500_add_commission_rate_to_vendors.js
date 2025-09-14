exports.up = function(knex) {
  return knex.schema.alterTable('vendors', function(table) {
    table.decimal('commission_rate', 5, 2).defaultTo(0.00);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('vendors', function(table) {
    table.dropColumn('commission_rate');
  });
};