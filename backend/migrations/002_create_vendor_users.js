exports.up = function(knex) {
  return knex.schema.createTable('vendor_users', function(table) {
    table.increments('id').primary();
    table.integer('vendor_id').unsigned().notNullable();
    table.string('email', 255).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.enum('role', ['owner', 'manager', 'employee']).defaultTo('employee');
    table.timestamp('last_login');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.string('reset_token', 255);
    table.timestamp('reset_token_expires');
    
    table.foreign('vendor_id').references('id').inTable('vendors').onDelete('CASCADE');
    table.index(['vendor_id']);
    table.index(['email']);
    table.index(['is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('vendor_users');
};