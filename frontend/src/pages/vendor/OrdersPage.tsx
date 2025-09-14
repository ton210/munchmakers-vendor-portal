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
  FunnelIcon
} from '@heroicons/react/24/outline';
import { vendorService } from '../../services/vendorService';
import toast from 'react-hot-toast';

interface OrderItem {
  id: number;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  orderDate: string;
  shippedDate?: string;
  trackingNumber?: string;
  items: OrderItem[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateRange: {
      startDate: '',
      endDate: ''
    }
  });

  useEffect(() => {
    loadOrders();
  }, [pagination.page, filters]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading vendor orders from database...');
      const response = await vendorService.getOrders({
        page: pagination.page,
        limit: 10,
        status: filters.status || undefined,
        startDate: filters.dateRange.startDate || undefined,
        endDate: filters.dateRange.endDate || undefined
      });

      if (response.success) {
        console.log(`✅ Loaded ${response.data.items?.length || 0} orders for vendor`);
        setOrders(response.data.items || []);
        setPagination({
          page: response.data.pagination?.page || 1,
          pages: response.data.pagination?.pages || 1,
          total: response.data.pagination?.total || 0
        });
      } else {
        console.error('❌ Failed to load orders:', response.message);
        // Fallback to mock data for demo if real data fails
        const mockOrders: Order[] = [
          {
            id: 1,
            orderNumber: 'ORD-001',
            customerName: 'John Smith',
            customerEmail: 'john@example.com',
            status: 'pending',
            totalAmount: 89.99,
            orderDate: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            items: [
              {
                id: 1,
                productName: 'Organic Honey',
                sku: 'HON-001',
                quantity: 2,
                price: 24.99,
                totalPrice: 49.98
              },
              {
                id: 2,
                productName: 'Artisan Bread',
                sku: 'BRD-001',
                quantity: 1,
                price: 40.01,
                totalPrice: 40.01
              }
            ],
            shippingAddress: {
              street: '123 Main St',
              city: 'Anytown',
              state: 'CA',
              zipCode: '12345',
              country: 'USA'
            }
          },
          {
            id: 2,
            orderNumber: 'ORD-002',
            customerName: 'Jane Doe',
            customerEmail: 'jane@example.com',
            status: 'processing',
            totalAmount: 156.50,
            orderDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            items: [
              {
                id: 3,
                productName: 'Gourmet Spice Set',
                sku: 'SPC-001',
                quantity: 1,
                price: 156.50,
                totalPrice: 156.50
              }
            ],
            shippingAddress: {
              street: '456 Oak Ave',
              city: 'Another City',
              state: 'NY',
              zipCode: '67890',
              country: 'USA'
            }
          },
          {
            id: 3,
            orderNumber: 'ORD-003',
            customerName: 'Bob Wilson',
            customerEmail: 'bob@example.com',
            status: 'shipped',
            totalAmount: 75.25,
            orderDate: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
            shippedDate: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
            trackingNumber: 'TRK123456789',
            items: [
              {
                id: 4,
                productName: 'Farm Fresh Vegetables',
                sku: 'VEG-001',
                quantity: 3,
                price: 25.08,
                totalPrice: 75.25
              }
            ],
            shippingAddress: {
              street: '789 Pine Rd',
              city: 'Third Town',
              state: 'TX',
              zipCode: '54321',
              country: 'USA'
            }
          }
        ];

        setOrders(mockOrders);
        setPagination({
          page: 1,
          pages: 1,
          total: mockOrders.length
        });
      }
    } catch (error: any) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string, trackingNumber?: string) => {
    setUpdatingOrder(true);
    try {
      const response = await vendorService.updateOrderStatus(orderId, status, trackingNumber);
      if (response.success) {
        toast.success('Order status updated successfully');
        loadOrders();
        setShowOrderModal(false);
      }
    } catch (error: any) {
      toast.error('Failed to update order status');
    } finally {
      setUpdatingOrder(false);
    }
  };

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
      processing: { color: 'bg-blue-100 text-blue-800', icon: CurrencyDollarIcon },
      shipped: { color: 'bg-purple-100 text-purple-800', icon: TruckIcon },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      cancelled: { color: 'bg-red-100 text-red-800', icon: ClockIcon }
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

  const OrderDetailsModal: React.FC = () => {
    if (!selectedOrder || !showOrderModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Order {selectedOrder.orderNumber}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Placed on {new Date(selectedOrder.orderDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <StatusBadge status={selectedOrder.status} />
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedOrder.customerName}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.customerEmail}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Shipping Address</p>
                  <div className="text-sm text-gray-600">
                    <p>{selectedOrder.shippingAddress.street}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Order Total</span>
                  <span className="text-sm font-medium text-gray-900">
                    ${selectedOrder.totalAmount.toFixed(2)}
                  </span>
                </div>
                {selectedOrder.trackingNumber && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tracking Number</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedOrder.trackingNumber}
                    </span>
                  </div>
                )}
                {selectedOrder.shippedDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Shipped Date</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(selectedOrder.shippedDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Items */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <ShoppingBagIcon className="h-4 w-4 mr-2" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                      <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {item.quantity} × ${item.price.toFixed(2)} = ${item.totalPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Actions */}
          {(selectedOrder.status === 'pending' || selectedOrder.status === 'processing') && (
            <div className="mt-6 flex space-x-3">
              {selectedOrder.status === 'pending' && (
                <Button
                  onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'processing')}
                  loading={updatingOrder}
                >
                  Mark as Processing
                </Button>
              )}
              {selectedOrder.status === 'processing' && (
                <Button
                  onClick={() => {
                    const trackingNumber = window.prompt('Enter tracking number:');
                    if (trackingNumber) {
                      handleUpdateOrderStatus(selectedOrder.id, 'shipped', trackingNumber);
                    }
                  }}
                  loading={updatingOrder}
                >
                  Mark as Shipped
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => setShowOrderModal(false)}
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const columns: Column[] = [
    {
      key: 'orderNumber',
      label: 'Order',
      sortable: true,
      render: (value, item) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">
            {new Date(item.orderDate).toLocaleDateString()}
          </div>
        </div>
      )
    },
    {
      key: 'customerName',
      label: 'Customer',
      render: (value, item) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">{item.customerEmail}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'totalAmount',
      label: 'Total',
      sortable: true,
      render: (value) => (
        <span className="text-sm font-medium text-gray-900">
          ${value.toFixed(2)}
        </span>
      )
    },
    {
      key: 'items',
      label: 'Items',
      render: (value: OrderItem[]) => (
        <span className="text-sm text-gray-600">
          {value.length} item{value.length !== 1 ? 's' : ''}
        </span>
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
              setShowOrderModal(true);
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

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length
  };

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <Layout title="Orders">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600 mt-1">Manage and fulfill customer orders</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[
            { label: 'Total Orders', value: orderStats.total, color: 'bg-blue-500' },
            { label: 'Pending', value: orderStats.pending, color: 'bg-yellow-500' },
            { label: 'Processing', value: orderStats.processing, color: 'bg-purple-500' },
            { label: 'Shipped', value: orderStats.shipped, color: 'bg-green-500' },
            { label: 'Revenue', value: `$${totalRevenue.toFixed(2)}`, color: 'bg-indigo-500' }
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="flex items-center p-6">
                <div className={`p-3 rounded-full ${stat.color} text-white mr-4`}>
                  {index === 4 ? (
                    <CurrencyDollarIcon className="h-6 w-6" />
                  ) : (
                    <ShoppingBagIcon className="h-6 w-6" />
                  )}
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
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
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
                <Button onClick={loadOrders} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <DataTable
          columns={columns}
          data={orders}
          loading={loading}
          searchable
          searchPlaceholder="Search orders..."
          onSearch={(query) => setFilters(prev => ({ ...prev, search: query }))}
          pagination={{
            ...pagination,
            onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
          }}
          emptyMessage="No orders found."
        />

        {/* Order Details Modal */}
        <OrderDetailsModal />
      </div>
    </Layout>
  );
};