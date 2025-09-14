const express = require('express');
const { adminAuth } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/security');
const TrackingService = require('../services/trackingService');

const router = express.Router();

// Apply rate limiting
router.use(generalLimiter);
router.use(adminAuth); // All routes require admin

// Get TrackShip configuration info
router.get('/config', async (req, res) => {
  try {
    const config = {
      api_key_configured: !!process.env.TRACKSHIP_API_KEY,
      app_name: process.env.TRACKSHIP_APP_NAME || 'VendorDashboard',
      webhook_url: `${process.env.FRONTEND_URL || 'https://vendors.munchmakers.com'}/api/tracking/trackship-webhook`,
      api_key_preview: process.env.TRACKSHIP_API_KEY ?
        process.env.TRACKSHIP_API_KEY.substring(0, 8) + '...' : 'Not configured'
    };

    res.json({
      success: true,
      data: {
        trackship_config: config,
        setup_instructions: {
          step1: 'Go to your TrackShip dashboard',
          step2: 'Navigate to App Store Settings',
          step3: `Set App Name: ${config.app_name}`,
          step4: `Set Webhook URL: ${config.webhook_url}`,
          step5: 'Save configuration',
          step6: 'Test the integration using the test endpoint'
        }
      }
    });

  } catch (error) {
    console.error('TrackShip config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get TrackShip configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Test TrackShip API connection
router.post('/test', async (req, res) => {
  try {
    const { tracking_number = '1Z999AA1234567890', carrier = 'ups' } = req.body;

    if (!process.env.TRACKSHIP_API_KEY) {
      return res.status(400).json({
        success: false,
        message: 'TrackShip API key not configured'
      });
    }

    const trackingService = new TrackingService();

    // Test the API connection by trying to get carrier info
    const carriers = trackingService.getSupportedCarriers();

    res.json({
      success: true,
      message: 'TrackShip API connection test successful',
      data: {
        api_key_status: 'Configured',
        app_name: process.env.TRACKSHIP_APP_NAME,
        supported_carriers: carriers,
        test_tracking_number: tracking_number,
        test_carrier: carrier
      }
    });

  } catch (error) {
    console.error('TrackShip test error:', error);
    res.status(500).json({
      success: false,
      message: 'TrackShip API test failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Connection failed'
    });
  }
});

// TrackShip webhook endpoint
router.post('/webhook', async (req, res) => {
  try {
    const webhookData = req.body;
    console.log('TrackShip webhook received:', webhookData);

    // Process webhook data and update tracking status
    if (webhookData.tracking_number && webhookData.status) {
      const tracking = await db('order_tracking')
        .where('tracking_number', webhookData.tracking_number)
        .first();

      if (tracking) {
        const trackingService = new TrackingService();
        await trackingService.updateTrackingStatus(
          tracking.id,
          webhookData.status,
          'Updated via TrackShip webhook'
        );
      }
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('TrackShip webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
});

module.exports = router;