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
  PencilIcon,
  CalendarIcon,
  UserIcon,
  ShoppingBagIcon,
  FunnelIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { orderService } from '../../services/orderService';
import toast from 'react-hot-toast';

interface OrderItem {
  id: number;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  variant_title?: string;
}

interface VendorAssignment {
  id: number;
  vendor_id: number;
  status: 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  assignment_type: 'full' | 'partial';
  commission_amount: number;
  assigned_at: string;
  accepted_at?: string;
  completed_at?: string;
}

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  order_status: 'pending' | 'processing' | 'fulfilled' | 'cancelled';
  fulfillment_status?: string;
  payment_status?: string;
  total_amount: number;
  currency: string;
  order_date: string;
  store_name: string;
  store_type: 'shopify' | 'bigcommerce' | 'woocommerce';
  items: OrderItem[];
  vendor_assignments: VendorAssignment[];
  billing_address?: any;
  shipping_address?: any;
  notes?: string;
  tags?: string;
}

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 50
  });

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    store_type: '',
    date_from: '',
    date_to: ''
  });

  const [stats, setStats] = useState({
    total_orders: 0,
    total_revenue: 0,
    pending_orders: 0,
    processing_orders: 0,
    fulfilled_orders: 0,
    average_order_value: 0
  });

  useEffect(() => {
    loadOrders();
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
      } else {
        toast.error(response.message || 'Failed to load orders');
        setOrders([]);
      }
    } catch (error: any) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await orderService.getOrderStats();
      if (response.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to load order stats:', error);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string, notes?: string) => {
    try {
      const response = await orderService.updateOrderStatus(orderId, newStatus, notes);
      if (response.success) {
        toast.success('Order status updated successfully');
        loadOrders();
      } else {
        toast.error(response.message || 'Failed to update order status');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleUpdateAssignmentStatus = async (assignmentId: number, newStatus: string) => {
    try {
      const response = await orderService.updateAssignmentStatus(assignmentId, newStatus);
      if (response.success) {
        toast.success('Assignment status updated successfully');
        loadOrders();
        if (selectedOrder) {
          const updatedOrder = await orderService.getOrder(selectedOrder.id);
          if (updatedOrder.success) {
            setSelectedOrder(updatedOrder.data.order);
          }
        }
      } else {
        toast.error(response.message || 'Failed to update assignment status');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update assignment status');
    }
  };

  const getStatusColor = (status: string): string => {
    const statusColors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'fulfilled': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'assigned': 'bg-gray-100 text-gray-800',
      'accepted': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-primary-100 text-primary-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const statusIcons: { [key: string]: any } = {
      'pending': ClockIcon,
      'processing': TruckIcon,
      'fulfilled': CheckCircleIcon,
      'cancelled': ExclamationTriangleIcon,
      'assigned': ClockIcon,
      'accepted': CheckCircleIcon,
      'in_progress': TruckIcon,
      'completed': CheckCircleIcon
    };
    const IconComponent = statusIcons[status] || ClockIcon;
    return <IconComponent className="w-4 h-4" />;
  };

  const StatusBadge: React.FC<{ status: string; type?: 'order' | 'assignment' }> = ({ status, type = 'order' }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {getStatusIcon(status)}
      <span className="ml-1">{status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}</span>
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
          <div className="text-sm text-gray-500 capitalize">{item.store_type}</div>
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
      render: (value) => <StatusBadge status={value} type="order" />
    },
    {
      key: 'vendor_assignments',
      label: 'Assignment',
      render: (assignments: VendorAssignment[]) => {
        if (!assignments || assignments.length === 0) {
          return <span className="text-gray-400">Unassigned</span>;
        }

        const assignment = assignments[0]; // Show first assignment
        return (
          <div>
            <StatusBadge status={assignment.status} type="assignment" />
            {assignments.length > 1 && (
              <div className="text-xs text-gray-500 mt-1">
                +{assignments.length - 1} more
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'order_date',
      label: 'Date',
      sortable: true,
      render: (value) => (
        <div className="text-sm text-gray-900">
          {new Date(value).toLocaleDateString()}
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
              setSelectedOrder(item);
              setShowOrderDetails(true);
            }}
            className="text-primary-600 hover:text-primary-900"
            title="View details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>

          {item.vendor_assignments?.length > 0 && (
            <button
              onClick={() => {
                const assignment = item.vendor_assignments[0];
                if (assignment.status === 'assigned') {
                  handleUpdateAssignmentStatus(assignment.id, 'accepted');
                } else if (assignment.status === 'accepted') {
                  handleUpdateAssignmentStatus(assignment.id, 'in_progress');
                } else if (assignment.status === 'in_progress') {
                  handleUpdateAssignmentStatus(assignment.id, 'completed');
                }
              }}
              className="text-green-600 hover:text-green-900"
              title="Update assignment status"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          )}
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
          <Button
            onClick={loadOrders}
            variant="secondary"
            disabled={loading}
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh Orders
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {[
            {
              label: 'Total Orders',
              value: stats.total_orders,
              color: 'bg-blue-500',
              icon: ShoppingBagIcon
            },
            {
              label: 'Total Revenue',
              value: `$${stats.total_revenue.toFixed(2)}`,
              color: 'bg-green-500',
              icon: CurrencyDollarIcon
            },
            {
              label: 'Pending',
              value: stats.pending_orders,
              color: 'bg-yellow-500',
              icon: ClockIcon
            },
            {
              label: 'Processing',
              value: stats.processing_orders,
              color: 'bg-blue-500',
              icon: TruckIcon
            },
            {
              label: 'Fulfilled',
              value: stats.fulfilled_orders,
              color: 'bg-green-500',
              icon: CheckCircleIcon
            },
            {
              label: 'Avg Order',
              value: `$${stats.average_order_value.toFixed(2)}`,
              color: 'bg-purple-500',
              icon: CurrencyDollarIcon
            }
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="flex items-center p-4">
                <div className={`p-2 rounded-full ${stat.color} text-white mr-3`}>
                  <stat.icon className="h-5 w-5" />
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Order #, customer name, email..."
                />
              </div>

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
                  <option value="processing">Processing</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Type
                </label>
                <select
                  value={filters.store_type}
                  onChange={(e) => setFilters(prev => ({ ...prev, store_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">All Stores</option>
                  <option value="shopify">Shopify</option>
                  <option value="bigcommerce">BigCommerce</option>
                  <option value="woocommerce">WooCommerce</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                onClick={() => setFilters({
                  search: '',
                  status: '',
                  store_type: '',
                  date_from: '',
                  date_to: ''
                })}
                variant="secondary"
                size="sm"
              >
                Clear Filters
              </Button>
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
          emptyMessage="No orders found. Orders will appear here when they're assigned to you or synced from stores."
        />

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Order #{selectedOrder.order_number}
                </h3>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Customer</dt>
                        <dd className="text-sm text-gray-900">{selectedOrder.customer_name || 'N/A'}</dd>
                        <dd className="text-sm text-gray-500">{selectedOrder.customer_email}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                        <dd className="text-sm text-gray-900">
                          {selectedOrder.currency} ${selectedOrder.total_amount.toFixed(2)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Order Date</dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(selectedOrder.order_date).toLocaleDateString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Store</dt>
                        <dd className="text-sm text-gray-900 capitalize">
                          {selectedOrder.store_name} ({selectedOrder.store_type})
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                {/* Assignment Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Assignment Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedOrder.vendor_assignments?.length > 0 ? (
                      <div className="space-y-4">
                        {selectedOrder.vendor_assignments.map((assignment) => (
                          <div key={assignment.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <StatusBadge status={assignment.status} type="assignment" />
                              <span className="text-sm text-gray-500">
                                Commission: ${assignment.commission_amount?.toFixed(2)}
                              </span>
                            </div>

                            <div className="space-y-1 text-sm text-gray-600">
                              <div>Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}</div>
                              {assignment.accepted_at && (
                                <div>Accepted: {new Date(assignment.accepted_at).toLocaleDateString()}</div>
                              )}
                              {assignment.completed_at && (
                                <div>Completed: {new Date(assignment.completed_at).toLocaleDateString()}</div>
                              )}
                            </div>

                            {/* Quick Status Update Buttons */}
                            <div className="flex gap-2 mt-3">
                              {assignment.status === 'assigned' && (
                                <Button
                                  onClick={() => handleUpdateAssignmentStatus(assignment.id, 'accepted')}
                                  size="sm"
                                  variant="secondary"
                                >
                                  Accept
                                </Button>
                              )}
                              {assignment.status === 'accepted' && (
                                <Button
                                  onClick={() => handleUpdateAssignmentStatus(assignment.id, 'in_progress')}
                                  size="sm"
                                  variant="secondary"
                                >
                                  Start Work
                                </Button>
                              )}
                              {assignment.status === 'in_progress' && (
                                <Button
                                  onClick={() => handleUpdateAssignmentStatus(assignment.id, 'completed')}
                                  size="sm"
                                >
                                  Mark Complete
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No vendor assigned to this order
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Order Items */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            SKU
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedOrder.items?.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {item.product_name}
                                </div>
                                {item.variant_title && (
                                  <div className="text-sm text-gray-500">
                                    {item.variant_title}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.sku || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${item.unit_price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              ${item.total_price.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              {selectedOrder.shipping_address && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Shipping Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-900">
                      {selectedOrder.shipping_address.first_name} {selectedOrder.shipping_address.last_name}<br />
                      {selectedOrder.shipping_address.address1}<br />
                      {selectedOrder.shipping_address.address2 && (
                        <>{selectedOrder.shipping_address.address2}<br /></>
                      )}
                      {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.province} {selectedOrder.shipping_address.zip}<br />
                      {selectedOrder.shipping_address.country}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end mt-6">
                <Button onClick={() => setShowOrderDetails(false)}>
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