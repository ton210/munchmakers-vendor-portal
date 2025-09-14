exports.up = function(knex) {
  return knex.schema.createTable('vendor_messages', function(table) {
    table.increments('id').primary();
    table.integer('vendor_id').unsigned().notNullable();
    table.integer('sender_id').unsigned(); // NULL for vendor messages, admin user ID for admin responses
    table.enum('sender_type', ['vendor', 'admin']).notNullable();
    table.string('subject', 255);
    table.text('message').notNullable();
    table.enum('priority', ['low', 'normal', 'high', 'urgent']).defaultTo('normal');
    table.enum('status', ['open', 'in_progress', 'resolved', 'closed']).defaultTo('open');
    table.integer('thread_id').unsigned(); // For grouping related messages
    table.boolean('is_internal').defaultTo(false); // For admin-only notes
    table.json('attachments'); // File attachments metadata
    table.timestamp('read_at'); // When admin read the message
    table.integer('read_by'); // Which admin read it
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('vendor_id').references('id').inTable('vendors').onDelete('CASCADE');
    table.foreign('sender_id').references('id').inTable('admin_users').onDelete('SET NULL');
    table.foreign('read_by').references('id').inTable('admin_users').onDelete('SET NULL');

    table.index(['vendor_id']);
    table.index(['sender_type']);
    table.index(['status']);
    table.index(['priority']);
    table.index(['thread_id']);
    table.index(['created_at']);
    table.index(['read_at']);
  })
  .then(() => {
    return knex.schema.createTable('message_notifications', function(table) {
      table.increments('id').primary();
      table.integer('message_id').unsigned().notNullable();
      table.enum('notification_type', ['slack', 'email', 'sms']).notNullable();
      table.enum('status', ['pending', 'sent', 'failed']).defaultTo('pending');
      table.string('recipient', 255); // Slack channel, email, phone number
      table.text('notification_content');
      table.text('error_message');
      table.timestamp('sent_at');
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.foreign('message_id').references('id').inTable('vendor_messages').onDelete('CASCADE');
      table.index(['message_id']);
      table.index(['notification_type']);
      table.index(['status']);
    });
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('message_notifications')
    .then(() => knex.schema.dropTable('vendor_messages'));
};