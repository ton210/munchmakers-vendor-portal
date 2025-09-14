const axios = require('axios');

class StoreIntegrationService {
  constructor() {
    this.integrations = {
      shopify: new ShopifyIntegration(),
      bigcommerce: new BigCommerceIntegration(),
      woocommerce: new WooCommerceIntegration()
    };
  }

  getIntegration(storeType) {
    return this.integrations[storeType];
  }

  async testConnection(store) {
    const integration = this.getIntegration(store.type);
    return await integration.testConnection(store);
  }

  async syncOrders(store) {
    const integration = this.getIntegration(store.type);
    return await integration.getOrders(store);
  }

  async syncProducts(store) {
    const integration = this.getIntegration(store.type);
    return await integration.getProducts(store);
  }
}

class ShopifyIntegration {
  async testConnection(store) {
    try {
      const { shop_domain, access_token } = store.api_credentials;

      const response = await axios.get(
        `https://${shop_domain}.myshopify.com/admin/api/2023-10/shop.json`,
        {
          headers: {
            'X-Shopify-Access-Token': access_token
          }
        }
      );

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  }

  async getOrders(store, options = {}) {
    try {
      const { shop_domain, access_token } = store.api_credentials;
      const { limit = 250, status = 'any' } = options;

      const response = await axios.get(
        `https://${shop_domain}.myshopify.com/admin/api/2023-10/orders.json`,
        {
          headers: {
            'X-Shopify-Access-Token': access_token
          },
          params: {
            limit,
            status,
            fields: 'id,order_number,email,created_at,updated_at,total_price,currency,customer,billing_address,shipping_address,line_items,fulfillment_status,financial_status,tags,note'
          }
        }
      );

      return response.data.orders.map(order => ({
        external_order_id: order.id.toString(),
        order_number: order.order_number.toString(),
        customer_email: order.email,
        customer_name: order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() : null,
        customer_phone: order.customer?.phone,
        billing_address: order.billing_address,
        shipping_address: order.shipping_address,
        total_amount: parseFloat(order.total_price),
        currency: order.currency,
        order_status: this.mapShopifyStatus(order.fulfillment_status, order.financial_status),
        fulfillment_status: order.fulfillment_status,
        payment_status: order.financial_status,
        notes: order.note,
        tags: order.tags,
        order_date: new Date(order.created_at),
        items: order.line_items?.map(item => ({
          external_item_id: item.id.toString(),
          product_name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          unit_price: parseFloat(item.price),
          total_price: parseFloat(item.price) * item.quantity,
          variant_title: item.variant_title,
          product_data: item
        })) || []
      }));

    } catch (error) {
      console.error('Shopify API error:', error.response?.data || error.message);
      throw new Error(`Shopify API error: ${error.response?.data?.message || error.message}`);
    }
  }

  mapShopifyStatus(fulfillmentStatus, financialStatus) {
    if (fulfillmentStatus === 'fulfilled') return 'fulfilled';
    if (fulfillmentStatus === 'partial') return 'processing';
    if (financialStatus === 'paid') return 'processing';
    if (financialStatus === 'pending') return 'pending';
    return 'pending';
  }

  async getProducts(store, options = {}) {
    try {
      const { shop_domain, access_token } = store.api_credentials;
      const { limit = 250 } = options;

      const response = await axios.get(
        `https://${shop_domain}.myshopify.com/admin/api/2023-10/products.json`,
        {
          headers: {
            'X-Shopify-Access-Token': access_token
          },
          params: {
            limit,
            fields: 'id,title,body_html,vendor,product_type,created_at,updated_at,status,tags,variants,images'
          }
        }
      );

      return response.data.products.map(product => ({
        external_product_id: product.id.toString(),
        name: product.title,
        description: product.body_html,
        sku: product.variants?.[0]?.sku || '',
        price: parseFloat(product.variants?.[0]?.price || '0'),
        inventory_quantity: product.variants?.reduce((sum, v) => sum + (parseInt(v.inventory_quantity) || 0), 0) || 0,
        product_type: product.product_type,
        images: product.images?.map(img => ({
          url: img.src,
          alt: img.alt
        })) || [],
        variants: product.variants?.map(variant => ({
          id: variant.id,
          title: variant.title,
          price: parseFloat(variant.price),
          sku: variant.sku,
          inventory_quantity: parseInt(variant.inventory_quantity) || 0
        })) || [],
        store_data: product
      }));

    } catch (error) {
      console.error('Shopify products API error:', error.response?.data || error.message);
      throw new Error(`Shopify products API error: ${error.response?.data?.message || error.message}`);
    }
  }
}

class BigCommerceIntegration {
  async testConnection(store) {
    try {
      const { store_hash, access_token } = store.api_credentials;

      const response = await axios.get(
        `https://api.bigcommerce.com/stores/${store_hash}/v2/store`,
        {
          headers: {
            'X-Auth-Token': access_token,
            'Content-Type': 'application/json'
          }
        }
      );

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  }

  async getOrders(store, options = {}) {
    try {
      const { store_hash, access_token } = store.api_credentials;
      const { limit = 250 } = options;

      // Get orders
      const ordersResponse = await axios.get(
        `https://api.bigcommerce.com/stores/${store_hash}/v2/orders`,
        {
          headers: {
            'X-Auth-Token': access_token,
            'Content-Type': 'application/json'
          },
          params: { limit }
        }
      );

      const orders = [];
      for (const order of ordersResponse.data) {
        // Get order products
        const productsResponse = await axios.get(
          `https://api.bigcommerce.com/stores/${store_hash}/v2/orders/${order.id}/products`,
          {
            headers: {
              'X-Auth-Token': access_token,
              'Content-Type': 'application/json'
            }
          }
        );

        orders.push({
          external_order_id: order.id.toString(),
          order_number: order.id.toString(),
          customer_email: order.billing_address?.email,
          customer_name: `${order.billing_address?.first_name || ''} ${order.billing_address?.last_name || ''}`.trim(),
          customer_phone: order.billing_address?.phone,
          billing_address: order.billing_address,
          shipping_address: order.shipping_addresses?.[0],
          total_amount: parseFloat(order.total_inc_tax),
          currency: order.currency_code,
          order_status: this.mapBigCommerceStatus(order.status),
          fulfillment_status: order.status,
          payment_status: order.payment_status,
          notes: order.customer_message,
          tags: null,
          order_date: new Date(order.date_created),
          items: productsResponse.data.map(item => ({
            external_item_id: item.id.toString(),
            product_name: item.name,
            sku: item.sku,
            quantity: item.quantity,
            unit_price: parseFloat(item.price_inc_tax),
            total_price: parseFloat(item.total_inc_tax),
            variant_title: item.product_options?.map(opt => `${opt.display_name}: ${opt.display_value}`).join(', '),
            product_data: item
          }))
        });
      }

      return orders;

    } catch (error) {
      console.error('BigCommerce API error:', error.response?.data || error.message);
      throw new Error(`BigCommerce API error: ${error.response?.data?.message || error.message}`);
    }
  }

  mapBigCommerceStatus(status) {
    const statusMap = {
      0: 'pending',
      1: 'pending',
      2: 'processing',
      3: 'processing',
      4: 'processing',
      5: 'processing',
      6: 'processing',
      7: 'processing',
      8: 'processing',
      9: 'processing',
      10: 'fulfilled',
      11: 'cancelled',
      12: 'cancelled',
      13: 'cancelled'
    };
    return statusMap[status] || 'pending';
  }

  async getProducts(store, options = {}) {
    try {
      const { store_hash, access_token } = store.api_credentials;
      const { limit = 250 } = options;

      // Get products
      const productsResponse = await axios.get(
        `https://api.bigcommerce.com/stores/${store_hash}/v3/catalog/products`,
        {
          headers: {
            'X-Auth-Token': access_token,
            'Content-Type': 'application/json'
          },
          params: {
            limit,
            include: 'variants,images'
          }
        }
      );

      return productsResponse.data.data.map(product => ({
        external_product_id: product.id.toString(),
        name: product.name,
        description: product.description,
        sku: product.sku || '',
        price: parseFloat(product.price || '0'),
        inventory_quantity: product.inventory_level || 0,
        product_type: product.type,
        images: product.images?.map(img => ({
          url: img.url_standard,
          alt: img.description
        })) || [],
        variants: product.variants?.map(variant => ({
          id: variant.id,
          title: variant.option_values?.map(ov => ov.label).join(' / ') || 'Default',
          price: parseFloat(variant.price || product.price || '0'),
          sku: variant.sku || product.sku,
          inventory_quantity: variant.inventory_level || 0
        })) || [],
        store_data: product
      }));

    } catch (error) {
      console.error('BigCommerce products API error:', error.response?.data || error.message);
      throw new Error(`BigCommerce products API error: ${error.response?.data?.title || error.message}`);
    }
  }
}

class WooCommerceIntegration {
  async testConnection(store) {
    try {
      const { site_url, consumer_key, consumer_secret } = store.api_credentials;

      const auth = Buffer.from(`${consumer_key}:${consumer_secret}`).toString('base64');

      const response = await axios.get(`${site_url}/wp-json/wc/v3/system_status`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  }

  async getOrders(store, options = {}) {
    try {
      const { site_url, consumer_key, consumer_secret } = store.api_credentials;
      const { per_page = 100 } = options;

      const auth = Buffer.from(`${consumer_key}:${consumer_secret}`).toString('base64');

      const response = await axios.get(`${site_url}/wp-json/wc/v3/orders`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        params: { per_page }
      });

      return response.data.map(order => ({
        external_order_id: order.id.toString(),
        order_number: order.number,
        customer_email: order.billing?.email,
        customer_name: `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim(),
        customer_phone: order.billing?.phone,
        billing_address: order.billing,
        shipping_address: order.shipping,
        total_amount: parseFloat(order.total),
        currency: order.currency,
        order_status: this.mapWooCommerceStatus(order.status),
        fulfillment_status: order.status,
        payment_status: order.status,
        notes: order.customer_note,
        tags: null,
        order_date: new Date(order.date_created),
        items: order.line_items?.map(item => ({
          external_item_id: item.id.toString(),
          product_name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          unit_price: parseFloat(item.price),
          total_price: parseFloat(item.total),
          variant_title: item.meta_data?.find(meta => meta.key === 'variation')?.value,
          product_data: item
        })) || []
      }));

    } catch (error) {
      console.error('WooCommerce API error:', error.response?.data || error.message);
      throw new Error(`WooCommerce API error: ${error.response?.data?.message || error.message}`);
    }
  }

  mapWooCommerceStatus(status) {
    const statusMap = {
      'pending': 'pending',
      'processing': 'processing',
      'on-hold': 'pending',
      'completed': 'fulfilled',
      'cancelled': 'cancelled',
      'refunded': 'cancelled',
      'failed': 'cancelled'
    };
    return statusMap[status] || 'pending';
  }

  async getProducts(store, options = {}) {
    try {
      const { site_url, consumer_key, consumer_secret } = store.api_credentials;
      const { per_page = 100 } = options;

      const auth = Buffer.from(`${consumer_key}:${consumer_secret}`).toString('base64');

      const response = await axios.get(`${site_url}/wp-json/wc/v3/products`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        params: {
          per_page,
          status: 'publish'
        }
      });

      return response.data.map(product => ({
        external_product_id: product.id.toString(),
        name: product.name,
        description: product.description,
        sku: product.sku || '',
        price: parseFloat(product.price || '0'),
        inventory_quantity: product.stock_quantity || 0,
        product_type: product.type,
        images: product.images?.map(img => ({
          url: img.src,
          alt: img.alt
        })) || [],
        variants: product.variations?.map(variation => ({
          id: variation.id,
          title: variation.attributes?.map(attr => `${attr.name}: ${attr.option}`).join(', ') || 'Default',
          price: parseFloat(variation.price || product.price || '0'),
          sku: variation.sku || product.sku,
          inventory_quantity: variation.stock_quantity || 0
        })) || [],
        store_data: product
      }));

    } catch (error) {
      console.error('WooCommerce products API error:', error.response?.data || error.message);
      throw new Error(`WooCommerce products API error: ${error.response?.data?.message || error.message}`);
    }
  }
}

module.exports = StoreIntegrationService;