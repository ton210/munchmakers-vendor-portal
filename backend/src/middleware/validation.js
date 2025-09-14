const { body, param, query, validationResult } = require('express-validator');

// Helper to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

// Vendor registration validation
const validateVendorRegistration = [
  body('company_name')
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Company name must be between 2 and 255 characters'),
  
  body('contact_name')
    .notEmpty()
    .withMessage('Contact name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Contact name must be between 2 and 255 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  
  body('address')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Address must not exceed 1000 characters'),
  
  body('tax_id')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Tax ID must not exceed 100 characters'),

  handleValidationErrors
];

// User registration validation
const validateUserRegistration = [
  body('first_name')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters'),
  
  body('last_name')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  
  body('role')
    .optional()
    .isIn(['owner', 'manager', 'employee'])
    .withMessage('Role must be owner, manager, or employee'),

  handleValidationErrors
];

// Login validation
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  handleValidationErrors
];

// Product validation
const validateProduct = [
  body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Product name must be between 2 and 255 characters'),
  
  body('sku')
    .notEmpty()
    .withMessage('SKU is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('SKU must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Description must not exceed 5000 characters'),
  
  body('category_id')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('Category ID must be a positive integer'),
  
  body('base_price')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Base price must be a positive number'),
  
  body('moq')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('MOQ must be a positive integer'),
  
  body('production_time')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('Production time must be a positive integer'),
  
  body('weight')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Weight must be a positive number'),

  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id')
    .isInt({ gt: 0 })
    .withMessage('ID must be a positive integer'),

  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ gt: 0, max: 100 })
    .withMessage('Limit must be a positive integer not exceeding 100'),

  handleValidationErrors
];

// Email validation
const validateEmail = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),

  handleValidationErrors
];

// Password reset validation
const validatePasswordReset = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),

  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateVendorRegistration,
  validateUserRegistration,
  validateLogin,
  validateProduct,
  validateId,
  validatePagination,
  validateEmail,
  validatePasswordReset
};