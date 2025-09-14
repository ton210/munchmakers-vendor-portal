exports.up = function(knex) {
  return knex.schema.createTable('admin_users', function(table) {
    table.increments('id').primary();
    table.string('email', 255).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.enum('role', ['super_admin', 'admin', 'reviewer']).defaultTo('reviewer');
    table.json('permissions');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_login');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.string('reset_token', 255);
    table.timestamp('reset_token_expires');
    
    table.index(['email']);
    table.index(['role']);
    table.index(['is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('admin_users');
};