exports.up = function(knex) {
  return knex.schema.createTable('product_reviews', function(table) {
    table.increments('id').primary();
    table.integer('product_id').unsigned().notNullable();
    table.integer('reviewer_id').unsigned().notNullable();
    table.enum('status', ['pending', 'approved', 'rejected', 'needs_revision']).defaultTo('pending');
    table.text('feedback_message');
    table.text('internal_notes');
    table.json('revision_requests'); // structured feedback for revisions
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
    table.foreign('reviewer_id').references('id').inTable('admin_users').onDelete('CASCADE');
    table.index(['product_id']);
    table.index(['reviewer_id']);
    table.index(['status']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('product_reviews');
};