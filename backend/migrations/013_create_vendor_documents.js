exports.up = function(knex) {
  return knex.schema.createTable('vendor_documents', function(table) {
    table.increments('id').primary();
    table.integer('vendor_id').unsigned().notNullable();
    table.enum('document_type', ['tax_certificate', 'business_license', 'insurance', 'bank_details', 'other']);
    table.string('document_name', 255).notNullable();
    table.string('file_url', 500).notNullable();
    table.string('file_name', 255);
    table.integer('file_size');
    table.enum('status', ['pending', 'approved', 'rejected']).defaultTo('pending');
    table.text('rejection_reason');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.integer('reviewed_by').unsigned();
    table.timestamp('reviewed_at');
    
    table.foreign('vendor_id').references('id').inTable('vendors').onDelete('CASCADE');
    table.foreign('reviewed_by').references('id').inTable('admin_users').onDelete('SET NULL');
    table.index(['vendor_id']);
    table.index(['document_type']);
    table.index(['status']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('vendor_documents');
};