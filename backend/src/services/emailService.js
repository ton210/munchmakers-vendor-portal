const sgMail = require('@sendgrid/mail');
const ActivityLogger = require('./activityLogger');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@munchmakers.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://vendor.munchmakers.com';

class EmailService {
  static async sendEmail(to, subject, html, text = null) {
    try {
      const msg = {
        to,
        from: {
          email: FROM_EMAIL,
          name: 'MunchMakers Vendor Portal'
        },
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
      };

      await sgMail.send(msg);
      console.log(`Email sent to ${to}: ${subject}`);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  static async sendVendorWelcome(vendor, user) {
    const subject = 'Welcome to MunchMakers Vendor Portal';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to MunchMakers</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; }
            .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to MunchMakers Vendor Portal</h1>
            </div>
            <div class="content">
              <h2>Hello ${user.first_name},</h2>
              <p>Thank you for registering <strong>${vendor.company_name}</strong> with MunchMakers!</p>
              <p>Your vendor application has been received and is currently under review by our team. Here's what happens next:</p>
              <ul>
                <li><strong>Review Process:</strong> Our team will review your application within 2-3 business days</li>
                <li><strong>Document Verification:</strong> We may request additional documentation if needed</li>
                <li><strong>Account Activation:</strong> Once approved, you'll receive an email with access to all portal features</li>
              </ul>
              <p>In the meantime, you can log in to your account to:</p>
              <ul>
                <li>Complete your vendor profile</li>
                <li>Upload required business documents</li>
                <li>Prepare your product catalog</li>
              </ul>
              <div style="text-align: center;">
                <a href="${FRONTEND_URL}/login" class="button">Access Portal</a>
              </div>
              <p>If you have any questions, please don't hesitate to contact our support team.</p>
            </div>
            <div class="footer">
              <p>© 2024 MunchMakers. All rights reserved.</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  static async sendVendorApproval(vendor, user) {
    const subject = 'Your MunchMakers Vendor Application has been Approved!';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Vendor Application Approved</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #d4edda; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; }
            .button { display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations!</h1>
            </div>
            <div class="content">
              <h2>Hello ${user.first_name},</h2>
              <p>Great news! Your vendor application for <strong>${vendor.company_name}</strong> has been approved.</p>
              <p>You now have full access to the MunchMakers Vendor Portal where you can:</p>
              <ul>
                <li>Upload and manage your product catalog</li>
                <li>Submit products for approval</li>
                <li>Track order fulfillment</li>
                <li>Access sales analytics and reports</li>
                <li>Manage your account settings</li>
              </ul>
              <div style="text-align: center;">
                <a href="${FRONTEND_URL}/dashboard" class="button">Access Your Dashboard</a>
              </div>
              <p>Our team is here to help you succeed. If you need any assistance getting started, please reach out to us.</p>
            </div>
            <div class="footer">
              <p>© 2024 MunchMakers. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  static async sendVendorRejection(vendor, user, reason) {
    const subject = 'Update on Your MunchMakers Vendor Application';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Vendor Application Update</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8d7da; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; }
            .reason { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Vendor Application Update</h1>
            </div>
            <div class="content">
              <h2>Hello ${user.first_name},</h2>
              <p>Thank you for your interest in becoming a vendor with MunchMakers.</p>
              <p>After careful review, we are unable to approve your application for <strong>${vendor.company_name}</strong> at this time.</p>
              ${reason ? `
                <div class="reason">
                  <strong>Reason:</strong><br>
                  ${reason}
                </div>
              ` : ''}
              <p>If you believe this decision was made in error or if you have additional information that might help your application, please contact our vendor relations team.</p>
              <p>Thank you for your understanding.</p>
            </div>
            <div class="footer">
              <p>© 2024 MunchMakers. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  static async sendPasswordReset(user, token, userType) {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}&type=${userType}`;
    const subject = 'Reset Your MunchMakers Portal Password';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; }
            .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
            .warning { background-color: #fff3cd; padding: 15px; border: 1px solid #ffeaa7; border-radius: 4px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${user.first_name},</h2>
              <p>We received a request to reset your password for your MunchMakers Vendor Portal account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; font-family: monospace;">
                ${resetUrl}
              </p>
              <div class="warning">
                <strong>Security Notice:</strong>
                <ul>
                  <li>This link will expire in 1 hour</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Never share this link with anyone</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>© 2024 MunchMakers. All rights reserved.</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  static async sendProductSubmissionConfirmation(product, vendor, user) {
    const subject = `Product Submission Received: ${product.name}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Product Submission Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #d1ecf1; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; }
            .product-info { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Product Submission Received</h1>
            </div>
            <div class="content">
              <h2>Hello ${user.first_name},</h2>
              <p>Your product submission has been received and is now under review.</p>
              <div class="product-info">
                <strong>Product Details:</strong><br>
                <strong>Name:</strong> ${product.name}<br>
                <strong>SKU:</strong> ${product.sku}<br>
                <strong>Submitted:</strong> ${new Date().toLocaleDateString()}
              </div>
              <p>Our team will review your product within 2-3 business days. You'll receive an email notification once the review is complete.</p>
              <p>You can track the status of your submission in the vendor portal.</p>
            </div>
            <div class="footer">
              <p>© 2024 MunchMakers. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  static async sendProductApproval(product, vendor, user) {
    const subject = `Product Approved: ${product.name}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Product Approved</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #d4edda; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; }
            .product-info { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Product Approved!</h1>
            </div>
            <div class="content">
              <h2>Hello ${user.first_name},</h2>
              <p>Great news! Your product has been approved and is now live on MunchMakers.</p>
              <div class="product-info">
                <strong>Product Details:</strong><br>
                <strong>Name:</strong> ${product.name}<br>
                <strong>SKU:</strong> ${product.sku}<br>
                <strong>Approved:</strong> ${new Date().toLocaleDateString()}
              </div>
              <p>Your product is now available for customers to purchase. You can view analytics and manage your product in the vendor portal.</p>
            </div>
            <div class="footer">
              <p>© 2024 MunchMakers. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  static async sendProductRejection(product, vendor, user, feedback) {
    const subject = `Product Review Update: ${product.name}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Product Review Update</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8d7da; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; }
            .product-info { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0; }
            .feedback { background-color: #fff3cd; padding: 15px; border: 1px solid #ffeaa7; border-radius: 4px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Product Review Update</h1>
            </div>
            <div class="content">
              <h2>Hello ${user.first_name},</h2>
              <p>We have completed the review of your product submission.</p>
              <div class="product-info">
                <strong>Product Details:</strong><br>
                <strong>Name:</strong> ${product.name}<br>
                <strong>SKU:</strong> ${product.sku}<br>
                <strong>Status:</strong> Needs Revision
              </div>
              ${feedback ? `
                <div class="feedback">
                  <strong>Review Feedback:</strong><br>
                  ${feedback}
                </div>
              ` : ''}
              <p>Please review the feedback and make the necessary changes to your product listing. You can then resubmit for review.</p>
            </div>
            <div class="footer">
              <p>© 2024 MunchMakers. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }
}

module.exports = EmailService;