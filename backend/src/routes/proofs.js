const express = require('express');
const ProofController = require('../controllers/proofController');
const { anyAuth, adminAuth, vendorAuth } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/security');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for proof image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/proofs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'proof-' + uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, PNG, WEBP) are allowed for proofs'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Apply rate limiting
router.use(generalLimiter);

// Create proof approval (vendors and admins)
router.post('/', anyAuth, upload.array('proof_images', 10), ProofController.createProofApproval);

// Get proofs (with role-based filtering)
router.get('/', anyAuth, ProofController.getProofs);

// Get single proof
router.get('/:id', anyAuth, ProofController.getProof);

// Get proof statistics
router.get('/stats/overview', anyAuth, ProofController.getProofStats);

// Resend approval email
router.post('/:id/resend', anyAuth, ProofController.resendApprovalEmail);

// Customer approval endpoints (no auth required)
router.get('/customer/:token', ProofController.getCustomerApprovalPage);
router.post('/customer/:token/approve', ProofController.customerApproval);

// Serve proof images
router.get('/images/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join(__dirname, '../../uploads/proofs', filename);

    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    res.sendFile(imagePath);
  } catch (error) {
    console.error('Serve proof image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve image'
    });
  }
});

module.exports = router;