exports.up = function(knex) {
  return knex.schema
    .table('vendors', function(table) {
      // Add new location and business identification fields
      table.string('country', 3); // ISO country code (US, CN, etc.)
      table.string('province', 100); // Province/State/Region
      table.string('business_id_number', 100); // Business registration number, VAT ID, etc.

      // Add indexes for common queries
      table.index(['country']);
      table.index(['business_id_number']);
    })
    .table('vendor_users', function(table) {
      // Add country to user record as well for easier queries
      table.string('country', 3);
      table.string('province', 100);
    });
};

exports.down = function(knex) {
  return knex.schema
    .table('vendors', function(table) {
      table.dropColumn('country');
      table.dropColumn('province');
      table.dropColumn('business_id_number');
    })
    .table('vendor_users', function(table) {
      table.dropColumn('country');
      table.dropColumn('province');
    });
};