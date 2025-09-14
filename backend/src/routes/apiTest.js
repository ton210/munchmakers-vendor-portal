const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');

// SendGrid test
router.post('/sendgrid', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const testEmail = {
      to: 'test@example.com', // This won't actually send
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'API Test - SendGrid Integration',
      text: 'This is a test email to verify SendGrid API integration.',
      html: '<p>This is a test email to verify <strong>SendGrid API</strong> integration.</p>'
    };

    // Just validate the API key and configuration
    await sgMail.send({
      ...testEmail,
      to: process.env.SENDGRID_FROM_EMAIL, // Send to ourselves for testing
      subject: 'SendGrid API Test - ' + new Date().toISOString()
    });

    res.json({
      success: true,
      service: 'SendGrid',
      message: 'SendGrid API is working correctly',
      details: {
        apiKey: process.env.SENDGRID_API_KEY ? 'Configured' : 'Missing',
        fromEmail: process.env.SENDGRID_FROM_EMAIL || 'Not configured'
      }
    });
  } catch (error) {
    res.json({
      success: false,
      service: 'SendGrid',
      message: 'SendGrid API test failed',
      error: error.message,
      details: {
        apiKey: process.env.SENDGRID_API_KEY ? 'Configured' : 'Missing',
        fromEmail: process.env.SENDGRID_FROM_EMAIL || 'Not configured'
      }
    });
  }
});

// Cloudflare R2 test
router.post('/r2', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { S3Client, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3');

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });

    // Test listing objects
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET,
      MaxKeys: 1
    });

    const listResult = await s3Client.send(listCommand);

    // Test upload a small test object
    const testKey = `api-test-${Date.now()}.txt`;
    const putCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: testKey,
      Body: 'API Test File - ' + new Date().toISOString(),
      ContentType: 'text/plain'
    });

    await s3Client.send(putCommand);

    res.json({
      success: true,
      service: 'Cloudflare R2',
      message: 'R2 storage is working correctly',
      details: {
        bucket: process.env.R2_BUCKET,
        endpoint: process.env.R2_ENDPOINT,
        publicUrl: process.env.R2_PUBLIC_URL,
        objectCount: listResult.KeyCount || 0,
        testFileUploaded: testKey
      }
    });
  } catch (error) {
    res.json({
      success: false,
      service: 'Cloudflare R2',
      message: 'R2 storage test failed',
      error: error.message,
      details: {
        bucket: process.env.R2_BUCKET || 'Not configured',
        endpoint: process.env.R2_ENDPOINT || 'Not configured',
        accessKeyId: process.env.R2_ACCESS_KEY_ID ? 'Configured' : 'Missing'
      }
    });
  }
});

// OpenAI test
router.post('/openai', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { Configuration, OpenAIApi } = require('openai');

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const openai = new OpenAIApi(configuration);

    // Test with a simple completion
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful API testing assistant. Respond with exactly 10 words."
        },
        {
          role: "user",
          content: "Test message for API integration verification"
        }
      ],
      max_tokens: 50,
      temperature: 0.1
    });

    res.json({
      success: true,
      service: 'OpenAI',
      message: 'OpenAI API is working correctly',
      details: {
        model: 'gpt-3.5-turbo',
        response: response.data.choices[0].message.content,
        usage: response.data.usage
      }
    });
  } catch (error) {
    res.json({
      success: false,
      service: 'OpenAI',
      message: 'OpenAI API test failed',
      error: error.message,
      details: {
        apiKey: process.env.OPENAI_API_KEY ? 'Configured' : 'Missing'
      }
    });
  }
});

// BigCommerce test
router.post('/bigcommerce', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const axios = require('axios');

    if (!process.env.BC_ACCESS_TOKEN || !process.env.BC_STORE_HASH) {
      throw new Error('BigCommerce credentials not configured');
    }

    // Test API connection by getting store info
    const response = await axios.get(
      `https://api.bigcommerce.com/stores/${process.env.BC_STORE_HASH}/v2/store`,
      {
        headers: {
          'X-Auth-Token': process.env.BC_ACCESS_TOKEN,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    // Test getting products count
    const productsResponse = await axios.get(
      `https://api.bigcommerce.com/stores/${process.env.BC_STORE_HASH}/v3/catalog/products?limit=1`,
      {
        headers: {
          'X-Auth-Token': process.env.BC_ACCESS_TOKEN,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      service: 'BigCommerce',
      message: 'BigCommerce API is working correctly',
      details: {
        storeHash: process.env.BC_STORE_HASH,
        storeName: response.data.name,
        storeUrl: response.data.domain,
        productCount: productsResponse.data.meta?.pagination?.total || 0,
        apiVersion: 'v3'
      }
    });
  } catch (error) {
    res.json({
      success: false,
      service: 'BigCommerce',
      message: 'BigCommerce API test failed',
      error: error.message,
      details: {
        storeHash: process.env.BC_STORE_HASH || 'Not configured',
        accessToken: process.env.BC_ACCESS_TOKEN ? 'Configured' : 'Missing'
      }
    });
  }
});

// Slack test
router.post('/slack', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const axios = require('axios');

    if (!process.env.SLACK_WEBHOOK_URL) {
      throw new Error('Slack webhook URL not configured');
    }

    const testMessage = {
      text: `API Test from Vendor Portal - ${new Date().toISOString()}`,
      username: 'Vendor Portal API Test',
      icon_emoji: ':gear:'
    };

    await axios.post(process.env.SLACK_WEBHOOK_URL, testMessage);

    res.json({
      success: true,
      service: 'Slack',
      message: 'Slack webhook is working correctly',
      details: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL ? 'Configured' : 'Missing',
        messageSent: testMessage.text
      }
    });
  } catch (error) {
    res.json({
      success: false,
      service: 'Slack',
      message: 'Slack webhook test failed',
      error: error.message,
      details: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL ? 'Configured' : 'Missing'
      }
    });
  }
});

// Database test
router.post('/database', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = require('../config/database');

    // Test database connection
    const result = await db.raw('SELECT NOW() as current_time, version() as db_version');

    // Test getting table info
    const tables = await db.raw(`
      SELECT table_name, table_rows
      FROM information_schema.tables
      WHERE table_schema = current_database()
      AND table_type = 'BASE TABLE'
    `);

    res.json({
      success: true,
      service: 'Database',
      message: 'Database connection is working correctly',
      details: {
        currentTime: result.rows[0].current_time,
        version: result.rows[0].db_version,
        tableCount: tables.rows.length,
        tables: tables.rows.map(t => ({
          name: t.table_name,
          rows: t.table_rows || 0
        }))
      }
    });
  } catch (error) {
    res.json({
      success: false,
      service: 'Database',
      message: 'Database connection test failed',
      error: error.message,
      details: {
        databaseUrl: process.env.DATABASE_URL ? 'Configured' : 'Missing'
      }
    });
  }
});

// Run all tests
router.post('/all', authenticateToken, requireRole(['admin']), async (req, res) => {
  const tests = ['database', 'sendgrid', 'r2', 'openai', 'bigcommerce', 'slack'];
  const results = [];

  for (const test of tests) {
    try {
      // Simulate calling each test endpoint
      const testReq = { ...req };
      const testRes = {
        json: (data) => data
      };

      let result;
      switch (test) {
        case 'database':
          result = await new Promise((resolve) => {
            router.stack.find(layer => layer.route.path === '/database')
              .route.stack[0].handle(testReq, { json: resolve }, () => {});
          });
          break;
        // Add other cases as needed
        default:
          result = { success: false, service: test, message: 'Test not implemented' };
      }

      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        service: test,
        message: `Test failed: ${error.message}`,
        error: error.message
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  res.json({
    success: successCount === totalCount,
    message: `${successCount}/${totalCount} API tests passed`,
    results,
    summary: {
      total: totalCount,
      passed: successCount,
      failed: totalCount - successCount
    }
  });
});

module.exports = router;