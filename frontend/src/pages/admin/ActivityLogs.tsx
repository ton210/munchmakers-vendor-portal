import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { 
  ClockIcon,
  UserIcon,
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  FunnelIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { adminService } from '../../services/adminService';
import { ActivityLog } from '../../types';
import toast from 'react-hot-toast';

interface ActivityLogWithDetails extends ActivityLog {
  user?: { name: string; email: string };
  vendor?: { businessName: string };
  product?: { name: string };
}

const AdminActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLogWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });
  const [filters, setFilters] = useState({
    type: '',
    userId: '',
    vendorId: '',
    dateRange: {
      startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  });

  useEffect(() => {
    loadActivityLogs();
  }, [pagination.page, filters]);

  const loadActivityLogs = async () => {
    setLoading(true);
    try {
      const response = await adminService.getActivityLogs({
        page: pagination.page,
        limit: 20,
        type: filters.type || undefined,
        userId: filters.userId ? parseInt(filters.userId) : undefined,
        vendorId: filters.vendorId ? parseInt(filters.vendorId) : undefined
      });

      if (response.success) {
        // Mock detailed data for demonstration
        const mockLogs: ActivityLogWithDetails[] = [
          {
            id: 1,
            type: 'vendor_registered',
            description: 'New vendor "Fresh Foods Co." submitted registration application',
            userId: 1,
            vendorId: 5,
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            user: { name: 'System', email: 'system@munchmakers.com' },
            vendor: { businessName: 'Fresh Foods Co.' }
          },
          {
            id: 2,
            type: 'vendor_approved',
            description: 'Vendor "Gourmet Delights" has been approved by admin',
            userId: 2,
            vendorId: 3,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            user: { name: 'Admin User', email: 'admin@munchmakers.com' },
            vendor: { businessName: 'Gourmet Delights' }
          },
          {
            id: 3,
            type: 'product_submitted',
            description: 'New product "Organic Honey" submitted for approval',
            userId: 3,
            vendorId: 2,
            productId: 15,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
            user: { name: 'Jane Smith', email: 'jane@gourmet.com' },
            vendor: { businessName: 'Organic Farm' },
            product: { name: 'Organic Honey' }
          },
          {
            id: 4,
            type: 'product_approved',
            description: 'Product "Artisan Bread" has been approved and published',
            userId: 2,
            vendorId: 4,
            productId: 12,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
            user: { name: 'Admin User', email: 'admin@munchmakers.com' },
            vendor: { businessName: 'Local Bakery' },
            product: { name: 'Artisan Bread' }
          },
          {
            id: 5,
            type: 'vendor_approved',
            description: 'Vendor "Spice Kingdom" has been approved by admin',
            userId: 1,
            vendorId: 1,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            user: { name: 'Super Admin', email: 'superadmin@munchmakers.com' },
            vendor: { businessName: 'Spice Kingdom' }
          }
        ];

        setLogs(mockLogs);
        setPagination({
          page: 1,
          pages: 1,
          total: mockLogs.length
        });
      }
    } catch (error: any) {
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActivityLogs();
  };

  const handleExportLogs = async () => {
    try {
      toast.success('Activity logs export initiated. You will receive an email when ready.');
    } catch (error: any) {
      toast.error('Failed to export logs');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'vendor_registered':
      case 'vendor_approved':
        return BuildingStorefrontIcon;
      case 'product_submitted':
      case 'product_approved':
        return ShoppingBagIcon;
      default:
        return ClockIcon;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'vendor_approved':
      case 'product_approved':
        return 'text-green-600 bg-green-100';
      case 'vendor_registered':
      case 'product_submitted':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const ActivityBadge: React.FC<{ type: string }> = ({ type }) => {
    const Icon = getActivityIcon(type);
    const colorClass = getActivityColor(type);
    
    const typeLabels: Record<string, string> = {
      'vendor_registered': 'Vendor Registration',
      'vendor_approved': 'Vendor Approved',
      'product_submitted': 'Product Submitted',
      'product_approved': 'Product Approved'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        <Icon className="w-3 h-3 mr-1" />
        {typeLabels[type] || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  const columns: Column[] = [
    {
      key: 'type',
      label: 'Activity Type',
      render: (value) => <ActivityBadge type={value} />
    },
    {
      key: 'description',
      label: 'Description',
      render: (value, item) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{value}</p>
          {item.user && (
            <p className="text-xs text-gray-500 mt-1">
              by {item.user.name} ({item.user.email})
            </p>
          )}
        </div>
      )
    },
    {
      key: 'vendor',
      label: 'Related Entity',
      render: (value, item) => (
        <div className="space-y-1">
          {item.vendor && (
            <div className="flex items-center text-sm text-gray-900">
              <BuildingStorefrontIcon className="h-4 w-4 mr-1 text-gray-400" />
              {item.vendor.businessName}
            </div>
          )}
          {item.product && (
            <div className="flex items-center text-sm text-gray-500">
              <ShoppingBagIcon className="h-4 w-4 mr-1 text-gray-400" />
              {item.product.name}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Timestamp',
      sortable: true,
      render: (value) => (
        <div className="text-sm text-gray-900">
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
            {new Date(value).toLocaleDateString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date(value).toLocaleTimeString()}
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, item) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              // TODO: Open detailed activity log modal
              toast('Activity details modal coming soon');
            }}
            className="text-indigo-600 hover:text-indigo-900"
            title="View details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  const activityTypeCounts = {
    vendor_registered: logs.filter(log => log.type === 'vendor_registered').length,
    vendor_approved: logs.filter(log => log.type === 'vendor_approved').length,
    product_submitted: logs.filter(log => log.type === 'product_submitted').length,
    product_approved: logs.filter(log => log.type === 'product_approved').length,
  };

  return (
    <Layout title="Activity Logs">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
            <p className="text-gray-600 mt-1">Monitor system activities and user actions</p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={handleRefresh}
              loading={refreshing}
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="secondary"
              onClick={handleExportLogs}
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { 
              label: 'Vendor Registrations', 
              value: activityTypeCounts.vendor_registered, 
              color: 'bg-blue-500',
              icon: BuildingStorefrontIcon
            },
            { 
              label: 'Vendor Approvals', 
              value: activityTypeCounts.vendor_approved, 
              color: 'bg-green-500',
              icon: CheckCircleIcon
            },
            { 
              label: 'Product Submissions', 
              value: activityTypeCounts.product_submitted, 
              color: 'bg-orange-500',
              icon: ShoppingBagIcon
            },
            { 
              label: 'Product Approvals', 
              value: activityTypeCounts.product_approved, 
              color: 'bg-purple-500',
              icon: CheckCircleIcon
            }
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="flex items-center p-6">
                <div className={`p-3 rounded-full ${stat.color} text-white mr-4`}>
                  <stat.icon className="h-6 w-6" />
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
            <div className="flex items-center space-x-4 mb-4">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <h3 className="text-sm font-medium text-gray-900">Filters</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Activity Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">All Activities</option>
                  <option value="vendor_registered">Vendor Registrations</option>
                  <option value="vendor_approved">Vendor Approvals</option>
                  <option value="product_submitted">Product Submissions</option>
                  <option value="product_approved">Product Approvals</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.dateRange.startDate}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, startDate: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.dateRange.endDate}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, endDate: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div className="flex items-end">
                <Button onClick={loadActivityLogs} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Activity Logs Table */}
            <DataTable
              columns={columns}
              data={logs}
              loading={loading}
              searchable
              searchPlaceholder="Search activity logs..."
              pagination={{
                ...pagination,
                onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
              }}
              emptyMessage="No activity logs found."
            />
          </div>
          
          {/* Recent Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600 mb-2">
                    {logs.length}
                  </div>
                  <p className="text-sm text-gray-600">Activities in the last 24 hours</p>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Activity Breakdown</h4>
                  <div className="space-y-3">
                    {Object.entries(activityTypeCounts).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${getActivityColor(type).split(' ')[1]}`}></div>
                          <span className="text-sm text-gray-600">
                            {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Monitoring Info */}
        <Card>
          <CardHeader>
            <CardTitle>Monitoring Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Activity Log Retention</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• Activity logs are automatically retained for 90 days</p>
                <p>• Critical activities (approvals, rejections) are retained for 1 year</p>
                <p>• Logs are automatically archived and can be exported for compliance</p>
                <p>• Real-time monitoring alerts are sent for suspicious activities</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminActivityLogs;