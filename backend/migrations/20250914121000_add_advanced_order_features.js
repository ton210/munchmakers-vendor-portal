exports.up = function(knex) {
  return knex.schema
    // Order item assignments for splitting orders
    .createTable('order_item_assignments', function(table) {
      table.increments('id').primary();
      table.integer('vendor_assignment_id').unsigned().references('id').inTable('vendor_assignments').onDelete('CASCADE');
      table.integer('order_item_id').unsigned().references('id').inTable('order_items').onDelete('CASCADE');
      table.integer('quantity').notNullable();
      table.decimal('assigned_amount', 10, 2).notNullable();
      table.string('status', 50).defaultTo('assigned');
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index(['vendor_assignment_id']);
    })

    // Tracking information table
    .createTable('order_tracking', function(table) {
      table.increments('id').primary();
      table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('CASCADE');
      table.integer('vendor_assignment_id').unsigned().references('id').inTable('vendor_assignments').onDelete('CASCADE');
      table.string('tracking_number', 255);
      table.string('carrier', 100);
      table.string('tracking_url', 500);
      table.timestamp('shipped_date');
      table.timestamp('delivered_date');
      table.string('status', 50).defaultTo('pending');
      table.text('notes');
      table.integer('created_by').unsigned().references('id').inTable('admin_users');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.index(['order_id']);
      table.index(['vendor_assignment_id']);
    })

    // Design files and attachments
    .createTable('order_attachments', function(table) {
      table.increments('id').primary();
      table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('CASCADE');
      table.integer('vendor_assignment_id').unsigned().references('id').inTable('vendor_assignments').onDelete('SET NULL');
      table.string('filename', 255).notNullable();
      table.string('original_filename', 255).notNullable();
      table.string('file_path', 500).notNullable();
      table.integer('file_size');
      table.string('mime_type', 100);
      table.enum('file_type', ['design', 'specification', 'proof', 'other']);
      table.integer('uploaded_by').unsigned();
      table.boolean('is_public').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index(['order_id']);
    })

    // Zakeke integration data
    .createTable('zakeke_orders', function(table) {
      table.increments('id').primary();
      table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('CASCADE');
      table.string('zakeke_order_id', 255);
      table.json('customization_data');
      table.json('design_files');
      table.string('artwork_status', 50).defaultTo('pending');
      table.timestamp('synced_at');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.index(['order_id']);
    })

    // Customer proof approvals table
    .createTable('customer_proof_approvals', function(table) {
      table.increments('id').primary();
      table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('CASCADE');
      table.integer('order_item_id').unsigned().references('id').inTable('order_items').onDelete('CASCADE');
      table.integer('vendor_assignment_id').unsigned().references('id').inTable('vendor_assignments').onDelete('CASCADE');
      table.enum('proof_type', ['design_proof', 'production_proof']).notNullable();
      table.json('proof_images').notNullable();
      table.enum('status', ['pending', 'approved', 'rejected', 'revision_requested']).defaultTo('pending');
      table.string('customer_email', 255).notNullable();
      table.string('customer_name', 255);
      table.string('approval_token', 255).unique().notNullable();
      table.timestamp('sent_at').defaultTo(knex.fn.now());
      table.timestamp('responded_at');
      table.text('response_notes');
      table.timestamp('expires_at').defaultTo(knex.raw('CURRENT_TIMESTAMP + INTERVAL \'7 days\''));
      table.integer('created_by').unsigned();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.index(['order_id']);
      table.index(['approval_token']);
      table.index(['status']);
      table.index(['expires_at']);
    })

    // Proof images table
    .createTable('proof_images', function(table) {
      table.increments('id').primary();
      table.integer('proof_approval_id').unsigned().references('id').inTable('customer_proof_approvals').onDelete('CASCADE');
      table.integer('order_item_id').unsigned().references('id').inTable('order_items').onDelete('CASCADE');
      table.string('filename', 255).notNullable();
      table.string('original_filename', 255).notNullable();
      table.string('file_path', 500).notNullable();
      table.integer('file_size');
      table.string('mime_type', 100);
      table.string('image_url', 500);
      table.string('thumbnail_url', 500);
      table.integer('uploaded_by').unsigned();
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index(['proof_approval_id']);
    })

    // Order production status tracking
    .createTable('order_production_status', function(table) {
      table.increments('id').primary();
      table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('CASCADE');
      table.integer('vendor_assignment_id').unsigned().references('id').inTable('vendor_assignments').onDelete('CASCADE');
      table.string('design_proof_status', 50).defaultTo('pending');
      table.string('production_proof_status', 50).defaultTo('pending');
      table.text('blocked_reason');
      table.integer('updated_by').unsigned();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.index(['order_id']);
      table.index(['vendor_assignment_id']);
    })

    // System settings for advanced features
    .createTable('system_settings', function(table) {
      table.increments('id').primary();
      table.string('setting_key', 255).unique().notNullable();
      table.json('setting_value').notNullable();
      table.text('description');
      table.integer('updated_by').unsigned();
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('system_settings')
    .dropTableIfExists('order_production_status')
    .dropTableIfExists('proof_images')
    .dropTableIfExists('customer_proof_approvals')
    .dropTableIfExists('zakeke_orders')
    .dropTableIfExists('order_attachments')
    .dropTableIfExists('order_tracking')
    .dropTableIfExists('order_item_assignments');
};