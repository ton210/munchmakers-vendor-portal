const ProofApproval = require('../models/ProofApproval');
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const EmailService = require('../services/emailService');
const SlackService = require('../services/slackService');
const ActivityLogger = require('../services/activityLogger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

class ProofController {
  // Create proof approval request
  static async createProofApproval(req, res) {
    try {
      const {
        order_id,
        order_item_id,
        vendor_assignment_id,
        proof_type,
        custom_message,
        proof_images
      } = req.body;

      // Verify vendor has access to this order
      if (req.user.type === 'vendor') {
        const vendor = await Vendor.findByUserId(req.user.id);
        const assignment = await db('vendor_assignments')
          .where({ id: vendor_assignment_id, vendor_id: vendor?.id })
          .first();

        if (!assignment) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this order assignment'
          });
        }
      }

      // Get order details for customer email
      const order = await Order.getWithDetails(order_id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Create proof approval record
      const proofData = {
        order_id,
        order_item_id,
        vendor_assignment_id,
        proof_type,
        proof_images: JSON.stringify(proof_images),
        customer_email: order.customer_email,
        customer_name: order.customer_name,
        created_by: req.user.id
      };

      const proof = await ProofApproval.create(proofData);

      // Send approval email to customer
      try {
        await EmailService.sendProofApprovalEmail(proof, order, custom_message);
      } catch (emailError) {
        console.error('Failed to send proof approval email:', emailError);
        // Continue without failing the request
      }

      // Send Slack notification
      try {
        await SlackService.notifyProofSubmission(proof, order);
      } catch (slackError) {
        console.error('Failed to send Slack notification:', slackError);
      }

      // Log activity
      await ActivityLogger.log({
        user_id: req.user.id,
        user_type: req.user.type,
        action: 'proof_submission',
        entity_type: 'proof_approval',
        entity_id: proof.id,
        metadata: {
          order_id,
          proof_type,
          customer_email: order.customer_email
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.status(201).json({
        success: true,
        message: 'Proof submitted for customer approval',
        data: { proof }
      });

    } catch (error) {
      console.error('Create proof approval error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create proof approval',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get proofs for vendor or admin
  static async getProofs(req, res) {
    try {
      const { status, proof_type, order_id } = req.query;

      let proofs;
      if (req.user.type === 'vendor') {
        const vendor = await Vendor.findByUserId(req.user.id);
        if (!vendor) {
          return res.status(404).json({
            success: false,
            message: 'Vendor profile not found'
          });
        }

        proofs = await ProofApproval.findByVendorId(vendor.id, { status, proof_type });
      } else {
        // Admin can see all proofs
        if (order_id) {
          proofs = await ProofApproval.findByOrderId(order_id);
        } else {
          proofs = await ProofApproval.findByVendorId(null, { status, proof_type });
        }
      }

      res.json({
        success: true,
        data: { proofs }
      });

    } catch (error) {
      console.error('Get proofs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get proofs',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get single proof with details
  static async getProof(req, res) {
    try {
      const { id } = req.params;
      const proof = await ProofApproval.findById(id);

      if (!proof) {
        return res.status(404).json({
          success: false,
          message: 'Proof not found'
        });
      }

      // Check permissions
      if (req.user.type === 'vendor') {
        const vendor = await Vendor.findByUserId(req.user.id);
        const assignment = await db('vendor_assignments')
          .where({ id: proof.vendor_assignment_id, vendor_id: vendor?.id })
          .first();

        if (!assignment) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      // Get proof images
      const images = await ProofApproval.getProofImages(id);

      res.json({
        success: true,
        data: {
          proof: {
            ...proof,
            images
          }
        }
      });

    } catch (error) {
      console.error('Get proof error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get proof',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Customer approval endpoint (no auth required, uses token)
  static async customerApproval(req, res) {
    try {
      const { token } = req.params;
      const { status, response_message } = req.body;

      if (!['approved', 'rejected', 'revision_requested'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid approval status'
        });
      }

      const customerInfo = {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };

      const proof = await ProofApproval.customerApproval(token, status, response_message, customerInfo);

      // Send notification to vendor and admin
      try {
        await SlackService.notifyProofResponse(proof, status, response_message);
      } catch (slackError) {
        console.error('Failed to send Slack notification:', slackError);
      }

      res.json({
        success: true,
        message: `Proof ${status} successfully`,
        data: { proof }
      });

    } catch (error) {
      console.error('Customer approval error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to process approval',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Invalid request'
      });
    }
  }

  // Get customer approval page (public endpoint)
  static async getCustomerApprovalPage(req, res) {
    try {
      const { token } = req.params;
      const proof = await ProofApproval.findByToken(token);

      if (!proof) {
        return res.status(404).json({
          success: false,
          message: 'Invalid or expired approval link'
        });
      }

      // Check if token is expired
      if (new Date() > new Date(proof.expires_at)) {
        return res.status(410).json({
          success: false,
          message: 'Approval link has expired'
        });
      }

      // Check if already responded
      if (proof.status !== 'pending') {
        return res.json({
          success: true,
          message: 'Proof has already been responded to',
          data: {
            proof: {
              ...proof,
              already_responded: true
            }
          }
        });
      }

      // Get proof images
      const images = await ProofApproval.getProofImages(proof.id);

      res.json({
        success: true,
        data: {
          proof: {
            ...proof,
            images
          }
        }
      });

    } catch (error) {
      console.error('Get customer approval page error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load approval page',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get proof statistics
  static async getProofStats(req, res) {
    try {
      let vendorId = null;
      if (req.user.type === 'vendor') {
        const vendor = await Vendor.findByUserId(req.user.id);
        vendorId = vendor?.id;
      }

      const stats = await ProofApproval.getStats(vendorId);

      res.json({
        success: true,
        data: { stats }
      });

    } catch (error) {
      console.error('Get proof stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get proof statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Resend proof approval email
  static async resendApprovalEmail(req, res) {
    try {
      const { id } = req.params;
      const { custom_message } = req.body;

      const proof = await ProofApproval.findById(id);
      if (!proof) {
        return res.status(404).json({
          success: false,
          message: 'Proof not found'
        });
      }

      if (proof.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Cannot resend email for non-pending proofs'
        });
      }

      const order = await Order.getWithDetails(proof.order_id);
      await EmailService.sendProofApprovalEmail(proof, order, custom_message);

      res.json({
        success: true,
        message: 'Approval email resent successfully'
      });

    } catch (error) {
      console.error('Resend approval email error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resend approval email',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = ProofController;