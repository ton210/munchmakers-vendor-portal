import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { DataTable, Column } from '../../components/ui/DataTable';
import {
  ShoppingBagIcon,
  UserPlusIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { productSyncService } from '../../services/productSyncService';
import { storeService } from '../../services/storeService';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';

interface SyncedProduct {
  id: number;
  external_product_id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  inventory_quantity: number;
  product_type: string;
  store_name: string;
  store_type: string;
  assigned_vendors_count: number;
  is_active: boolean;
  last_synced_at: string;
}

interface Store {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
  last_sync_at?: string;
}

interface Vendor {
  id: number;
  company_name: string;
  commission_rate: number;
}

export const ProductAssignments: React.FC = () => {
  const [products, setProducts] = useState<SyncedProduct[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingStore, setSyncingStore] = useState<number | null>(null);

  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<number | null>(null);
  const [isDefaultAssignment, setIsDefaultAssignment] = useState(false);
  const [customCommission, setCustomCommission] = useState<number | null>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 50
  });

  const [filters, setFilters] = useState({
    search: '',
    store_id: '',
    has_vendor: '',
    is_active: 'true'
  });

  const [stats, setStats] = useState({
    total_products: 0,
    active_products: 0,
    assigned_products: 0,
    unassigned_products: 0,
    total_inventory: 0,
    average_price: 0
  });

  useEffect(() => {
    loadProducts();
    loadStores();
    loadVendors();
    loadStats();
  }, [pagination.page, filters]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await productSyncService.getSyncedProducts({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      if (response.success) {
        setProducts(response.data.items || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 1
        }));
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load synced products');
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
      const response = await productSyncService.getProductSyncStats();
      if (response.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSyncProducts = async (storeId: number) => {
    setSyncingStore(storeId);
    try {
      const response = await productSyncService.syncStoreProducts(storeId);
      if (response.success) {
        toast.success(response.message);
        loadProducts();
        loadStats();
      } else {
        toast.error(response.message || 'Failed to sync products');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to sync products');
    } finally {
      setSyncingStore(null);
    }
  };

  const handleBulkAssign = async () => {
    if (selectedProducts.length === 0 || !selectedVendor) {
      toast.error('Please select products and a vendor');
      return;
    }

    try {
      const response = await productSyncService.bulkAssignVendor({
        product_ids: selectedProducts,
        vendor_id: selectedVendor,
        is_default: isDefaultAssignment,
        commission_rate: customCommission || undefined
      });

      if (response.success) {
        toast.success(response.message);
        setShowBulkAssign(false);
        setSelectedProducts([]);
        setSelectedVendor(null);
        setIsDefaultAssignment(false);
        setCustomCommission(null);
        loadProducts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign vendor');
    }
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
      render: (value, item) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">SKU: {item.sku || 'N/A'}</div>
          <div className="text-sm text-gray-500 capitalize">{item.store_name} ({item.store_type})</div>
        </div>
      )
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value) => `$${(parseFloat(value) || 0).toFixed(2)}`
    },
    {
      key: 'inventory_quantity',
      label: 'Inventory',
      sortable: true,
      render: (value) => (
        <span className={value > 0 ? 'text-green-600 font-medium' : 'text-red-600'}>
          {value || 0}
        </span>
      )
    },
    {
      key: 'assigned_vendors_count',
      label: 'Assigned Vendors',
      render: (value) => (
        <div className="flex items-center">
          {value > 0 ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircleIcon className="w-3 h-3 mr-1" />
              {value} vendor{value !== 1 ? 's' : ''}
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
              Unassigned
            </span>
          )}
        </div>
      )
    },
    {
      key: 'last_synced_at',
      label: 'Last Synced',
      render: (value) => new Date(value).toLocaleDateString()
    }
  ];

  return (
    <Layout title="Product Assignments">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Assignments</h1>
            <p className="text-gray-600 mt-1">Manage vendor assignments for synced store products</p>
          </div>
          {selectedProducts.length > 0 && (
            <Button onClick={() => setShowBulkAssign(true)}>
              <UserPlusIcon className="h-4 w-4 mr-2" />
              Assign Vendor to {selectedProducts.length} Products
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {[
            { label: 'Total Products', value: stats.total_products, color: 'bg-blue-500' },
            { label: 'Active', value: stats.active_products, color: 'bg-green-500' },
            { label: 'Assigned', value: stats.assigned_products, color: 'bg-primary-500' },
            { label: 'Unassigned', value: stats.unassigned_products, color: 'bg-red-500' },
            { label: 'Total Inventory', value: stats.total_inventory, color: 'bg-purple-500' },
            { label: 'Avg Price', value: `$${stats.average_price.toFixed(2)}`, color: 'bg-yellow-500' }
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="flex items-center p-4">
                <div className={`p-2 rounded-full ${stat.color} text-white mr-3`}>
                  <ShoppingBagIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">{stat.label}</p>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Store Sync Section */}
        <Card>
          <CardHeader>
            <CardTitle>Sync Products from Stores</CardTitle>
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
                    onClick={() => handleSyncProducts(store.id)}
                    size="sm"
                    variant="secondary"
                    disabled={syncingStore === store.id || !store.is_active}
                    className="w-full"
                  >
                    {syncingStore === store.id ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        Syncing Products...
                      </>
                    ) : (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-2" />
                        Sync Products
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Product name, SKU..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
                <select
                  value={filters.store_id}
                  onChange={(e) => setFilters(prev => ({ ...prev, store_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Status</label>
                <select
                  value={filters.has_vendor}
                  onChange={(e) => setFilters(prev => ({ ...prev, has_vendor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Products</option>
                  <option value="true">Assigned</option>
                  <option value="false">Unassigned</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.is_active}
                  onChange={(e) => setFilters(prev => ({ ...prev, is_active: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <DataTable
          columns={columns}
          data={products}
          loading={loading}
          pagination={{
            ...pagination,
            onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
          }}
          emptyMessage="No synced products found. Sync stores to import products."
        />

        {/* Bulk Assignment Modal */}
        {showBulkAssign && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Assign Vendor to {selectedProducts.length} Products
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Vendor
                  </label>
                  <select
                    value={selectedVendor || ''}
                    onChange={(e) => setSelectedVendor(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Choose a vendor...</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.company_name} (Default: {vendor.commission_rate}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isDefaultAssignment}
                      onChange={(e) => setIsDefaultAssignment(e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Set as default vendor</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={customCommission || ''}
                    onChange={(e) => setCustomCommission(parseFloat(e.target.value) || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Leave empty to use vendor default"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  onClick={() => {
                    setShowBulkAssign(false);
                    setSelectedProducts([]);
                  }}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkAssign}
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