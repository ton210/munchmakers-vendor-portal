import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { DataTable, Column } from '../../components/ui/DataTable';
import {
  PhotoIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';
import { proofService } from '../../services/proofService';
import toast from 'react-hot-toast';

interface ProofApproval {
  id: number;
  order_id: number;
  order_number: string;
  product_name: string;
  sku: string;
  proof_type: 'design_proof' | 'production_proof';
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  customer_email: string;
  customer_name: string;
  approval_token: string;
  sent_at: string;
  responded_at?: string;
  expires_at: string;
  response_notes?: string;
  proof_images: string[];
}

export const ProofApproval: React.FC = () => {
  const [proofs, setProofs] = useState<ProofApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<ProofApproval | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);

  const [filters, setFilters] = useState({
    status: '',
    proof_type: '',
    search: ''
  });

  const [stats, setStats] = useState({
    total_proofs: 0,
    pending_proofs: 0,
    approved_proofs: 0,
    rejected_proofs: 0,
    revision_requested: 0,
    expired_proofs: 0
  });

  useEffect(() => {
    loadProofs();
    loadStats();
  }, [filters]);

  const loadProofs = async () => {
    setLoading(true);
    try {
      const response = await proofService.getProofs(filters);
      if (response.success) {
        setProofs(response.data.proofs || []);
      } else {
        toast.error(response.message || 'Failed to load proofs');
      }
    } catch (error: any) {
      console.error('Failed to load proofs:', error);
      toast.error('Failed to load proofs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await proofService.getProofStats();
      if (response.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to load proof stats:', error);
    }
  };

  const handleResendEmail = async (proofId: number) => {
    try {
      const response = await proofService.resendApprovalEmail(proofId);
      if (response.success) {
        toast.success('Approval email resent successfully');
      } else {
        toast.error(response.message || 'Failed to resend email');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend email');
    }
  };

  const getStatusColor = (status: string): string => {
    const statusColors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'revision_requested': 'bg-blue-100 text-blue-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const statusIcons: { [key: string]: any } = {
      'pending': ClockIcon,
      'approved': CheckCircleIcon,
      'rejected': XCircleIcon,
      'revision_requested': ArrowPathIcon
    };
    const IconComponent = statusIcons[status] || ClockIcon;
    return <IconComponent className="w-4 h-4" />;
  };

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {getStatusIcon(status)}
      <span className="ml-1">{status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}</span>
    </span>
  );

  const columns: Column[] = [
    {
      key: 'order_number',
      label: 'Order',
      render: (value, item) => (
        <div>
          <div className="font-medium text-gray-900">#{value}</div>
          <div className="text-sm text-gray-500">{item.product_name}</div>
        </div>
      )
    },
    {
      key: 'customer_name',
      label: 'Customer',
      render: (value, item) => (
        <div>
          <div className="font-medium text-gray-900">{value || 'N/A'}</div>
          <div className="text-sm text-gray-500">{item.customer_email}</div>
        </div>
      )
    },
    {
      key: 'proof_type',
      label: 'Type',
      render: (value) => (
        <span className="capitalize text-sm text-gray-900">
          {value.replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'sent_at',
      label: 'Sent',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'expires_at',
      label: 'Expires',
      render: (value) => {
        const isExpired = new Date() > new Date(value);
        return (
          <span className={isExpired ? 'text-red-600 font-medium' : 'text-gray-900'}>
            {new Date(value).toLocaleDateString()}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, item) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedProof(item);
              setShowProofModal(true);
            }}
            className="text-indigo-600 hover:text-indigo-900"
            title="View proof"
          >
            <EyeIcon className="h-4 w-4" />
          </button>

          {item.status === 'pending' && (
            <button
              onClick={() => handleResendEmail(item.id)}
              className="text-green-600 hover:text-green-900"
              title="Resend approval email"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <Layout title="Customer Proof Approvals">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Proof Approvals</h1>
            <p className="text-gray-600 mt-1">Manage design and production proof approvals</p>
          </div>
          <Button onClick={loadProofs} variant="secondary" disabled={loading}>
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {[
            { label: 'Total Proofs', value: stats.total_proofs, color: 'bg-blue-500' },
            { label: 'Pending', value: stats.pending_proofs, color: 'bg-yellow-500' },
            { label: 'Approved', value: stats.approved_proofs, color: 'bg-green-500' },
            { label: 'Rejected', value: stats.rejected_proofs, color: 'bg-red-500' },
            { label: 'Revisions', value: stats.revision_requested, color: 'bg-purple-500' },
            { label: 'Expired', value: stats.expired_proofs, color: 'bg-gray-500' }
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="flex items-center p-4">
                <div className={`p-2 rounded-full ${stat.color} text-white mr-3`}>
                  <PhotoIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">{stat.label}</p>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="revision_requested">Revision Requested</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proof Type</label>
                <select
                  value={filters.proof_type}
                  onChange={(e) => setFilters(prev => ({ ...prev, proof_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Types</option>
                  <option value="design_proof">Design Proof</option>
                  <option value="production_proof">Production Proof</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Order #, customer name..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proofs Table */}
        <DataTable
          columns={columns}
          data={proofs}
          loading={loading}
          emptyMessage="No proof approvals found. Proofs will appear here when you submit them for customer approval."
        />

        {/* Proof Details Modal */}
        {showProofModal && selectedProof && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Proof for Order #{selectedProof.order_number}
                </h3>
                <button
                  onClick={() => setShowProofModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Proof Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Proof Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Product</dt>
                        <dd className="text-sm text-gray-900">{selectedProof.product_name}</dd>
                        <dd className="text-sm text-gray-500">SKU: {selectedProof.sku}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Proof Type</dt>
                        <dd className="text-sm text-gray-900 capitalize">
                          {selectedProof.proof_type.replace('_', ' ')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                        <dd className="text-sm">
                          <StatusBadge status={selectedProof.status} />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Customer</dt>
                        <dd className="text-sm text-gray-900">{selectedProof.customer_name}</dd>
                        <dd className="text-sm text-gray-500">{selectedProof.customer_email}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Sent Date</dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(selectedProof.sent_at).toLocaleString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Expires</dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(selectedProof.expires_at).toLocaleString()}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                {/* Proof Images */}
                <Card>
                  <CardHeader>
                    <CardTitle>Proof Images</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedProof.proof_images && selectedProof.proof_images.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {selectedProof.proof_images.map((imageUrl, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                            <img
                              src={imageUrl}
                              alt={`Proof ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                            <div className="p-2 text-center">
                              <a
                                href={imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-600 hover:text-indigo-800"
                              >
                                View Full Size
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <PhotoIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No proof images uploaded</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Response Details */}
              {selectedProof.status !== 'pending' && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Customer Response</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedProof.responded_at ? (
                      <div>
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-500">Responded: </span>
                          <span className="text-sm text-gray-900">
                            {new Date(selectedProof.responded_at).toLocaleString()}
                          </span>
                        </div>
                        {selectedProof.response_notes && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">Notes: </span>
                            <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded">
                              {selectedProof.response_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No response yet</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex justify-between mt-6">
                <div>
                  {selectedProof.status === 'pending' && (
                    <Button
                      onClick={() => handleResendEmail(selectedProof.id)}
                      variant="secondary"
                    >
                      Resend Approval Email
                    </Button>
                  )}
                </div>
                <Button onClick={() => setShowProofModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};