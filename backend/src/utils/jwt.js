const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class JWTUtil {
  static generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'munchmakers-vendor-portal'
    });
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static generateRefreshToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  static generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  static extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  static createVendorPayload(user, vendor) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      vendorId: user.vendor_id,
      vendorStatus: vendor.status,
      companyName: vendor.company_name,
      type: 'vendor'
    };
  }

  static createAdminPayload(user) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      permissions: user.permissions,
      type: 'admin'
    };
  }
}

module.exports = JWTUtil;