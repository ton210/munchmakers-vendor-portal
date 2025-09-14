import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { DataTable, Column } from '../../components/ui/DataTable';
import { 
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon,
  UserPlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { adminService } from '../../services/adminService';
import { Vendor } from '../../types';
import toast from 'react-hot-toast';

export const VendorsPage: React.FC = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });

  useEffect(() => {
    loadVendors();
  }, [pagination.page, filters]);

  const loadVendors = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading vendors from database...');
      const response = await adminService.getVendors({
        page: pagination.page,
        limit: 10,
        search: filters.search || undefined,
        status: filters.status || undefined
      });

      if (response.success) {
        console.log(`✅ Loaded ${response.data.items?.length || 0} vendors from database`);
        setVendors(response.data.items || []);
        setPagination({
          page: response.data.pagination?.page || 1,
          pages: response.data.pagination?.pages || 1,
          total: response.data.pagination?.total || 0
        });
      } else {
        console.error('❌ Failed to load vendors:', response.message);
        toast.error(response.message || 'Failed to load vendors');
        setVendors([]);
      }
    } catch (error: any) {
      console.error('❌ Vendors API error:', error);
      toast.error('Failed to load vendors');
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVendor = async (vendor: Vendor) => {
    try {
      const response = await adminService.approveVendor(vendor.id);
      if (response.success) {
        toast.success(`${vendor.businessName} approved successfully!`);
        loadVendors();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve vendor');
    }
  };

  const handleRejectVendor = async (vendor: Vendor, reason: string) => {
    try {
      const response = await adminService.rejectVendor(vendor.id, reason);
      if (response.success) {
        toast.success(`${vendor.businessName} rejected`);
        loadVendors();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject vendor');
    }
  };

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircleIcon }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const columns: Column[] = [
    {
      key: 'business_name',
      label: 'Business Name',
      sortable: true,
      render: (value, item) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{item.contact_name}</div>
        </div>
      )
    },
    {
      key: 'contact_email',
      label: 'Contact',
      render: (value, item) => (
        <div>
          <div className="text-sm text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{item.phone}</div>
        </div>
      )
    },
    {
      key: 'business_type',
      label: 'Type',
      render: (value) => (
        <span className="text-sm text-gray-900">{value}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'created_at',
      label: 'Applied',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, item) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {/* TODO: Open vendor details modal */}}
            className="text-primary-600 hover:text-primary-900"
            title="View details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          
          {item.status === 'pending' && (
            <>
              <button
                onClick={() => handleApproveVendor(item)}
                className="text-green-600 hover:text-green-900"
                title="Approve vendor"
              >
                <CheckCircleIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  const reason = window.prompt('Please provide a rejection reason:');
                  if (reason) {
                    handleRejectVendor(item, reason);
                  }
                }}
                className="text-red-600 hover:text-red-900"
                title="Reject vendor"
              >
                <XCircleIcon className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  const pendingCount = vendors?.filter(v => v.status === 'pending').length || 0;
  const approvedCount = vendors?.filter(v => v.status === 'approved').length || 0;
  const rejectedCount = vendors?.filter(v => v.status === 'rejected').length || 0;

  return (
    <Layout title="Vendor Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
            <p className="text-gray-600 mt-1">Review and manage vendor applications</p>
          </div>
          <Button onClick={() => navigate('/register')}>
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Invite Vendor
          </Button>
        </div>

        {/* Alert for pending vendors */}
        {pendingCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  {pendingCount} vendor{pendingCount !== 1 ? 's' : ''} pending approval
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Review vendor applications to approve or reject them.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Vendors', value: pagination.total, color: 'bg-blue-500' },
            { label: 'Pending', value: pendingCount, color: 'bg-yellow-500' },
            { label: 'Approved', value: approvedCount, color: 'bg-green-500' },
            { label: 'Rejected', value: rejectedCount, color: 'bg-red-500' }
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="flex items-center p-6">
                <div className={`p-3 rounded-full ${stat.color} text-white mr-4`}>
                  <div className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div className="md:col-span-2 flex items-end">
                <Button
                  variant="secondary"
                  onClick={loadVendors}
                  className="w-full md:w-auto"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendors Table */}
        <DataTable
          columns={columns}
          data={vendors}
          loading={loading}
          searchable
          searchPlaceholder="Search vendors..."
          onSearch={(query) => setFilters(prev => ({ ...prev, search: query }))}
          pagination={{
            ...pagination,
            onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
          }}
          emptyMessage="No vendors found."
        />
      </div>
    </Layout>
  );
};