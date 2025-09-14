exports.up = function(knex) {
  return knex.schema.createTable('vendor_financials', function(table) {
    table.increments('id').primary();
    table.integer('vendor_id').unsigned().notNullable();
    table.string('transaction_type', 50).notNullable(); // 'sale', 'commission', 'fee', 'payout', 'adjustment'
    table.string('reference_id', 100); // Order ID, Product ID, etc.
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('USD');
    table.text('description');
    table.enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled']).defaultTo('pending');
    table.date('transaction_date').notNullable();
    table.date('payout_date'); // When vendor should be paid
    table.string('payout_method', 50); // 'bank_transfer', 'paypal', 'check', etc.
    table.json('metadata'); // Additional transaction details
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('vendor_id').references('id').inTable('vendors').onDelete('CASCADE');
    table.index(['vendor_id']);
    table.index(['transaction_type']);
    table.index(['status']);
    table.index(['transaction_date']);
    table.index(['payout_date']);
  })
  .then(() => {
    return knex.schema.createTable('vendor_payouts', function(table) {
      table.increments('id').primary();
      table.integer('vendor_id').unsigned().notNullable();
      table.decimal('amount', 10, 2).notNullable();
      table.string('currency', 3).defaultTo('USD');
      table.enum('status', ['pending', 'processing', 'completed', 'failed']).defaultTo('pending');
      table.date('payout_date').notNullable();
      table.string('payout_method', 50);
      table.string('transaction_reference', 100); // Bank transaction ID, PayPal ID, etc.
      table.text('notes');
      table.json('included_transactions'); // Array of financial transaction IDs included in this payout
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.foreign('vendor_id').references('id').inTable('vendors').onDelete('CASCADE');
      table.index(['vendor_id']);
      table.index(['status']);
      table.index(['payout_date']);
    });
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('vendor_payouts')
    .then(() => knex.schema.dropTable('vendor_financials'));
};