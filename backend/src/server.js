require('dotenv').config({ path: '../.env' });
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const session = require('express-session');
const morgan = require('morgan');

// Import middleware
const { 
  generalLimiter, 
  helmetConfig, 
  requestLogger,
  sanitizeInput 
} = require('./middleware/security');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const adminRoutes = require('./routes/admin');
const vendorRoutes = require('./routes/vendors');
const categoryRoutes = require('./routes/categories');
const apiTestRoutes = require('./routes/apiTest');
const financialRoutes = require('./routes/financials');
const messageRoutes = require('./routes/messages');
const orderRoutes = require('./routes/orders');
const storeRoutes = require('./routes/stores');
const proofRoutes = require('./routes/proofs');
const trackingRoutes = require('./routes/tracking');
const orderSplittingRoutes = require('./routes/orderSplitting');
const zakekeRoutes = require('./routes/zakeke');
const uploadRoutes = require('./routes/uploads');
const communicationRoutes = require('./routes/communications');
const trackshipSetupRoutes = require('./routes/trackshipSetup');
const productSyncRoutes = require('./routes/productSync');
const translationRoutes = require('./routes/translation');
const orderMonitoringRoutes = require('./routes/orderMonitoring');

// Import services
const SlackService = require('./services/slackService');
const Scheduler = require('./services/scheduler');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for accurate client IP addresses (required for Heroku)
app.set('trust proxy', 1);

// Security middleware
app.use(helmetConfig);
app.use(generalLimiter);
app.use(sanitizeInput);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://vendor.munchmakers.com',
      'https://vendors.munchmakers.com',
      'https://munchmakers-vendor-portal.herokuapp.com',
      'https://munchmakers-vendor-portal-a05873c786c1.herokuapp.com',
      'https://mm-vendor-portal-d3474393e1a8.herokuapp.com'
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // In production, also allow same-origin requests
    if (process.env.NODE_ENV === 'production' && !origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}
app.use(requestLogger);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/test', apiTestRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/financials', financialRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/proofs', proofRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/order-splitting', orderSplittingRoutes);
app.use('/api/zakeke', zakekeRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/trackship-setup', trackshipSetupRoutes);
app.use('/api/product-sync', productSyncRoutes);
app.use('/api/translation', translationRoutes);
app.use('/api/order-monitoring', orderMonitoringRoutes);

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Serve React frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  
  // Serve static files from React app build directory
  app.use(express.static(path.join(__dirname, '../../frontend/build')));
  
  // Catch all handler: send back React's index.html file for any non-API routes
  app.get('*', (req, res) => {
    console.log(`📄 Serving React app for route: ${req.path}`);
    res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'));
  });
} else {
  // Root endpoint - serve basic HTML landing page in development
  app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MunchMakers Vendor Portal</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
          .container { max-width: 800px; margin: 0 auto; padding: 2rem; text-align: center; }
          .logo { width: 200px; height: auto; margin-bottom: 2rem; }
          h1 { font-size: 3rem; margin-bottom: 1rem; }
          p { font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9; }
          .api-info { background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 10px; margin: 2rem 0; }
          .endpoint { background: rgba(255,255,255,0.2); padding: 1rem; margin: 0.5rem 0; border-radius: 5px; font-family: monospace; }
          .btn { display: inline-block; background: rgba(255,255,255,0.2); padding: 12px 24px; text-decoration: none; color: white; border-radius: 5px; margin: 0.5rem; transition: all 0.3s; }
          .btn:hover { background: rgba(255,255,255,0.3); transform: translateY(-2px); }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="https://cdn11.bigcommerce.com/s-tqjrceegho/images/stencil/500w/munchmakers-logo_1_1752112946__55141.original.png" alt="MunchMakers Logo" class="logo">
          <h1>MunchMakers Vendor Portal</h1>
          <p>Enterprise-grade vendor self-service portal API is now running!</p>
          
          <div class="api-info">
            <h3>🚀 API Status: ACTIVE</h3>
            <p>The backend API is successfully deployed and ready to serve requests.</p>
            
            <h4>📡 Available Endpoints:</h4>
            <div class="endpoint">GET /health - Health check</div>
            <div class="endpoint">POST /api/auth/vendor/login - Vendor login</div>
            <div class="endpoint">POST /api/auth/admin/login - Admin login</div>
            <div class="endpoint">POST /api/auth/vendor/register - Vendor registration</div>
            <div class="endpoint">GET /api/products - Get products</div>
            <div class="endpoint">GET /api/admin/dashboard/stats - Admin dashboard</div>
            
            <h4>🔐 Default Admin Login:</h4>
            <div class="endpoint">Email: admin@munchmakers.com</div>
            <div class="endpoint">Password: Admin123!</div>
          </div>
          
          <div>
            <a href="/health" class="btn">🔍 Health Check</a>
            <a href="/api/admin/dashboard/stats" class="btn">📊 API Test</a>
          </div>
          
          <p style="margin-top: 2rem; opacity: 0.7; font-size: 0.9rem;">
            Frontend coming soon! API is fully functional and ready for integration.
          </p>
        </div>
      </body>
    </html>
  `);
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Send critical errors to Slack in production
  if (process.env.NODE_ENV === 'production') {
    SlackService.notifySystemError(err, 'API Error');
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  // Database errors
  if (err.code === 'ER_DUP_ENTRY' || err.code === '23505') {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry error'
    });
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File size too large'
    });
  }

  // Default error response
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? {
      stack: err.stack,
      details: err
    } : undefined
  });
});

// Note: 404 handler moved above to only handle /api/* routes

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  
  if (process.env.NODE_ENV === 'production') {
    SlackService.notifySystemError(
      new Error(`Unhandled Rejection: ${reason}`), 
      'Unhandled Promise Rejection'
    );
  }
});

// Uncaught exception
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  
  if (process.env.NODE_ENV === 'production') {
    SlackService.notifySystemError(error, 'Uncaught Exception');
  }
  
  process.exit(1);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Database URL: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);

  // Initialize scheduled tasks in production
  if (process.env.NODE_ENV === 'production') {
    console.log('🚀 Initializing scheduled order monitoring...');
    Scheduler.init();
  }
});

module.exports = app;