import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { DataTable, Column } from '../../components/ui/DataTable';
import { 
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon,
  UserIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { adminService } from '../../services/adminService';
import { Product } from '../../types';
import toast from 'react-hot-toast';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    vendorId: '',
    categoryId: ''
  });

  useEffect(() => {
    loadProducts();
  }, [pagination.page, filters]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration - replace with actual API call
      const mockProducts: Product[] = [
        {
          id: 1,
          name: 'Organic Honey',
          description: 'Pure organic honey from local farms',
          sku: 'HON-001',
          price: 24.99,
          categoryId: 1,
          status: 'pending',
          vendorId: 1,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: 2,
          name: 'Artisan Bread',
          description: 'Freshly baked artisan bread',
          sku: 'BRD-001',
          price: 8.50,
          categoryId: 1,
          status: 'approved',
          vendorId: 2,
          createdAt: '2024-01-10T08:30:00Z',
          updatedAt: '2024-01-12T14:20:00Z'
        },
        {
          id: 3,
          name: 'Gourmet Spices',
          description: 'Premium spice collection',
          sku: 'SPC-001',
          price: 45.00,
          categoryId: 1,
          status: 'approved',
          vendorId: 3,
          createdAt: '2024-01-05T12:15:00Z',
          updatedAt: '2024-01-08T16:45:00Z'
        }
      ];

      setProducts(mockProducts);
      setPagination({
        page: 1,
        pages: 1,
        total: mockProducts.length
      });
    } catch (error: any) {
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProduct = async (product: Product) => {
    try {
      const response = await adminService.approveProduct(product.id);
      if (response.success) {
        toast.success(`${product.name} approved successfully!`);
        loadProducts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve product');
    }
  };

  const handleRejectProduct = async (product: Product, reason: string) => {
    try {
      const response = await adminService.rejectProduct(product.id, reason);
      if (response.success) {
        toast.success(`${product.name} rejected`);
        loadProducts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject product');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select products to approve');
      return;
    }

    try {
      const response = await adminService.bulkApproveProducts(selectedProducts);
      if (response.success) {
        toast.success(`${selectedProducts.length} products approved successfully!`);
        setSelectedProducts([]);
        loadProducts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve products');
    }
  };

  const handleBulkReject = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select products to reject');
      return;
    }

    const reason = window.prompt('Please provide a rejection reason:');
    if (!reason) return;

    try {
      const response = await adminService.bulkRejectProducts(selectedProducts, reason);
      if (response.success) {
        toast.success(`${selectedProducts.length} products rejected`);
        setSelectedProducts([]);
        loadProducts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject products');
    }
  };

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: ClockIcon },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircleIcon }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
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
      key: 'select',
      label: 'Select',
      render: (value, item) => (
        <input
          type="checkbox"
          checked={selectedProducts.includes(item.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedProducts(prev => [...prev, item.id]);
            } else {
              setSelectedProducts(prev => prev.filter(id => id !== item.id));
            }
          }}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
      )
    },
    {
      key: 'name',
      label: 'Product',
      sortable: true,
      render: (value, item) => (
        <div className="flex items-center">
          {item.images?.[0]?.imageUrl ? (
            <img
              src={item.images[0].imageUrl}
              alt={value}
              className="h-10 w-10 rounded object-cover mr-3"
            />
          ) : (
            <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center mr-3">
              <ShoppingBagIcon className="h-5 w-5 text-gray-400" />
            </div>
          )}
          <div>
            <div className="text-sm font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">SKU: {item.sku}</div>
          </div>
        </div>
      )
    },
    {
      key: 'vendor',
      label: 'Vendor',
      render: (value, item) => (
        <div className="flex items-center">
          <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">
            {item.vendor?.businessName || 'Unknown'}
          </span>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (value, item) => (
        <div className="flex items-center">
          <TagIcon className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">
            {item.category?.name || 'Uncategorized'}
          </span>
        </div>
      )
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value, item) => (
        <div>
          <div className="text-sm font-medium text-gray-900">${value.toFixed(2)}</div>
          {item.comparePrice && (
            <div className="text-sm text-gray-500 line-through">
              ${item.comparePrice.toFixed(2)}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'createdAt',
      label: 'Submitted',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, item) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {/* TODO: Open product details modal */}}
            className="text-primary-600 hover:text-primary-900"
            title="View details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          
          {item.status === 'pending' && (
            <>
              <button
                onClick={() => handleApproveProduct(item)}
                className="text-green-600 hover:text-green-900"
                title="Approve product"
              >
                <CheckCircleIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  const reason = window.prompt('Please provide a rejection reason:');
                  if (reason) {
                    handleRejectProduct(item, reason);
                  }
                }}
                className="text-red-600 hover:text-red-900"
                title="Reject product"
              >
                <XCircleIcon className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  const pendingCount = products?.filter(p => p.status === 'pending').length || 0;
  const approvedCount = products?.filter(p => p.status === 'approved').length || 0;
  const rejectedCount = products?.filter(p => p.status === 'rejected').length || 0;

  return (
    <Layout title="Product Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600 mt-1">Review and approve vendor products</p>
          </div>
          
          {selectedProducts.length > 0 && (
            <div className="flex space-x-2">
              <Button 
                variant="secondary" 
                onClick={handleBulkApprove}
              >
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Approve Selected ({selectedProducts.length})
              </Button>
              <Button 
                variant="danger" 
                onClick={handleBulkReject}
              >
                <XCircleIcon className="h-4 w-4 mr-2" />
                Reject Selected
              </Button>
            </div>
          )}
        </div>

        {/* Alert for pending products */}
        {pendingCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  {pendingCount} product{pendingCount !== 1 ? 's' : ''} pending approval
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Review products to approve them for the store or reject them with feedback.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Products', value: pagination.total, color: 'bg-blue-500' },
            { label: 'Pending', value: pendingCount, color: 'bg-yellow-500' },
            { label: 'Approved', value: approvedCount, color: 'bg-green-500' },
            { label: 'Rejected', value: rejectedCount, color: 'bg-red-500' }
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="flex items-center p-6">
                <div className={`p-3 rounded-full ${stat.color} text-white mr-4`}>
                  <ShoppingBagIcon className="h-6 w-6" />
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={filters.categoryId}
                  onChange={(e) => setFilters(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">All Categories</option>
                  {/* TODO: Load categories dynamically */}
                </select>
              </div>

              <div className="md:col-span-2 flex items-end">
                <Button
                  variant="secondary"
                  onClick={loadProducts}
                  className="w-full md:w-auto"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <DataTable
          columns={columns}
          data={products}
          loading={loading}
          searchable
          searchPlaceholder="Search products..."
          onSearch={(query) => setFilters(prev => ({ ...prev, search: query }))}
          pagination={{
            ...pagination,
            onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
          }}
          emptyMessage="No products found."
        />
      </div>
    </Layout>
  );
};