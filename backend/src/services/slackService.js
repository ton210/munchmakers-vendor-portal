const axios = require('axios');

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://vendor.munchmakers.com';

class SlackService {
  static async sendNotification(message, channel = null) {
    if (!SLACK_WEBHOOK_URL) {
      console.log('Slack webhook not configured, skipping notification');
      return false;
    }

    try {
      const payload = {
        text: message,
        username: 'MunchMakers Vendor Portal',
        icon_emoji: ':package:'
      };

      if (channel) {
        payload.channel = channel;
      }

      await axios.post(SLACK_WEBHOOK_URL, payload);
      console.log('Slack notification sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send Slack notification:', error.message);
      return false;
    }
  }

  static async sendRichNotification(blocks, text = null) {
    if (!SLACK_WEBHOOK_URL) {
      console.log('Slack webhook not configured, skipping notification');
      return false;
    }

    try {
      const payload = {
        text: text || 'MunchMakers Vendor Portal Notification',
        blocks,
        username: 'MunchMakers Vendor Portal',
        icon_emoji: ':package:'
      };

      await axios.post(SLACK_WEBHOOK_URL, payload);
      console.log('Slack rich notification sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send Slack rich notification:', error.message);
      return false;
    }
  }

  static async notifyNewVendorRegistration(vendor) {
    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🏢 New Vendor Registration"
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Company:* ${vendor.company_name}`
          },
          {
            type: "mrkdwn",
            text: `*Contact:* ${vendor.contact_name}`
          },
          {
            type: "mrkdwn",
            text: `*Email:* ${vendor.email}`
          },
          {
            type: "mrkdwn",
            text: `*Phone:* ${vendor.phone || 'Not provided'}`
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Tax ID:* ${vendor.tax_id || 'Not provided'}\n*Address:* ${vendor.address || 'Not provided'}`
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Review Application"
            },
            style: "primary",
            url: `${FRONTEND_URL}/admin/vendors/${vendor.id}`
          }
        ]
      }
    ];

    const text = `New vendor registration: ${vendor.company_name}`;
    return await this.sendRichNotification(blocks, text);
  }

  static async notifyProductSubmission(product, vendor) {
    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "📦 New Product Submission"
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Product:* ${product.name}`
          },
          {
            type: "mrkdwn",
            text: `*SKU:* ${product.sku}`
          },
          {
            type: "mrkdwn",
            text: `*Vendor:* ${vendor.company_name}`
          },
          {
            type: "mrkdwn",
            text: `*Price:* $${product.base_price || 'TBD'}`
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Description:* ${product.description ? product.description.substring(0, 150) + '...' : 'No description provided'}`
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Review Product"
            },
            style: "primary",
            url: `${FRONTEND_URL}/admin/products/${product.id}`
          }
        ]
      }
    ];

    const text = `New product submission: ${product.name} from ${vendor.company_name}`;
    return await this.sendRichNotification(blocks, text);
  }

  static async notifyVendorApproval(vendor) {
    const message = `✅ Vendor approved: ${vendor.company_name} (${vendor.email})`;
    return await this.sendNotification(message);
  }

  static async notifyVendorRejection(vendor, reason) {
    const message = `❌ Vendor rejected: ${vendor.company_name} (${vendor.email})${reason ? `\nReason: ${reason}` : ''}`;
    return await this.sendNotification(message);
  }

  static async notifyProductApproval(product, vendor) {
    const message = `✅ Product approved: ${product.name} (${product.sku}) from ${vendor.company_name}`;
    return await this.sendNotification(message);
  }

  static async notifyProductRejection(product, vendor, reason) {
    const message = `❌ Product rejected: ${product.name} (${product.sku}) from ${vendor.company_name}${reason ? `\nReason: ${reason}` : ''}`;
    return await this.sendNotification(message);
  }

  static async notifySystemError(error, context) {
    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🚨 System Error Alert"
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Context:* ${context}`
          },
          {
            type: "mrkdwn",
            text: `*Error:* ${error.message}`
          },
          {
            type: "mrkdwn",
            text: `*Time:* ${new Date().toISOString()}`
          }
        ]
      }
    ];

    if (error.stack && process.env.NODE_ENV === 'development') {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Stack Trace:*\n\`\`\`${error.stack}\`\`\``
        }
      });
    }

    const text = `System error in ${context}: ${error.message}`;
    return await this.sendRichNotification(blocks, text);
  }

  static async sendDailyReport(stats) {
    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "📊 Daily Vendor Portal Report"
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Date:* ${new Date().toLocaleDateString()}`
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*New Vendor Registrations:* ${stats.newVendors || 0}`
          },
          {
            type: "mrkdwn",
            text: `*Pending Vendor Applications:* ${stats.pendingVendors || 0}`
          },
          {
            type: "mrkdwn",
            text: `*New Product Submissions:* ${stats.newProducts || 0}`
          },
          {
            type: "mrkdwn",
            text: `*Pending Product Reviews:* ${stats.pendingProducts || 0}`
          },
          {
            type: "mrkdwn",
            text: `*Products Approved Today:* ${stats.approvedProducts || 0}`
          },
          {
            type: "mrkdwn",
            text: `*Active Vendors:* ${stats.activeVendors || 0}`
          }
        ]
      }
    ];

    if (stats.pendingVendors > 0 || stats.pendingProducts > 0) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "⚠️ *Action Required:* There are pending items that need review."
        }
      });
    }

    const text = `Daily Vendor Portal Report - ${new Date().toLocaleDateString()}`;
    return await this.sendRichNotification(blocks, text);
  }

  static async notifyBulkProductImport(vendorId, companyName, totalProducts, successCount, errorCount) {
    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "📥 Bulk Product Import Completed"
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Vendor:* ${companyName}`
          },
          {
            type: "mrkdwn",
            text: `*Total Products:* ${totalProducts}`
          },
          {
            type: "mrkdwn",
            text: `*Successful Imports:* ${successCount}`
          },
          {
            type: "mrkdwn",
            text: `*Errors:* ${errorCount}`
          }
        ]
      }
    ];

    if (errorCount > 0) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "⚠️ Some products failed to import. Check the error logs for details."
        }
      });
    }

    const text = `Bulk import completed for ${companyName}: ${successCount}/${totalProducts} products imported`;
    return await this.sendRichNotification(blocks, text);
  }
}

module.exports = SlackService;