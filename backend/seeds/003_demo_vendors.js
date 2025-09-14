const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  console.log('Creating demo vendor accounts...');

  const demoVendors = [
    {
      company_name: 'Demo Restaurant',
      email: 'demo@restaurant.com',
      contact_name: 'Demo Owner',
      phone: '(555) 123-DEMO',
      address: '123 Demo Street, Demo City, CA 90210',
      tax_id: '12-DEMO123',
      status: 'approved',
      userEmail: 'demo@restaurant.com',
      userPassword: 'demo123',
      firstName: 'Demo',
      lastName: 'Owner'
    },
    {
      company_name: 'Artisan Coffee Co',
      email: 'vendor@coffee.com',
      contact_name: 'Sarah Johnson',
      phone: '(555) 456-CAFE',
      address: '456 Coffee Lane, Bean City, OR 97201',
      tax_id: '12-COFFEE456',
      status: 'approved',
      userEmail: 'vendor@coffee.com',
      userPassword: 'coffee123',
      firstName: 'Sarah',
      lastName: 'Johnson'
    },
    {
      company_name: 'Organic Farms LLC',
      email: 'info@organicfarms.com',
      contact_name: 'Michael Green',
      phone: '(555) 789-FARM',
      address: '789 Farm Road, Green Valley, CA 95667',
      tax_id: '12-ORGANIC789',
      status: 'pending',
      userEmail: 'info@organicfarms.com',
      userPassword: 'organic123',
      firstName: 'Michael',
      lastName: 'Green'
    }
  ];

  for (const vendorData of demoVendors) {
    // Check if vendor already exists
    const existing = await knex('vendors').where('email', vendorData.email).first();
    if (existing) {
      console.log(`Vendor ${vendorData.company_name} already exists, skipping...`);
      continue;
    }

    // Create vendor
    const [vendor] = await knex('vendors').insert({
      company_name: vendorData.company_name,
      email: vendorData.email,
      contact_name: vendorData.contact_name,
      phone: vendorData.phone,
      address: vendorData.address,
      tax_id: vendorData.tax_id,
      status: vendorData.status,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');

    console.log(`Created vendor: ${vendor.company_name} (ID: ${vendor.id})`);

    // Create vendor user account
    const hashedPassword = await bcrypt.hash(vendorData.userPassword, 12);

    const [vendorUser] = await knex('vendor_users').insert({
      vendor_id: vendor.id,
      email: vendorData.userEmail,
      password_hash: hashedPassword,
      first_name: vendorData.firstName,
      last_name: vendorData.lastName,
      role: 'owner',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');

    console.log(`Created user for ${vendor.company_name}: ${vendorUser.email}`);

    // Create demo products for this vendor
    if (vendor.company_name === 'Demo Restaurant') {
      const demoProducts = [
        {
          vendor_id: vendor.id,
          name: 'Signature Burger',
          description: 'Our famous house burger with special sauce',
          sku: 'DEMO-BURGER-001',
          base_price: 15.99,
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
          base_price: 8.50,
          category_id: 1,
          status: 'pending',
          weight: 1.2,
          dimensions: '3x3x9',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      await knex('products').insert(demoProducts);
      console.log(`Created ${demoProducts.length} demo products for ${vendor.company_name}`);
    }
  }

  console.log('✅ Demo vendor accounts setup complete!');
  console.log('🎯 Demo Login Credentials:');
  console.log('1. Email: demo@restaurant.com | Password: demo123');
  console.log('2. Email: vendor@coffee.com | Password: coffee123');
  console.log('3. Email: info@organicfarms.com | Password: organic123');
};