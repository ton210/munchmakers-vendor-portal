require('dotenv').config({ path: '../.env' });
const Store = require('../models/Store');

async function setupStores() {
  console.log('🏪 Setting up stores with existing credentials...');

  const stores = [
    // Shopify Store - qstomize
    {
      name: 'qstomize',
      type: 'shopify',
      store_url: process.env.SHOP_NAME || 'qstomize',
      api_credentials: {
        access_token: process.env.SHOPIFY_ACCESS_TOKEN,
        api_key: process.env.SHOPIFY_API_KEY,
        api_secret: process.env.SHOPIFY_API_SECRET
      },
      is_active: true,
      sync_enabled: true
    },

    // WooCommerce Store - SequinSwag
    {
      name: 'SequinSwag',
      type: 'woocommerce',
      store_url: process.env.WOOCOMMERCE_SITE_URL || 'https://www.sequinswag.com',
      api_credentials: {
        consumer_key: process.env.WOOCOMMERCE_CONSUMER_KEY,
        consumer_secret: process.env.WOOCOMMERCE_CONSUMER_SECRET,
        wp_username: process.env.WP_USERNAME,
        wp_password: process.env.WP_PASSWORD,
        wp_app_password: process.env.WP_APP_PASSWORD
      },
      is_active: true,
      sync_enabled: true
    },

    // BigCommerce Store - MunchMakers main store
    {
      name: 'MunchMakers',
      type: 'bigcommerce',
      store_url: `https://store-${process.env.BC_STORE_HASH}.mybigcommerce.com`,
      api_credentials: {
        store_hash: process.env.BC_STORE_HASH,
        access_token: process.env.BC_ACCESS_TOKEN
      },
      is_active: true,
      sync_enabled: true
    }
  ];

  try {
    for (const storeData of stores) {
      console.log(`\n📝 Setting up ${storeData.name} (${storeData.type})...`);

      // Check if store already exists
      const existingStores = await Store.getAll({ type: storeData.type });
      const existingStore = existingStores.find(s =>
        s.name === storeData.name || s.store_url === storeData.store_url
      );

      if (existingStore) {
        console.log(`   ⚠️  Store ${storeData.name} already exists, updating...`);
        await Store.update(existingStore.id, storeData);
        console.log(`   ✅ Updated ${storeData.name}`);
      } else {
        // Test connection before creating
        console.log(`   🔗 Testing connection for ${storeData.name}...`);
        const connectionTest = await Store.testConnection(storeData);

        if (connectionTest.success) {
          await Store.create(storeData);
          console.log(`   ✅ Created ${storeData.name} - connection test passed`);
        } else {
          console.log(`   ❌ Failed to create ${storeData.name}: ${connectionTest.message}`);
          console.log(`   ⚠️  Store will still be created for configuration purposes`);
          // Create anyway for configuration
          await Store.create(storeData);
        }
      }
    }

    console.log('\n🎉 Store setup completed!');
    console.log('\nStores configured:');
    console.log('- Shopify: qstomize');
    console.log('- WooCommerce: SequinSwag');
    console.log('- BigCommerce: MunchMakers');
    console.log('\nYou can now sync orders from these stores through the admin dashboard.');

  } catch (error) {
    console.error('❌ Error setting up stores:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  setupStores()
    .then(() => {
      console.log('✅ Setup completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupStores;