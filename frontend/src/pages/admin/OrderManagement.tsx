import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { DataTable, Column } from '../../components/ui/DataTable';
import {
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  EyeIcon,
  UserPlusIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  BuildingStorefrontIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { orderService } from '../../services/orderService';
import { storeService } from '../../services/storeService';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';

interface Store {
  id: number;
  name: string;
  type: 'shopify' | 'bigcommerce' | 'woocommerce';
  store_url: string;
  is_active: boolean;
  sync_enabled: boolean;
  last_sync_at?: string;
}

interface Vendor {
  id: number;
  company_name: string;
  commission_rate: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  order_status: string;
  total_amount: number;
  currency: string;
  order_date: string;
  store_name: string;
  store_type: string;
  vendor_assignments: any[];
}

export const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingStore, setSyncingStore] = useState<number | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAssignVendor, setShowAssignVendor] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<number | null>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 50
  });

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    store_id: '',
    vendor_id: '',
    date_from: '',
    date_to: ''
  });

  const [stats, setStats] = useState({
    total_orders: 0,
    total_revenue: 0,
    pending_orders: 0,
    processing_orders: 0,
    fulfilled_orders: 0,
    unassigned_orders: 0
  });

  useEffect(() => {
    loadOrders();
    loadStores();
    loadVendors();
    loadStats();
  }, [pagination.page, filters]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await orderService.getOrders({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      if (response.success) {
        setOrders(response.data.items || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 1
        }));
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      const response = await storeService.getStores();
      if (response.success) {
        setStores(response.data.stores || []);
      }
    } catch (error) {
      console.error('Failed to load stores:', error);
    }
  };

  const loadVendors = async () => {
    try {
      const response = await adminService.getActiveVendors();
      if (response.success) {
        setVendors(response.data.vendors || []);
      }
    } catch (error) {
      console.error('Failed to load vendors:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await orderService.getOrderStats();
      if (response.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSyncStore = async (storeId: number) => {
    setSyncingStore(storeId);
    try {
      const response = await orderService.syncStoreOrders(storeId);
      if (response.success) {
        toast.success(response.message);
        loadOrders();
        loadStats();
      } else {
        toast.error(response.message || 'Failed to sync store');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to sync store');
    } finally {
      setSyncingStore(null);
    }
  };

  const handleAssignVendor = async () => {
    if (!selectedOrder || !selectedVendor) return;

    try {
      const response = await orderService.assignVendorToOrder(selectedOrder.id, selectedVendor);
      if (response.success) {
        toast.success('Vendor assigned successfully');
        setShowAssignVendor(false);
        setSelectedOrder(null);
        setSelectedVendor(null);
        loadOrders();
      } else {
        toast.error(response.message || 'Failed to assign vendor');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign vendor');
    }
  };

  const getStatusColor = (status: string): string => {
    const statusColors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'fulfilled': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );

  const columns: Column[] = [
    {
      key: 'order_number',
      label: 'Order #',
      sortable: true,
      render: (value, item) => (
        <div>
          <div className="font-medium text-gray-900">#{value}</div>
          <div className="text-sm text-gray-500 capitalize">
            {item.store_name} ({item.store_type})
          </div>
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
      key: 'total_amount',
      label: 'Total',
      sortable: true,
      render: (value, item) => (
        <div className="font-medium text-gray-900">
          {item.currency} ${parseFloat(value).toFixed(2)}
        </div>
      )
    },
    {
      key: 'order_status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'vendor_assignments',
      label: 'Vendor',
      render: (assignments) => {
        if (!assignments || assignments.length === 0) {
          return <span className="text-red-500">Unassigned</span>;
        }
        return (
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {assignments[0].vendor_name || 'Assigned'}
            </div>
            <div className="text-gray-500">
              Status: {assignments[0].status}
            </div>
          </div>
        );
      }
    },
    {
      key: 'order_date',
      label: 'Date',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, item) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedOrder(item);
              setShowAssignVendor(true);
            }}
            className="text-indigo-600 hover:text-indigo-900"
            title="Assign vendor"
            disabled={item.vendor_assignments?.length > 0}
          >
            <UserPlusIcon className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <Layout title="Order Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600 mt-1">Manage orders from all connected stores</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadOrders} variant="secondary" disabled={loading}>
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Orders', value: stats.total_orders, color: 'bg-blue-500' },
            { label: 'Total Revenue', value: `$${stats.total_revenue.toFixed(2)}`, color: 'bg-green-500' },
            { label: 'Pending Orders', value: stats.pending_orders, color: 'bg-yellow-500' },
            { label: 'Unassigned', value: stats.unassigned_orders, color: 'bg-red-500' }
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="flex items-center p-6">
                <div className={`p-3 rounded-full ${stat.color} text-white mr-4`}>
                  <BuildingStorefrontIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Store Sync Section */}
        <Card>
          <CardHeader>
            <CardTitle>Store Synchronization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stores.map((store) => (
                <div key={store.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{store.name}</h4>
                      <p className="text-sm text-gray-500 capitalize">{store.type}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${store.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {store.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {store.last_sync_at && (
                    <p className="text-xs text-gray-500 mb-3">
                      Last sync: {new Date(store.last_sync_at).toLocaleString()}
                    </p>
                  )}

                  <Button
                    onClick={() => handleSyncStore(store.id)}
                    size="sm"
                    variant="secondary"
                    disabled={syncingStore === store.id || !store.sync_enabled}
                    className="w-full"
                  >
                    {syncingStore === store.id ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-2" />
                        Sync Orders
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Order #, customer..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
                <select
                  value={filters.store_id}
                  onChange={(e) => setFilters(prev => ({ ...prev, store_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">All Stores</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <select
                  value={filters.vendor_id}
                  onChange={(e) => setFilters(prev => ({ ...prev, vendor_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">All Vendors</option>
                  <option value="unassigned">Unassigned</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <DataTable
          columns={columns}
          data={orders}
          loading={loading}
          pagination={{
            ...pagination,
            onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
          }}
          emptyMessage="No orders found. Sync stores to import orders."
        />

        {/* Assign Vendor Modal */}
        {showAssignVendor && selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Assign Vendor to Order #{selectedOrder.order_number}
                </h3>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Vendor
                </label>
                <select
                  value={selectedVendor || ''}
                  onChange={(e) => setSelectedVendor(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Choose a vendor...</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.company_name} ({vendor.commission_rate}% commission)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => {
                    setShowAssignVendor(false);
                    setSelectedOrder(null);
                    setSelectedVendor(null);
                  }}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignVendor}
                  disabled={!selectedVendor}
                >
                  Assign Vendor
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};