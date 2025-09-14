exports.up = function(knex) {
  return knex.schema
    // Stores table (Shopify, BigCommerce, WooCommerce)
    .createTable('stores', function(table) {
      table.increments('id').primary();
      table.string('name', 255).notNullable();
      table.enum('type', ['shopify', 'bigcommerce', 'woocommerce']).notNullable();
      table.string('store_url', 500).notNullable();
      table.json('api_credentials').notNullable();
      table.boolean('is_active').defaultTo(true);
      table.boolean('sync_enabled').defaultTo(true);
      table.timestamp('last_sync_at');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })

    // Orders table
    .createTable('orders', function(table) {
      table.increments('id').primary();
      table.integer('store_id').unsigned().references('id').inTable('stores').onDelete('CASCADE');
      table.string('external_order_id', 255).notNullable();
      table.string('order_number', 100);
      table.string('customer_email', 255);
      table.string('customer_name', 255);
      table.string('customer_phone', 50);
      table.json('billing_address');
      table.json('shipping_address');
      table.decimal('total_amount', 10, 2).notNullable();
      table.string('currency', 10).defaultTo('USD');
      table.string('order_status', 50).notNullable();
      table.string('fulfillment_status', 50);
      table.string('payment_status', 50);
      table.text('notes');
      table.string('tags', 500);
      table.timestamp('order_date').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.unique(['store_id', 'external_order_id']);
      table.index(['store_id']);
      table.index(['order_date']);
      table.index(['order_status']);
    })

    // Order items table
    .createTable('order_items', function(table) {
      table.increments('id').primary();
      table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('CASCADE');
      table.string('external_item_id', 255);
      table.string('product_name', 500).notNullable();
      table.string('sku', 255);
      table.integer('quantity').notNullable();
      table.decimal('unit_price', 10, 2).notNullable();
      table.decimal('total_price', 10, 2).notNullable();
      table.string('variant_title', 500);
      table.json('product_data');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })

    // Vendor assignments table
    .createTable('vendor_assignments', function(table) {
      table.increments('id').primary();
      table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('CASCADE');
      table.integer('vendor_id').unsigned().references('id').inTable('vendors').onDelete('CASCADE');
      table.integer('assigned_by').unsigned().references('id').inTable('admin_users');
      table.enum('assignment_type', ['full', 'partial']).defaultTo('full');
      table.json('items'); // For partial assignments
      table.decimal('commission_amount', 10, 2);
      table.enum('status', ['assigned', 'accepted', 'in_progress', 'completed', 'cancelled']).defaultTo('assigned');
      table.text('notes');
      table.timestamp('assigned_at').defaultTo(knex.fn.now());
      table.timestamp('accepted_at');
      table.timestamp('completed_at');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.index(['vendor_id']);
      table.index(['order_id']);
    })

    // Order status history table
    .createTable('order_status_history', function(table) {
      table.increments('id').primary();
      table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('CASCADE');
      table.integer('vendor_assignment_id').unsigned().references('id').inTable('vendor_assignments').onDelete('SET NULL');
      table.integer('changed_by').unsigned().references('id').inTable('admin_users');
      table.string('old_status', 50);
      table.string('new_status', 50).notNullable();
      table.text('notes');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })

    // Notifications table
    .createTable('notifications', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned();
      table.string('user_type', 20); // 'vendor' or 'admin'
      table.string('type', 50).notNullable();
      table.string('title', 255).notNullable();
      table.text('message').notNullable();
      table.json('data');
      table.boolean('is_read').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index(['user_id', 'user_type', 'is_read']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('notifications')
    .dropTableIfExists('order_status_history')
    .dropTableIfExists('vendor_assignments')
    .dropTableIfExists('order_items')
    .dropTableIfExists('orders')
    .dropTableIfExists('stores');
};