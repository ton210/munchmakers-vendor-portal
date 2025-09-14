exports.up = function(knex) {
  return knex.schema.createTable('sessions', function(table) {
    table.string('sid', 255).primary();
    table.json('sess').notNullable();
    table.timestamp('expire', 6).notNullable();
    
    table.index(['expire']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('sessions');
};