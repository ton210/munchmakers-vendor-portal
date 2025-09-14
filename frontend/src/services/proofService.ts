import api from './api';

export const proofService = {
  // Create proof approval
  async createProofApproval(data: {
    order_id: number;
    order_item_id: number;
    vendor_assignment_id: number;
    proof_type: 'design_proof' | 'production_proof';
    custom_message?: string;
    proof_images: string[];
  }, files?: File[]) {
    const formData = new FormData();

    // Add form fields
    Object.keys(data).forEach(key => {
      if (key === 'proof_images') {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key].toString());
      }
    });

    // Add files
    if (files) {
      files.forEach(file => {
        formData.append('proof_images', file);
      });
    }

    const response = await api.post('/proofs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Get proofs with filtering
  async getProofs(filters?: {
    status?: string;
    proof_type?: string;
    order_id?: number;
  }) {
    const response = await api.get('/proofs', { params: filters });
    return response.data;
  },

  // Get single proof
  async getProof(id: number) {
    const response = await api.get(`/proofs/${id}`);
    return response.data;
  },

  // Get proof statistics
  async getProofStats() {
    const response = await api.get('/proofs/stats/overview');
    return response.data;
  },

  // Resend approval email
  async resendApprovalEmail(id: number, customMessage?: string) {
    const response = await api.post(`/proofs/${id}/resend`, {
      custom_message: customMessage
    });
    return response.data;
  },

  // Customer approval (no auth required)
  async getCustomerApprovalPage(token: string) {
    const response = await api.get(`/proofs/customer/${token}`);
    return response.data;
  },

  // Submit customer approval
  async submitCustomerApproval(token: string, status: string, responseMessage?: string) {
    const response = await api.post(`/proofs/customer/${token}/approve`, {
      status,
      response_message: responseMessage
    });
    return response.data;
  }
};