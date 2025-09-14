const db = require('../config/database');
const crypto = require('crypto');

class ProofApproval {
  static async create(proofData) {
    // Generate approval token if not provided
    if (!proofData.approval_token) {
      proofData.approval_token = crypto.randomBytes(32).toString('hex');
    }

    // Set expiration date (7 days from now)
    if (!proofData.expires_at) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);
      proofData.expires_at = expirationDate;
    }

    const [proof] = await db('customer_proof_approvals').insert(proofData).returning('*');
    return proof;
  }

  static async findById(id) {
    return await db('customer_proof_approvals').where({ id }).first();
  }

  static async findByToken(token) {
    return await db('customer_proof_approvals')
      .select(
        'customer_proof_approvals.*',
        'orders.order_number',
        'orders.customer_name',
        'orders.total_amount',
        'order_items.product_name',
        'order_items.sku',
        'stores.name as store_name'
      )
      .leftJoin('orders', 'customer_proof_approvals.order_id', 'orders.id')
      .leftJoin('order_items', 'customer_proof_approvals.order_item_id', 'order_items.id')
      .leftJoin('stores', 'orders.store_id', 'stores.id')
      .where('customer_proof_approvals.approval_token', token)
      .first();
  }

  static async findByOrderId(orderId) {
    return await db('customer_proof_approvals')
      .select(
        'customer_proof_approvals.*',
        'order_items.product_name',
        'order_items.sku'
      )
      .leftJoin('order_items', 'customer_proof_approvals.order_item_id', 'order_items.id')
      .where('customer_proof_approvals.order_id', orderId)
      .orderBy('customer_proof_approvals.created_at', 'desc');
  }

  static async findByVendorId(vendorId, filters = {}) {
    const { status, proof_type } = filters;

    let query = db('customer_proof_approvals')
      .select(
        'customer_proof_approvals.*',
        'orders.order_number',
        'orders.customer_name',
        'order_items.product_name',
        'order_items.sku',
        'stores.name as store_name'
      )
      .leftJoin('vendor_assignments', 'customer_proof_approvals.vendor_assignment_id', 'vendor_assignments.id')
      .leftJoin('orders', 'customer_proof_approvals.order_id', 'orders.id')
      .leftJoin('order_items', 'customer_proof_approvals.order_item_id', 'order_items.id')
      .leftJoin('stores', 'orders.store_id', 'stores.id')
      .where('vendor_assignments.vendor_id', vendorId);

    if (status) {
      query = query.where('customer_proof_approvals.status', status);
    }

    if (proof_type) {
      query = query.where('customer_proof_approvals.proof_type', proof_type);
    }

    return await query.orderBy('customer_proof_approvals.created_at', 'desc');
  }

  static async updateStatus(id, status, responseNotes = null, respondedBy = null) {
    const updateData = {
      status,
      responded_at: new Date(),
      updated_at: new Date()
    };

    if (responseNotes) {
      updateData.response_notes = responseNotes;
    }

    const [proof] = await db('customer_proof_approvals')
      .where({ id })
      .update(updateData)
      .returning('*');

    // Log the response
    if (respondedBy) {
      await db('customer_approval_responses').insert({
        proof_approval_id: id,
        response_type: status,
        response_message: responseNotes,
        created_at: new Date()
      });
    }

    return proof;
  }

  static async customerApproval(token, status, responseMessage = null, customerInfo = {}) {
    const proof = await ProofApproval.findByToken(token);
    if (!proof) {
      throw new Error('Invalid or expired approval token');
    }

    // Check if token is expired
    if (new Date() > new Date(proof.expires_at)) {
      throw new Error('Approval token has expired');
    }

    // Check if already responded
    if (proof.status !== 'pending') {
      throw new Error('Proof has already been responded to');
    }

    // Update proof status
    const updatedProof = await ProofApproval.updateStatus(proof.id, status, responseMessage);

    // Log customer response
    await db('customer_approval_responses').insert({
      proof_approval_id: proof.id,
      response_type: status,
      response_message: responseMessage,
      response_ip: customerInfo.ip,
      response_user_agent: customerInfo.userAgent,
      created_at: new Date()
    });

    // Update order production status if approved
    if (status === 'approved') {
      await ProofApproval.updateOrderProductionStatus(proof.order_id, proof.vendor_assignment_id, proof.proof_type);
    }

    return updatedProof;
  }

  static async updateOrderProductionStatus(orderId, vendorAssignmentId, proofType) {
    // Get or create production status record
    let productionStatus = await db('order_production_status')
      .where({ order_id: orderId, vendor_assignment_id: vendorAssignmentId })
      .first();

    if (!productionStatus) {
      productionStatus = await db('order_production_status').insert({
        order_id: orderId,
        vendor_assignment_id: vendorAssignmentId,
        design_proof_status: 'pending',
        production_proof_status: 'pending'
      }).returning('*');
      productionStatus = productionStatus[0];
    }

    // Update the specific proof type
    const updateField = proofType === 'design_proof' ? 'design_proof_status' : 'production_proof_status';
    await db('order_production_status')
      .where({ id: productionStatus.id })
      .update({
        [updateField]: 'approved',
        updated_at: new Date()
      });

    return productionStatus;
  }

  static async getOrderProductionStatus(orderId) {
    return await db('order_production_status')
      .where('order_id', orderId)
      .first();
  }

  static async delete(id) {
    return await db('customer_proof_approvals').where({ id }).delete();
  }

  static async addProofImages(proofId, images) {
    const imageRecords = images.map(image => ({
      proof_approval_id: proofId,
      filename: image.filename,
      original_filename: image.originalname,
      file_path: image.path,
      file_size: image.size,
      mime_type: image.mimetype,
      image_url: image.url,
      thumbnail_url: image.thumbnail_url,
      uploaded_by: image.uploaded_by
    }));

    return await db('proof_images').insert(imageRecords).returning('*');
  }

  static async getProofImages(proofId) {
    return await db('proof_images')
      .where('proof_approval_id', proofId)
      .orderBy('created_at');
  }

  static async getPendingProofs(vendorId = null) {
    let query = db('customer_proof_approvals')
      .select(
        'customer_proof_approvals.*',
        'orders.order_number',
        'orders.customer_name',
        'order_items.product_name'
      )
      .leftJoin('orders', 'customer_proof_approvals.order_id', 'orders.id')
      .leftJoin('order_items', 'customer_proof_approvals.order_item_id', 'order_items.id')
      .where('customer_proof_approvals.status', 'pending')
      .where('customer_proof_approvals.expires_at', '>', new Date());

    if (vendorId) {
      query = query
        .leftJoin('vendor_assignments', 'customer_proof_approvals.vendor_assignment_id', 'vendor_assignments.id')
        .where('vendor_assignments.vendor_id', vendorId);
    }

    return await query.orderBy('customer_proof_approvals.created_at', 'desc');
  }

  static async getStats(vendorId = null) {
    let query = db('customer_proof_approvals');

    if (vendorId) {
      query = query
        .leftJoin('vendor_assignments', 'customer_proof_approvals.vendor_assignment_id', 'vendor_assignments.id')
        .where('vendor_assignments.vendor_id', vendorId);
    }

    const stats = await query
      .select(
        db.raw('COUNT(*) as total_proofs'),
        db.raw('COUNT(CASE WHEN status = \'pending\' THEN 1 END) as pending_proofs'),
        db.raw('COUNT(CASE WHEN status = \'approved\' THEN 1 END) as approved_proofs'),
        db.raw('COUNT(CASE WHEN status = \'rejected\' THEN 1 END) as rejected_proofs'),
        db.raw('COUNT(CASE WHEN status = \'revision_requested\' THEN 1 END) as revision_requested'),
        db.raw('COUNT(CASE WHEN expires_at < CURRENT_TIMESTAMP AND status = \'pending\' THEN 1 END) as expired_proofs')
      )
      .first();

    return {
      total_proofs: parseInt(stats.total_proofs),
      pending_proofs: parseInt(stats.pending_proofs),
      approved_proofs: parseInt(stats.approved_proofs),
      rejected_proofs: parseInt(stats.rejected_proofs),
      revision_requested: parseInt(stats.revision_requested),
      expired_proofs: parseInt(stats.expired_proofs)
    };
  }
}

module.exports = ProofApproval;