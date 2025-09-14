const Vendor = require('../models/Vendor');
const VendorUser = require('../models/VendorUser');
const AdminUser = require('../models/AdminUser');
const JWTUtil = require('../utils/jwt');
const EmailService = require('../services/emailService');
const SlackService = require('../services/slackService');
const ActivityLogger = require('../services/activityLogger');

class AuthController {
  // Vendor Registration
  static async registerVendor(req, res) {
    try {
      const { 
        company_name, 
        contact_name, 
        email, 
        phone, 
        address, 
        tax_id,
        user
      } = req.body;

      // Check if vendor email already exists
      const existingVendor = await Vendor.findByEmail(email);
      if (existingVendor) {
        return res.status(400).json({
          success: false,
          message: 'A vendor with this email already exists'
        });
      }

      // Check if user email already exists
      const existingUser = await VendorUser.findByEmail(user.email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'A user with this email already exists'
        });
      }

      // Create vendor
      const vendor = await Vendor.create({
        company_name,
        contact_name,
        email,
        phone,
        address,
        tax_id,
        status: 'pending'
      });

      // Create vendor user (owner)
      const vendorUser = await VendorUser.create({
        vendor_id: vendor.id,
        email: user.email,
        password: user.password,
        first_name: user.first_name,
        last_name: user.last_name,
        role: 'owner'
      });

      // Log activity
      await ActivityLogger.log({
        user_id: vendorUser.id,
        user_type: 'vendor',
        action: 'vendor_registration',
        entity_type: 'vendor',
        entity_id: vendor.id,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      // Send welcome email
      await EmailService.sendVendorWelcome(vendor, vendorUser);

      // Notify admin via Slack
      await SlackService.notifyNewVendorRegistration(vendor);

      res.status(201).json({
        success: true,
        message: 'Vendor registration successful. Your application is under review.',
        data: {
          vendor: {
            id: vendor.id,
            company_name: vendor.company_name,
            status: vendor.status
          }
        }
      });

    } catch (error) {
      console.error('Vendor registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Vendor Login
  static async vendorLogin(req, res) {
    try {
      const { email, password } = req.body;

      // Demo accounts for when database is not configured
      const demoAccounts = {
        'demo@restaurant.com': {
          password: 'demo123',
          user: {
            id: 1,
            email: 'demo@restaurant.com',
            first_name: 'Demo',
            last_name: 'Owner',
            role: 'owner',
            vendor_id: 1
          },
          vendor: {
            id: 1,
            company_name: 'Demo Restaurant',
            status: 'approved'
          }
        },
        'vendor@coffee.com': {
          password: 'coffee123',
          user: {
            id: 2,
            email: 'vendor@coffee.com',
            first_name: 'Sarah',
            last_name: 'Johnson',
            role: 'owner',
            vendor_id: 2
          },
          vendor: {
            id: 2,
            company_name: 'Artisan Coffee Co',
            status: 'approved'
          }
        },
        'info@organicfarms.com': {
          password: 'organic123',
          user: {
            id: 3,
            email: 'info@organicfarms.com',
            first_name: 'Michael',
            last_name: 'Green',
            role: 'owner',
            vendor_id: 3
          },
          vendor: {
            id: 3,
            company_name: 'Organic Farms LLC',
            status: 'pending'
          }
        }
      };

      // Check if this is a demo account
      const demoAccount = demoAccounts[email];
      if (demoAccount && demoAccount.password === password) {
        console.log(`🎯 Demo login successful for ${email}`);

        // Generate JWT token for demo user
        const tokenPayload = JWTUtil.createVendorPayload(demoAccount.user, demoAccount.vendor);
        const token = JWTUtil.generateToken(tokenPayload);

        return res.json({
          success: true,
          message: 'Demo login successful',
          data: {
            token,
            user: {
              id: demoAccount.user.id,
              email: demoAccount.user.email,
              firstName: demoAccount.user.first_name,
              lastName: demoAccount.user.last_name,
              role: demoAccount.user.role,
              vendor: {
                id: demoAccount.vendor.id,
                companyName: demoAccount.vendor.company_name,
                status: demoAccount.vendor.status
              }
            }
          }
        });
      }

      // Try database authentication if demo account doesn't match
      let user;
      try {
        user = await VendorUser.findByEmailWithPassword(email);
      } catch (dbError) {
        console.log('Database not available, checking demo accounts only');
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Verify password
      const isValidPassword = await VendorUser.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Get vendor details
      const vendor = await Vendor.findById(user.vendor_id);
      if (!vendor) {
        return res.status(401).json({
          success: false,
          message: 'Vendor account not found'
        });
      }

      // Check vendor status
      if (vendor.status === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'Your vendor account has been suspended. Please contact support.'
        });
      }

      if (vendor.status === 'rejected') {
        return res.status(403).json({
          success: false,
          message: 'Your vendor application has been rejected. Please contact support.'
        });
      }

      // Update last login
      await VendorUser.updateLastLogin(user.id);

      // Generate JWT token
      const tokenPayload = JWTUtil.createVendorPayload(user, vendor);
      const token = JWTUtil.generateToken(tokenPayload);

      // Log activity
      await ActivityLogger.log({
        user_id: user.id,
        user_type: 'vendor',
        action: 'login',
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            vendor: {
              id: vendor.id,
              companyName: vendor.company_name,
              status: vendor.status
            }
          }
        }
      });

    } catch (error) {
      console.error('Vendor login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Admin Login
  static async adminLogin(req, res) {
    try {
      const { email, password } = req.body;

      // Demo admin accounts for when database is not configured
      const demoAdminAccounts = {
        'demo@admin.com': {
          password: 'admin123',
          user: {
            id: 1,
            email: 'demo@admin.com',
            first_name: 'Demo',
            last_name: 'Admin',
            role: 'admin',
            permissions: ['manage_vendors', 'manage_products', 'view_reports', 'manage_categories']
          }
        },
        'admin@munchmakers.com': {
          password: 'Admin123!',
          user: {
            id: 2,
            email: 'admin@munchmakers.com',
            first_name: 'Super',
            last_name: 'Admin',
            role: 'super_admin',
            permissions: ['manage_vendors', 'manage_products', 'manage_admins', 'view_reports', 'manage_categories']
          }
        },
        'reviewer@munchmakers.com': {
          password: 'Reviewer123!',
          user: {
            id: 3,
            email: 'reviewer@munchmakers.com',
            first_name: 'Product',
            last_name: 'Reviewer',
            role: 'reviewer',
            permissions: ['review_products', 'view_vendors']
          }
        }
      };

      // Check if this is a demo admin account
      const demoAccount = demoAdminAccounts[email];
      if (demoAccount && demoAccount.password === password) {
        console.log(`🎯 Demo admin login successful for ${email}`);

        // Generate JWT token for demo admin
        const tokenPayload = JWTUtil.createAdminPayload(demoAccount.user);
        const token = JWTUtil.generateToken(tokenPayload);

        return res.json({
          success: true,
          message: 'Demo admin login successful',
          data: {
            token,
            user: {
              id: demoAccount.user.id,
              email: demoAccount.user.email,
              firstName: demoAccount.user.first_name,
              lastName: demoAccount.user.last_name,
              role: demoAccount.user.role,
              permissions: demoAccount.user.permissions
            }
          }
        });
      }

      // Try database authentication if demo account doesn't match
      let user;
      try {
        user = await AdminUser.findByEmailWithPassword(email);
      } catch (dbError) {
        console.log('Database not available, checking demo admin accounts only');
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Verify password
      const isValidPassword = await AdminUser.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Update last login
      await AdminUser.updateLastLogin(user.id);

      // Generate JWT token
      const tokenPayload = JWTUtil.createAdminPayload(user);
      const token = JWTUtil.generateToken(tokenPayload);

      // Log activity
      await ActivityLogger.log({
        user_id: user.id,
        user_type: 'admin',
        action: 'login',
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            permissions: user.permissions
          }
        }
      });

    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Password Reset Request
  static async requestPasswordReset(req, res) {
    try {
      const { email, userType = 'vendor' } = req.body;

      let user;
      if (userType === 'vendor') {
        user = await VendorUser.findByEmail(email);
      } else if (userType === 'admin') {
        user = await AdminUser.findByEmail(email);
      }

      if (!user) {
        // Return success even if user doesn't exist (security)
        return res.json({
          success: true,
          message: 'If an account with that email exists, we have sent password reset instructions.'
        });
      }

      // Generate reset token
      const resetToken = JWTUtil.generateResetToken();

      // Save reset token
      if (userType === 'vendor') {
        await VendorUser.setResetToken(email, resetToken);
      } else {
        await AdminUser.setResetToken(email, resetToken);
      }

      // Send reset email
      await EmailService.sendPasswordReset(user, resetToken, userType);

      // Log activity
      await ActivityLogger.log({
        user_id: user.id,
        user_type: userType,
        action: 'password_reset_request',
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'If an account with that email exists, we have sent password reset instructions.'
      });

    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({
        success: false,
        message: 'Password reset request failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Reset Password
  static async resetPassword(req, res) {
    try {
      const { token, password, userType = 'vendor' } = req.body;

      let user;
      if (userType === 'vendor') {
        user = await VendorUser.findByResetToken(token);
      } else if (userType === 'admin') {
        user = await AdminUser.findByResetToken(token);
      }

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      // Update password
      if (userType === 'vendor') {
        await VendorUser.update(user.id, { password });
        await VendorUser.clearResetToken(user.id);
      } else {
        await AdminUser.update(user.id, { password });
        await AdminUser.clearResetToken(user.id);
      }

      // Log activity
      await ActivityLogger.log({
        user_id: user.id,
        user_type: userType,
        action: 'password_reset_complete',
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Password reset successful'
      });

    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({
        success: false,
        message: 'Password reset failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get Current User Profile
  static async getProfile(req, res) {
    try {
      const { id, type } = req.user;

      let user;
      if (type === 'vendor') {
        user = await VendorUser.getUserWithVendor(id);
      } else if (type === 'admin') {
        user = await AdminUser.findById(id);
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: { user }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Update Profile
  static async updateProfile(req, res) {
    try {
      const { id, type } = req.user;
      const updates = req.body;

      // Remove sensitive fields
      delete updates.password_hash;
      delete updates.reset_token;
      delete updates.reset_token_expires;

      let user;
      if (type === 'vendor') {
        user = await VendorUser.update(id, updates);
      } else if (type === 'admin') {
        user = await AdminUser.update(id, updates);
      }

      // Log activity
      await ActivityLogger.log({
        user_id: id,
        user_type: type,
        action: 'profile_update',
        metadata: { updated_fields: Object.keys(updates) },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Change Password
  static async changePassword(req, res) {
    try {
      const { id, type } = req.user;
      const { currentPassword, newPassword } = req.body;

      let user;
      if (type === 'vendor') {
        user = await VendorUser.findByEmailWithPassword(req.user.email);
      } else if (type === 'admin') {
        user = await AdminUser.findByEmailWithPassword(req.user.email);
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isValidPassword = type === 'vendor' 
        ? await VendorUser.verifyPassword(currentPassword, user.password_hash)
        : await AdminUser.verifyPassword(currentPassword, user.password_hash);

      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      if (type === 'vendor') {
        await VendorUser.update(id, { password: newPassword });
      } else {
        await AdminUser.update(id, { password: newPassword });
      }

      // Log activity
      await ActivityLogger.log({
        user_id: id,
        user_type: type,
        action: 'password_change',
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = AuthController;