const express = require('express');
const router = express.Router();
const { vendorAuth, adminAuth, vendorOwnershipOrAdmin } = require('../middleware/auth');
const VendorMessage = require('../models/VendorMessage');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

// Rate limiting
const messageLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50 // limit each IP to 50 requests per windowMs
});

// Send Slack notification
async function sendSlackNotification(message, vendorInfo) {
  try {
    if (!process.env.SLACK_WEBHOOK_URL) {
      console.log('Slack webhook URL not configured, skipping notification');
      return;
    }

    const slackMessage = {
      text: `🔔 New Vendor Message`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "New Vendor Message"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Vendor:* ${vendorInfo.company_name}`
            },
            {
              type: "mrkdwn",
              text: `*Priority:* ${message.priority.toUpperCase()}`
            },
            {
              type: "mrkdwn",
              text: `*Subject:* ${message.subject || 'No subject'}`
            },
            {
              type: "mrkdwn",
              text: `*Status:* ${message.status}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Message:*\n${message.message.substring(0, 200)}${message.message.length > 200 ? '...' : ''}`
          }
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View in Portal"
              },
              url: `https://vendors.munchmakers.com/admin/messages?vendor=${vendorInfo.id}`
            }
          ]
        }
      ]
    };

    await axios.post(process.env.SLACK_WEBHOOK_URL, slackMessage);
    console.log('Slack notification sent successfully');
  } catch (error) {
    console.error('Failed to send Slack notification:', error.message);
  }
}

// Get vendor messages
router.get('/vendor/:vendorId', messageLimit, vendorOwnershipOrAdmin, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { status, threadId, page = 1, limit = 20 } = req.query;

    const filters = { status, threadId };
    const messages = await VendorMessage.findByVendor(vendorId, filters);

    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedMessages = messages.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: {
        messages: paginatedMessages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: messages.length,
          pages: Math.ceil(messages.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
});

// Get message threads for vendor
router.get('/threads/:vendorId', messageLimit, vendorOwnershipOrAdmin, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const threads = await VendorMessage.getActiveThreads(vendorId);

    res.json({
      success: true,
      data: threads
    });
  } catch (error) {
    console.error('Error fetching message threads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch message threads',
      error: error.message
    });
  }
});

// Create new message (vendor only)
router.post('/send', messageLimit, vendorAuth, async (req, res) => {
  try {
    const {
      subject,
      message,
      priority = 'normal',
      threadId
    } = req.body;

    const vendorId = req.user.vendorId;

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const newMessage = await VendorMessage.createMessage({
      vendorId,
      senderId: null, // Vendor messages don't have sender_id
      senderType: 'vendor',
      subject: subject?.trim(),
      message: message.trim(),
      priority,
      threadId
    });

    // Get vendor info for notification
    const Vendor = require('../models/Vendor');
    const vendor = await Vendor.findById(vendorId);

    // Send Slack notification
    await sendSlackNotification(newMessage, vendor);

    res.status(201).json({
      success: true,
      data: newMessage,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// Admin: Get all messages
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const {
      status,
      priority,
      unreadOnly,
      vendorId,
      page = 1,
      limit = 20
    } = req.query;

    const filters = {
      status,
      priority,
      unreadOnly: unreadOnly === 'true',
      vendorId
    };

    const messages = await VendorMessage.getAdminMessages(filters);

    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedMessages = messages.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: {
        messages: paginatedMessages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: messages.length,
          pages: Math.ceil(messages.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
});

// Admin: Reply to message
router.post('/admin/reply', adminAuth, async (req, res) => {
  try {
    const {
      vendorId,
      threadId,
      message,
      status = 'in_progress'
    } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const reply = await VendorMessage.createMessage({
      vendorId,
      senderId: req.user.id,
      senderType: 'admin',
      message: message.trim(),
      threadId,
      status
    });

    res.status(201).json({
      success: true,
      data: reply,
      message: 'Reply sent successfully'
    });
  } catch (error) {
    console.error('Error sending reply:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply',
      error: error.message
    });
  }
});

// Admin: Mark message as read
router.put('/admin/:messageId/read', adminAuth, async (req, res) => {
  try {
    const { messageId } = req.params;
    await VendorMessage.markAsRead(messageId, req.user.id);

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read',
      error: error.message
    });
  }
});

// Admin: Update message status
router.put('/admin/:messageId/status', adminAuth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;

    if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    await VendorMessage.updateStatus(messageId, status);

    res.json({
      success: true,
      message: 'Message status updated successfully'
    });
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update message status',
      error: error.message
    });
  }
});

module.exports = router;