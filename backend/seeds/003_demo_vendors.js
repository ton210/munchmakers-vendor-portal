const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Check if demo vendor already exists
  const existingVendor = await knex('vendors').where('company_name', 'Demo Restaurant').first();
  
  if (existingVendor) {
    console.log('Demo vendor already exists, skipping...');
    return;
  }

  console.log('Creating demo vendor account...');

  // Create demo vendor
  const [vendor] = await knex('vendors').insert({
    company_name: 'Demo Restaurant',
    email: 'demo@restaurant.com',
    contact_name: 'Demo Owner',
    phone: '(555) 123-DEMO',
    address: '123 Demo Street, Demo City, CA 90210',
    tax_id: '12-DEMO123',
    status: 'approved', // Pre-approved for immediate testing
    created_at: new Date(),
    updated_at: new Date()
  }).returning('*');

  console.log(`Created demo vendor with ID: ${vendor.id}`);

  // Create demo vendor user account
  const hashedPassword = await bcrypt.hash('demo123', 12);
  
  const [vendorUser] = await knex('vendor_users').insert({
    vendor_id: vendor.id,
    email: 'demo@restaurant.com',
    password: hashedPassword,
    first_name: 'Demo',
    last_name: 'Owner',
    role: 'owner',
    is_active: true,
    email_verified: true,
    created_at: new Date(),
    updated_at: new Date()
  }).returning('*');

  console.log(`Created demo vendor user with ID: ${vendorUser.id}`);

  // Create some demo products for the vendor
  const demoProducts = [
    {
      vendor_id: vendor.id,
      name: 'Signature Burger',
      description: 'Our famous house burger with special sauce',
      sku: 'DEMO-BURGER-001',
      price: 15.99,
      compare_price: 18.99,
      category_id: 1,
      status: 'approved',
      weight: 0.75,
      dimensions: '6x6x3',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      vendor_id: vendor.id,
      name: 'Craft Beer Selection',
      description: 'Locally brewed craft beer varieties',
      sku: 'DEMO-BEER-001',
      price: 8.50,
      category_id: 1,
      status: 'pending',
      weight: 1.2,
      dimensions: '3x3x9',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      vendor_id: vendor.id,
      name: 'Artisan Pizza',
      description: 'Wood-fired pizza with organic ingredients',
      sku: 'DEMO-PIZZA-001',
      price: 22.00,
      compare_price: 25.00,
      category_id: 1,
      status: 'draft',
      weight: 1.5,
      dimensions: '12x12x2',
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  await knex('products').insert(demoProducts);
  console.log(`Created ${demoProducts.length} demo products`);

  console.log('✅ Demo vendor account setup complete!');
  console.log('Demo Login Credentials:');
  console.log('Email: demo@restaurant.com');
  console.log('Password: demo123');
};