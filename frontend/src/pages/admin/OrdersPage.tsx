import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
  EyeIcon,
  UserPlusIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  TruckIcon,
  ScissorsIcon
} from '@heroicons/react/24/outline';
import { orderService } from '../../services/orderService';
import { adminService } from '../../services/adminService';
import { trackingService } from '../../services/trackingService';
import { orderSplittingService } from '../../services/orderSplittingService';
import toast from 'react-hot-toast';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  store_name: string;
  store_type: string;
  total_amount: number;
  currency: string;
  order_status: string;
  fulfillment_status: string;
  payment_status?: string;
  order_date: string;
  notes?: string;
  billing_address?: any;
  shipping_address?: any;
  items?: any[];
  vendor_assignments?: any[];
}

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [trackingData, setTrackingData] = useState({
    tracking_number: '',
    carrier: '',
    notes: ''
  });

  // Advanced Filters - Default to processing orders only
  const [filters, setFilters] = useState({
    search: '',
    status: 'processing',
    store_id: '',
    date_from: '',
    date_to: '',
    amount_min: '',
    amount_max: '',
    multiple_statuses: ['processing']
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 1
  });

  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    loadOrders();
    loadVendors();
  }, [pagination.page, filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value)
        )
      };

      const response = await orderService.getOrders(params);

      if (response.success) {
        setOrders(response.data.orders);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }));
      }
    } catch (error: any) {
      toast.error('Failed to load orders');
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVendors = async () => {
    try {
      const response = await adminService.getActiveVendors();
      if (response.success) {
        setVendors(response.data);
      }
    } catch (error) {
      console.error('Failed to load vendors:', error);
    }
  };

  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const setDatePreset = (preset: string) => {
    const today = new Date();
    let startDate = '';

    switch (preset) {
      case 'today':
        startDate = today.toISOString().split('T')[0];
        setFilters(prev => ({ ...prev, date_from: startDate, date_to: startDate }));
        break;
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString().split('T')[0];
        setFilters(prev => ({ ...prev, date_from: startDate, date_to: today.toISOString().split('T')[0] }));
        break;
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString().split('T')[0];
        setFilters(prev => ({ ...prev, date_from: startDate, date_to: today.toISOString().split('T')[0] }));
        break;
      case 'all':
        setFilters(prev => ({ ...prev, date_from: '', date_to: '' }));
        break;
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSyncStore = async (storeId?: number) => {
    setSyncLoading(true);
    try {
      const response = await orderService.syncStoreOrders(storeId || 0);
      if (response.success) {
        toast.success('Store sync initiated successfully');
        loadOrders();
      } else {
        toast.error(response.message || 'Sync failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Sync failed');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleAssignVendor = async (orderId: number, vendorId: number) => {
    try {
      const response = await orderService.assignVendorToOrder(orderId, vendorId);
      if (response.success) {
        toast.success('Vendor assigned successfully');
        loadOrders();
      } else {
        toast.error(response.message || 'Assignment failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Assignment failed');
    }
  };

  const handleViewOrder = async (order: Order) => {
    try {
      // Load full order details including items and assignments
      const response = await orderService.getOrder(order.id);
      if (response.success) {
        setSelectedOrder(response.data);
        setShowOrderDetails(true);
      }
    } catch (error: any) {
      console.error('Failed to load order details:', error);
      setSelectedOrder(order);
      setShowOrderDetails(true);
    }
  };

  const handleAddTracking = async () => {
    if (!selectedOrder?.vendor_assignments?.[0]) {
      toast.error('Order must be assigned to a vendor first');
      return;
    }

    try {
      const response = await trackingService.addTracking({
        order_id: selectedOrder.id,
        vendor_assignment_id: selectedOrder.vendor_assignments[0].id,
        tracking_number: trackingData.tracking_number,
        carrier: trackingData.carrier,
        notes: trackingData.notes
      });

      if (response.success) {
        toast.success('Tracking number added successfully and synced to platform');
        setShowTrackingModal(false);
        setTrackingData({ tracking_number: '', carrier: '', notes: '' });
        // Refresh order details to show tracking info
        handleViewOrder(selectedOrder);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add tracking');
    }
  };

  const handleSplitOrder = () => {
    setShowSplitModal(true);
  };

  const handleSelectOrder = (orderId: number, checked: boolean) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(orders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleBulkOperation = async () => {
    if (selectedOrders.length === 0) {
      toast.error('Please select orders to perform bulk action');
      return;
    }

    try {
      let response;
      switch (bulkAction) {
        case 'assign_vendor':
          // Bulk vendor assignment would need additional UI for vendor selection
          toast.success('Bulk vendor assignment - Select vendor in next step');
          break;
        case 'update_status':
          // Bulk status update would need status selection
          toast.success('Bulk status update - Select status in next step');
          break;
        case 'export':
          // Export selected orders
          const exportData = orders.filter(order => selectedOrders.includes(order.id));
          const csv = exportToCsv(exportData);
          downloadCsv(csv, 'selected-orders.csv');
          toast.success(`Exported ${selectedOrders.length} orders`);
          break;
      }
      setShowBulkModal(false);
      setSelectedOrders([]);
    } catch (error: any) {
      toast.error('Bulk operation failed');
    }
  };

  const exportToCsv = (data: Order[]) => {
    const headers = ['Order #', 'Customer', 'Store', 'Amount', 'Status', 'Date'];
    const rows = data.map(order => [
      order.order_number,
      order.customer_name,
      order.store_name,
      `${order.total_amount} ${order.currency}`,
      order.order_status,
      formatDate(order.order_date)
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCsv = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      assigned: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-orange-100 text-orange-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const columns = [
    {
      key: 'select',
      label: 'Select',
      render: (value: any, row: Order) => (
        <input
          type="checkbox"
          checked={selectedOrders.includes(row.id)}
          onChange={(e) => handleSelectOrder(row.id, e.target.checked)}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
      )
    },
    {
      key: 'order_number',
      label: 'Order #',
      render: (value: string, row: Order) => (
        <div className="font-medium text-gray-900">#{row.order_number}</div>
      )
    },
    {
      key: 'customer_name',
      label: 'Customer',
      render: (value: string, row: Order) => (
        <div>
          <div className="font-medium text-gray-900">{row.customer_name}</div>
          <div className="text-sm text-gray-500">{row.customer_email}</div>
        </div>
      )
    },
    {
      key: 'store_name',
      label: 'Store',
      render: (value: string, row: Order) => (
        <div>
          <div className="font-medium">{row.store_name}</div>
          <div className="text-sm text-gray-500 capitalize">{row.store_type}</div>
        </div>
      )
    },
    {
      key: 'total_amount',
      label: 'Amount',
      render: (value: number, row: Order) => (
        <div className="font-medium text-gray-900">
          {formatCurrency(row.total_amount, row.currency)}
        </div>
      )
    },
    {
      key: 'order_status',
      label: 'Status',
      render: (value: string, row: Order) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(row.order_status)}`}>
          {row.order_status.replace('_', ' ').toUpperCase()}
        </span>
      )
    },
    {
      key: 'vendor_assignments',
      label: 'Assignment',
      render: (value: any[], row: Order) => {
        const assignment = row.vendor_assignments?.[0];
        if (assignment) {
          return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(assignment.status)}`}>
              {assignment.status.replace('_', ' ')}
            </span>
          );
        }
        return <span className="text-gray-500 text-sm">Unassigned</span>;
      }
    },
    {
      key: 'order_date',
      label: 'Date',
      render: (value: string, row: Order) => (
        <div className="text-sm text-gray-900">{formatDate(row.order_date)}</div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: Order) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewOrder(row)}
            className="p-1"
          >
            <EyeIcon className="h-4 w-4" />
          </Button>

          <Menu as="div" className="relative">
            <Menu.Button as={Button} variant="ghost" size="sm" className="p-1">
              <UserPlusIcon className="h-4 w-4" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-1 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                {vendors.map((vendor) => (
                  <Menu.Item key={vendor.id}>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } block w-full px-4 py-2 text-left text-sm text-gray-700`}
                        onClick={() => handleAssignVendor(row.id, vendor.id)}
                      >
                        {vendor.business_name || vendor.contact_name}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Transition>
          </Menu>

          <Button
            variant="ghost"
            size="sm"
            className="p-1"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <Layout title="Orders Management">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
            <p className="text-gray-600">Manage orders from all connected stores</p>
          </div>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
            {selectedOrders.length > 0 ? (
              <>
                <span className="text-sm text-gray-600">
                  {selectedOrders.length} orders selected
                </span>
                <Button
                  variant="outline"
                  onClick={() => {
                    setBulkAction('export');
                    handleBulkOperation();
                  }}
                  className="flex items-center"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Export Selected
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowBulkModal(true)}
                  className="flex items-center"
                >
                  Bulk Actions
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedOrders([])}
                  className="text-gray-500"
                >
                  Clear Selection
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleSyncStore()}
                  loading={syncLoading}
                  className="flex items-center"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Sync All Stores
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const csv = exportToCsv(orders);
                    downloadCsv(csv, 'all-orders.csv');
                    toast.success('All orders exported');
                  }}
                  className="flex items-center"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Export All
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Order Filters</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Order #, customer..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full text-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range Presets</label>
                <div className="flex space-x-1">
                  <Button size="sm" variant="outline" onClick={() => setDatePreset('today')}>Today</Button>
                  <Button size="sm" variant="outline" onClick={() => setDatePreset('week')}>Week</Button>
                  <Button size="sm" variant="outline" onClick={() => setDatePreset('month')}>Month</Button>
                  <Button size="sm" variant="outline" onClick={() => setDatePreset('all')}>All</Button>
                </div>
              </div>

              <div className="text-right">
                <label className="block text-sm font-medium text-gray-700 mb-1">Results</label>
                <p className="text-sm text-gray-600 mt-2">
                  {pagination.total} orders found
                </p>
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <input
                      type="date"
                      value={filters.date_from}
                      onChange={(e) => handleFilterChange('date_from', e.target.value)}
                      className="w-full py-2 px-3 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                      type="date"
                      value={filters.date_to}
                      onChange={(e) => handleFilterChange('date_to', e.target.value)}
                      className="w-full py-2 px-3 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount ($)</label>
                    <input
                      type="number"
                      value={filters.amount_min}
                      onChange={(e) => handleFilterChange('amount_min', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full py-2 px-3 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount ($)</label>
                    <input
                      type="number"
                      value={filters.amount_max}
                      onChange={(e) => handleFilterChange('amount_max', e.target.value)}
                      placeholder="999999.99"
                      step="0.01"
                      className="w-full py-2 px-3 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Multiple Status Selection</label>
                  <div className="flex flex-wrap gap-2">
                    {['pending', 'processing', 'completed', 'cancelled', 'assigned', 'in_progress'].map((status) => (
                      <label key={status} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.multiple_statuses.includes(status)}
                          onChange={(e) => {
                            const newStatuses = e.target.checked
                              ? [...filters.multiple_statuses, status]
                              : filters.multiple_statuses.filter(s => s !== status);
                            handleFilterChange('multiple_statuses', newStatuses);
                          }}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">{status.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FunnelIcon className="h-5 w-5 mr-2" />
              Orders ({pagination.total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={orders}
              loading={loading}
              pagination={{
                page: pagination.page,
                pages: pagination.pages,
                total: pagination.total,
                onPageChange: (page: number) =>
                  setPagination(prev => ({ ...prev, page }))
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-4">
                  <h2 className="text-2xl font-bold">Order #{selectedOrder.order_number}</h2>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeColor(selectedOrder.order_status)}`}>
                    {selectedOrder.order_status.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="font-medium">{selectedOrder.customer_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="font-medium">{selectedOrder.customer_email}</p>
                    </div>
                    {selectedOrder.customer_phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="font-medium">{selectedOrder.customer_phone}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Order Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Store</label>
                      <p className="font-medium">{selectedOrder.store_name} ({selectedOrder.store_type})</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Amount</label>
                      <p className="font-medium text-lg">{formatCurrency(selectedOrder.total_amount, selectedOrder.currency)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Order Date</label>
                      <p className="font-medium">{formatDate(selectedOrder.order_date)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Payment Status</label>
                      <p className="font-medium">{selectedOrder.payment_status || 'N/A'}</p>
                    </div>
                    {selectedOrder.notes && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Notes</label>
                        <p className="font-medium">{selectedOrder.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Assignment Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Assignment Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedOrder.vendor_assignments && selectedOrder.vendor_assignments.length > 0 ? (
                      selectedOrder.vendor_assignments.map((assignment, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <p className="font-medium">{assignment.vendor_name}</p>
                          <p className="text-sm text-gray-500">Status: {assignment.status}</p>
                          <p className="text-sm text-gray-500">Assigned: {formatDate(assignment.assigned_at)}</p>
                          {assignment.commission_amount && (
                            <p className="text-sm text-green-600">Commission: {formatCurrency(assignment.commission_amount)}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No vendor assigned</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Order Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Order Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-900">Product</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-900">SKU</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-900">Quantity</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-900">Unit Price</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-900">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedOrder.items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-medium">{item.product_name}</p>
                                  {item.variant_title && (
                                    <p className="text-gray-500 text-xs">{item.variant_title}</p>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-600">{item.sku || 'N/A'}</td>
                              <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                              <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.unit_price)}</td>
                              <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total_price)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={4} className="px-4 py-3 text-right font-semibold">Order Total:</td>
                            <td className="px-4 py-3 text-right font-bold text-lg">{formatCurrency(selectedOrder.total_amount, selectedOrder.currency)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Shipping Addresses */}
              {(selectedOrder.billing_address || selectedOrder.shipping_address) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {selectedOrder.shipping_address && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Shipping Address</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm space-y-1">
                          <p className="font-medium">{selectedOrder.shipping_address.first_name} {selectedOrder.shipping_address.last_name}</p>
                          <p>{selectedOrder.shipping_address.address1}</p>
                          {selectedOrder.shipping_address.address2 && <p>{selectedOrder.shipping_address.address2}</p>}
                          <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.province} {selectedOrder.shipping_address.zip}</p>
                          <p>{selectedOrder.shipping_address.country}</p>
                          {selectedOrder.shipping_address.phone && <p>Phone: {selectedOrder.shipping_address.phone}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedOrder.billing_address && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Billing Address</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm space-y-1">
                          <p className="font-medium">{selectedOrder.billing_address.first_name} {selectedOrder.billing_address.last_name}</p>
                          <p>{selectedOrder.billing_address.address1}</p>
                          {selectedOrder.billing_address.address2 && <p>{selectedOrder.billing_address.address2}</p>}
                          <p>{selectedOrder.billing_address.city}, {selectedOrder.billing_address.province} {selectedOrder.billing_address.zip}</p>
                          <p>{selectedOrder.billing_address.country}</p>
                          {selectedOrder.billing_address.phone && <p>Phone: {selectedOrder.billing_address.phone}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => setShowTrackingModal(true)}
                  disabled={!selectedOrder.vendor_assignments || selectedOrder.vendor_assignments.length === 0}
                >
                  <TruckIcon className="h-4 w-4 mr-2" />
                  Add Tracking
                </Button>
                <Button
                  onClick={handleSplitOrder}
                  variant="outline"
                >
                  <ScissorsIcon className="h-4 w-4 mr-2" />
                  Split Order
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Tracking Modal */}
      {showTrackingModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Add Tracking Number</h3>
              <p className="text-sm text-gray-600 mb-4">
                Tracking number will be synced to {selectedOrder.store_name} ({selectedOrder.store_type})
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                  <input
                    type="text"
                    value={trackingData.tracking_number}
                    onChange={(e) => setTrackingData(prev => ({ ...prev, tracking_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter tracking number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Carrier</label>
                  <select
                    value={trackingData.carrier}
                    onChange={(e) => setTrackingData(prev => ({ ...prev, carrier: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Carrier</option>
                    <option value="UPS">UPS</option>
                    <option value="FedEx">FedEx</option>
                    <option value="USPS">USPS</option>
                    <option value="DHL">DHL</option>
                    <option value="China Post">China Post</option>
                    <option value="SF Express">SF Express</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea
                    value={trackingData.notes}
                    onChange={(e) => setTrackingData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    placeholder="Additional tracking notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTrackingModal(false);
                    setTrackingData({ tracking_number: '', carrier: '', notes: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddTracking}
                  disabled={!trackingData.tracking_number || !trackingData.carrier}
                >
                  Add Tracking & Sync
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Splitting Modal */}
      {showSplitModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Split Order #{selectedOrder.order_number}</h3>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-900 mb-2">How Order Splitting Works:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Assign different items to different vendors</li>
                  <li>• Each vendor gets a separate assignment with commission</li>
                  <li>• Vendors can work on their assigned items independently</li>
                  <li>• Tracking can be added per vendor assignment</li>
                </ul>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left">Product</th>
                        <th className="px-4 py-3 text-center">Available Qty</th>
                        <th className="px-4 py-3 text-right">Unit Price</th>
                        <th className="px-4 py-3 text-right">Item Total</th>
                        <th className="px-4 py-3 text-center">Assign To Vendor</th>
                        <th className="px-4 py-3 text-center">Qty to Assign</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{item.product_name}</p>
                              <p className="text-gray-500 text-xs">{item.sku}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.unit_price)}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total_price)}</td>
                          <td className="px-4 py-3">
                            <select className="w-full px-2 py-1 border border-gray-300 rounded text-xs">
                              <option value="">Select Vendor</option>
                              {vendors.map((vendor) => (
                                <option key={vendor.id} value={vendor.id}>
                                  {vendor.business_name || vendor.contact_name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="1"
                              max={item.quantity}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-center"
                              placeholder={item.quantity.toString()}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="outline" onClick={() => setShowSplitModal(false)}>
                  Cancel
                </Button>
                <Button>
                  Create Split Assignments
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default OrdersPage;