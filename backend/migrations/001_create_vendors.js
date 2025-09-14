exports.up = function(knex) {
  return knex.schema.createTable('vendors', function(table) {
    table.increments('id').primary();
    table.string('company_name', 255).notNullable();
    table.string('contact_name', 255).notNullable();
    table.string('email', 255).unique().notNullable();
    table.string('phone', 50);
    table.text('address');
    table.string('tax_id', 100);
    table.enum('status', ['pending', 'approved', 'suspended', 'rejected']).defaultTo('pending');
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('approved_at');
    table.integer('approved_by').unsigned();
    
    table.index(['status']);
    table.index(['email']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('vendors');
};