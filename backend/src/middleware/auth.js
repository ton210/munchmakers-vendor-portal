const JWTUtil = require('../utils/jwt');
const VendorUser = require('../models/VendorUser');
const AdminUser = require('../models/AdminUser');

const authMiddleware = (userType = null) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      const token = JWTUtil.extractTokenFromHeader(authHeader);

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
      }

      const decoded = JWTUtil.verifyToken(token);
      
      // Verify user type if specified
      if (userType && decoded.type !== userType) {
        return res.status(403).json({
          success: false,
          message: 'Access denied for this user type'
        });
      }

      // Verify user still exists and is active
      let user;
      if (decoded.type === 'vendor') {
        user = await VendorUser.findById(decoded.id);
        if (!user || !user.is_active) {
          return res.status(401).json({
            success: false,
            message: 'User account is inactive'
          });
        }
      } else if (decoded.type === 'admin') {
        user = await AdminUser.findById(decoded.id);
        if (!user || !user.is_active) {
          return res.status(401).json({
            success: false,
            message: 'Admin account is inactive'
          });
        }
      }

      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: error.message
      });
    }
  };
};

// Middleware for vendor users only
const vendorAuth = authMiddleware('vendor');

// Middleware for admin users only
const adminAuth = authMiddleware('admin');

// Middleware for any authenticated user
const anyAuth = authMiddleware();

// Middleware to check vendor status (approved only)
const approvedVendorAuth = async (req, res, next) => {
  vendorAuth(req, res, async (err) => {
    if (err) return next(err);

    if (req.user.vendorStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Vendor account must be approved to access this resource'
      });
    }

    next();
  });
};

// Middleware to check admin permissions
const adminPermission = (permission) => {
  return async (req, res, next) => {
    try {
      // First check admin auth
      await new Promise((resolve, reject) => {
        adminAuth(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Super admin has all permissions
      if (req.user.role === 'super_admin') {
        return next();
      }

      // Check specific permission
      const hasPermission = await AdminUser.hasPermission(req.user.id, permission);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required permission: ${permission}`
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed',
        error: error.message
      });
    }
  };
};

// Middleware to check vendor ownership or admin access
const vendorOwnershipOrAdmin = async (req, res, next) => {
  try {
    const token = JWTUtil.extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const decoded = JWTUtil.verifyToken(token);
    req.user = decoded;

    if (decoded.type === 'admin') {
      return next();
    }

    if (decoded.type === 'vendor') {
      const vendorId = req.params.vendorId || req.body.vendorId;
      if (decoded.vendorId !== parseInt(vendorId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own vendor data.'
        });
      }
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message
    });
  }
};

module.exports = {
  authMiddleware,
  vendorAuth,
  adminAuth,
  anyAuth,
  approvedVendorAuth,
  adminPermission,
  vendorOwnershipOrAdmin
};