exports.up = function(knex) {
  return knex.schema.createTable('activity_logs', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned();
    table.enum('user_type', ['vendor', 'admin']).notNullable();
    table.string('action', 255).notNullable();
    table.string('entity_type', 100); // product, vendor, user, etc.
    table.integer('entity_id').unsigned();
    table.json('metadata'); // additional context data
    table.string('ip_address', 45);
    table.string('user_agent', 500);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['user_id', 'user_type']);
    table.index(['action']);
    table.index(['entity_type', 'entity_id']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('activity_logs');
};