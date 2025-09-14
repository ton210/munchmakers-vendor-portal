exports.seed = async function(knex) {
  // Check if demo vendor exists
  const demoVendor = await knex('vendors').where('business_name', 'Demo Restaurant').first();

  if (!demoVendor) {
    console.log('Demo vendor not found, skipping financial data...');
    return;
  }

  // Check if financial data already exists
  const existingFinancials = await knex('vendor_financials').where('vendor_id', demoVendor.id).first();

  if (existingFinancials) {
    console.log('Demo financial data already exists, skipping...');
    return;
  }

  console.log('Creating demo financial data...');

  // Create sample financial transactions
  const transactions = [
    // Sales transactions
    {
      vendor_id: demoVendor.id,
      transaction_type: 'sale',
      reference_id: 'ORDER-001',
      amount: 150.00,
      currency: 'USD',
      description: 'Sale of Signature Burger - Order #001',
      status: 'completed',
      transaction_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      payout_date: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000), // 23 days ago
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    },
    {
      vendor_id: demoVendor.id,
      transaction_type: 'sale',
      reference_id: 'ORDER-002',
      amount: 85.50,
      currency: 'USD',
      description: 'Sale of Craft Beer Selection - Order #002',
      status: 'completed',
      transaction_date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      payout_date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
    },
    {
      vendor_id: demoVendor.id,
      transaction_type: 'sale',
      reference_id: 'ORDER-003',
      amount: 220.00,
      currency: 'USD',
      description: 'Sale of Artisan Pizza - Order #003',
      status: 'completed',
      transaction_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    },
    {
      vendor_id: demoVendor.id,
      transaction_type: 'sale',
      reference_id: 'ORDER-004',
      amount: 175.25,
      currency: 'USD',
      description: 'Sale of Multiple Items - Order #004',
      status: 'completed',
      transaction_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },

    // Commission transactions (platform fees)
    {
      vendor_id: demoVendor.id,
      transaction_type: 'fee',
      reference_id: 'ORDER-001',
      amount: -22.50, // 15% commission
      currency: 'USD',
      description: 'Platform commission (15%) - Order #001',
      status: 'completed',
      transaction_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    },
    {
      vendor_id: demoVendor.id,
      transaction_type: 'fee',
      reference_id: 'ORDER-002',
      amount: -12.83,
      currency: 'USD',
      description: 'Platform commission (15%) - Order #002',
      status: 'completed',
      transaction_date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
    },

    // Payout transactions
    {
      vendor_id: demoVendor.id,
      transaction_type: 'payout',
      reference_id: 'PAYOUT-001',
      amount: -200.17, // Net payout after fees
      currency: 'USD',
      description: 'Weekly payout - Week of Sept 1st',
      status: 'completed',
      transaction_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      payout_method: 'bank_transfer',
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
    },

    // Recent pending transactions
    {
      vendor_id: demoVendor.id,
      transaction_type: 'sale',
      reference_id: 'ORDER-005',
      amount: 95.00,
      currency: 'USD',
      description: 'Sale of Signature Burger & Beer - Order #005',
      status: 'completed',
      transaction_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      vendor_id: demoVendor.id,
      transaction_type: 'fee',
      reference_id: 'ORDER-005',
      amount: -14.25,
      currency: 'USD',
      description: 'Platform commission (15%) - Order #005',
      status: 'completed',
      transaction_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  ];

  await knex('vendor_financials').insert(transactions);

  console.log(`✅ Created ${transactions.length} demo financial transactions`);
  console.log('💰 Financial Dashboard Demo Data:');
  console.log('- Total Sales: $630.75');
  console.log('- Total Fees: $49.58');
  console.log('- Pending Payout: $395.25');
  console.log('- Last Payout: $200.17');
};