const express = require('express');
const db = require('../config/database');
const { anyAuth, adminAuth } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/security');
const SlackService = require('../services/slackService');
const ActivityLogger = require('../services/activityLogger');

const router = express.Router();

// Apply rate limiting
router.use(generalLimiter);

// Send internal communication to vendor
router.post('/vendor', anyAuth, async (req, res) => {
  try {
    const {
      vendor_id,
      order_id,
      subject,
      message,
      priority = 'normal'
    } = req.body;

    if (!vendor_id || !message) {
      return res.status(400).json({
        success: false,
        message: 'Vendor ID and message are required'
      });
    }

    // Verify vendor exists
    const vendor = await db('vendors').where({ id: vendor_id }).first();
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Insert communication
    const [communication] = await db('vendor_communications').insert({
      vendor_id,
      order_id,
      subject,
      message,
      priority,
      created_by: req.user.id,
      status: 'unread'
    }).returning('*');

    // Get vendor user ID for notification
    const vendorUser = await db('vendor_users')
      .where({ vendor_id, role: 'owner' })
      .first();

    if (vendorUser) {
      // Create notification for vendor
      await db('notifications').insert({
        user_id: vendorUser.id,
        user_type: 'vendor',
        type: 'internal_communication',
        title: subject || 'Internal Communication',
        message: message.substring(0, 200) + (message.length > 200 ? '...' : ''),
        data: JSON.stringify({
          communication_id: communication.id,
          order_id,
          priority
        })
      });
    }

    // Send Slack notification if configured
    try {
      await SlackService.notifyInternalCommunication(communication, vendor);
    } catch (slackError) {
      console.error('Slack notification failed:', slackError);
    }

    // Log activity
    await ActivityLogger.log({
      user_id: req.user.id,
      user_type: req.user.type,
      action: 'internal_communication_sent',
      entity_type: 'vendor_communication',
      entity_id: communication.id,
      metadata: {
        vendor_id,
        order_id,
        subject,
        priority
      },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'Communication sent successfully',
      data: { communication }
    });

  } catch (error) {
    console.error('Send vendor communication error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send communication',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get vendor communications
router.get('/vendor/:vendor_id', anyAuth, async (req, res) => {
  try {
    const { vendor_id } = req.params;
    const { status, order_id } = req.query;

    // Check permissions
    if (req.user.type === 'vendor') {
      const vendor = await db('vendors')
        .leftJoin('vendor_users', 'vendors.id', 'vendor_users.vendor_id')
        .where('vendor_users.id', req.user.id)
        .where('vendors.id', vendor_id)
        .first();

      if (!vendor) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    let query = db('vendor_communications')
      .select(
        'vendor_communications.*',
        'admin_users.first_name as created_by_first_name',
        'admin_users.last_name as created_by_last_name',
        'orders.order_number'
      )
      .leftJoin('admin_users', 'vendor_communications.created_by', 'admin_users.id')
      .leftJoin('orders', 'vendor_communications.order_id', 'orders.id')
      .where('vendor_communications.vendor_id', vendor_id);

    if (status) {
      query = query.where('vendor_communications.status', status);
    }

    if (order_id) {
      query = query.where('vendor_communications.order_id', order_id);
    }

    const communications = await query.orderBy('vendor_communications.created_at', 'desc');

    res.json({
      success: true,
      data: { communications }
    });

  } catch (error) {
    console.error('Get vendor communications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get communications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Mark communication as read
router.put('/:id/read', anyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const communication = await db('vendor_communications').where({ id }).first();
    if (!communication) {
      return res.status(404).json({
        success: false,
        message: 'Communication not found'
      });
    }

    // Check permissions
    if (req.user.type === 'vendor') {
      const vendor = await db('vendors')
        .leftJoin('vendor_users', 'vendors.id', 'vendor_users.vendor_id')
        .where('vendor_users.id', req.user.id)
        .where('vendors.id', communication.vendor_id)
        .first();

      if (!vendor) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    await db('vendor_communications')
      .where({ id })
      .update({
        status: 'read',
        updated_at: new Date()
      });

    res.json({
      success: true,
      message: 'Communication marked as read'
    });

  } catch (error) {
    console.error('Mark communication read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark communication as read',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Reply to communication
router.post('/:id/reply', anyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reply_message } = req.body;

    const communication = await db('vendor_communications').where({ id }).first();
    if (!communication) {
      return res.status(404).json({
        success: false,
        message: 'Communication not found'
      });
    }

    await db('vendor_communications')
      .where({ id })
      .update({
        status: 'replied',
        reply_message,
        replied_by: req.user.id,
        replied_at: new Date(),
        updated_at: new Date()
      });

    res.json({
      success: true,
      message: 'Reply sent successfully'
    });

  } catch (error) {
    console.error('Reply to communication error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;