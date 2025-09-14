const express = require('express');
const UploadController = require('../controllers/uploadController');
const { anyAuth } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/security');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/designs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'design-' + uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf', 'application/postscript', 'image/vnd.adobe.photoshop',
    'application/illustrator', 'application/x-illustrator'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed. Supported: JPG, PNG, PDF, AI, PSD'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for design files
    files: 10 // Maximum 10 files per upload
  }
});

// Apply rate limiting
router.use(generalLimiter);

// Upload design files
router.post('/design-files', anyAuth, upload.array('files', 10), UploadController.uploadDesignFiles);

// Get files for order
router.get('/order/:order_id', anyAuth, UploadController.getOrderFiles);

// Download file
router.get('/download/:id', anyAuth, UploadController.downloadFile);

// Delete file
router.delete('/:id', anyAuth, UploadController.deleteFile);

// Get upload statistics
router.get('/stats/overview', anyAuth, UploadController.getUploadStats);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB per file.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 files per upload.'
      });
    }
  }

  if (error.message.includes('File type not allowed')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
});

module.exports = router;