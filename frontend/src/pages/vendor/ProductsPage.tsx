import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { DataTable, Column } from '../../components/ui/DataTable';
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { vendorService } from '../../services/vendorService';
import { Product } from '../../types';
import toast from 'react-hot-toast';

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    categoryId: ''
  });

  useEffect(() => {
    loadProducts();
  }, [pagination.page, filters]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading vendor products from database...');
      const response = await vendorService.getProducts({
        page: pagination.page,
        limit: 10,
        search: filters.search || undefined,
        status: filters.status || undefined,
        categoryId: filters.categoryId ? parseInt(filters.categoryId) : undefined
      });

      if (response.success) {
        console.log(`✅ Loaded ${response.data.items?.length || 0} products for vendor`);
        setProducts(response.data.items || []);
        setPagination({
          page: response.data.pagination?.page || 1,
          pages: response.data.pagination?.pages || 1,
          total: response.data.pagination?.total || 0
        });
      } else {
        console.error('❌ Failed to load products:', response.message);
        toast.error(response.message || 'Failed to load products');
        setProducts([]);
      }
    } catch (error: any) {
      console.error('❌ Products API error:', error);
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await vendorService.deleteProduct(productId);
      if (response.success) {
        toast.success('Product deleted successfully');
        loadProducts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
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
      key: 'name',
      label: 'Product Name',
      sortable: true,
      render: (value, item) => (
        <div className="flex items-center">
          {item.images?.[0]?.imageUrl && (
            <img
              src={item.images[0].imageUrl}
              alt={value}
              className="h-10 w-10 rounded object-cover mr-3"
            />
          )}
          <div>
            <div className="text-sm font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">SKU: {item.sku}</div>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (value, item) => item.category?.name || 'Uncategorized'
    },
    {
      key: 'base_price',
      label: 'Price',
      sortable: true,
      render: (value) => `$${(parseFloat(value) || 0).toFixed(2)}`
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'createdAt',
      label: 'Created',
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
          <button
            onClick={() => {/* TODO: Open edit modal */}}
            className="text-gray-600 hover:text-gray-900"
            title="Edit product"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteProduct(item.id)}
            className="text-red-600 hover:text-red-900"
            title="Delete product"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <Layout title="Products">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Products</h1>
            <p className="text-gray-600 mt-1">Manage your product catalog</p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={() => navigate('/products/new')}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Product
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => navigate('/products/bulk-upload')}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Bulk Upload
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Products', value: pagination.total, color: 'bg-blue-500' },
            { label: 'Approved', value: products?.filter(p => p.status === 'approved').length || 0, color: 'bg-green-500' },
            { label: 'Pending', value: products?.filter(p => p.status === 'pending').length || 0, color: 'bg-yellow-500' },
            { label: 'Drafts', value: products?.filter(p => p.status === 'draft').length || 0, color: 'bg-gray-500' }
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

              <div className="flex items-end">
                <Button
                  variant="secondary"
                  onClick={loadProducts}
                  className="w-full"
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
          emptyMessage="No products found. Create your first product to get started!"
        />
      </div>
    </Layout>
  );
};