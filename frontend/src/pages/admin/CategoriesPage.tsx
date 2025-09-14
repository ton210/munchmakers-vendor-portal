import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { DataTable, Column } from '../../components/ui/DataTable';
import { 
  ArrowPathIcon as RefreshIcon,
  TagIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { adminService } from '../../services/adminService';
import { ProductCategory } from '../../types';
import toast from 'react-hot-toast';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading categories from database...');
      const response = await adminService.getCategories();
      if (response.success) {
        console.log(`✅ Loaded ${response.data.length} categories from database`);
        setCategories(response.data);
      } else {
        console.error('❌ Failed to load categories:', response.message);
        toast.error(response.message || 'Failed to load categories');
        setCategories([]);
      }
    } catch (error: any) {
      console.error('❌ Categories API error:', error);
      toast.error('Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncWithBigCommerce = async () => {
    setSyncing(true);
    try {
      const response = await adminService.syncCategoriesWithBigCommerce();
      if (response.success) {
        toast.success(`Synced ${response.data.synced || 0} categories from BigCommerce`);
        setLastSync(new Date().toLocaleString());
        await loadCategories(); // Reload categories after sync
      } else {
        toast.error(response.message || 'Sync failed');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Please log in as an admin to sync categories');
      } else if (error.response?.status === 403) {
        toast.error('You don\'t have permission to sync categories');
      } else {
        toast.error(error.response?.data?.message || 'Failed to sync categories');
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateCategory = async () => {
    const name = window.prompt('Enter category name:');
    if (!name) return;

    try {
      const response = await adminService.createCategory({
        name,
        isActive: true,
        sortOrder: categories.length + 1
      });
      
      if (response.success) {
        toast.success('Category created successfully');
        loadCategories();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create category');
    }
  };

  const handleToggleActive = async (category: ProductCategory) => {
    try {
      const response = await adminService.updateCategory(category.id, {
        isActive: !category.isActive
      });
      
      if (response.success) {
        toast.success(`Category ${category.isActive ? 'deactivated' : 'activated'}`);
        loadCategories();
      }
    } catch (error: any) {
      toast.error('Failed to update category');
    }
  };

  const columns: Column[] = [
    {
      key: 'name',
      label: 'Category Name',
      sortable: true,
      render: (value, item) => (
        <div className="flex items-center">
          <TagIcon className="h-5 w-5 text-gray-400 mr-3" />
          <div>
            <div className="text-sm font-medium text-gray-900">{value}</div>
            {item.description && (
              <div className="text-sm text-gray-500">{item.description}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'parent',
      label: 'Parent Category',
      render: (value, item) => {
        if (item.parent) {
          return (
            <div className="flex items-center">
              <span className="text-sm text-gray-600">{item.parent.name}</span>
              <ArrowRightIcon className="h-4 w-4 text-gray-400 mx-2" />
              <span className="text-sm font-medium text-gray-900">{item.name}</span>
            </div>
          );
        }
        return <span className="text-sm text-gray-500">Root Category</span>;
      }
    },
    {
      key: 'bigcommerce_category_id',
      label: 'BigCommerce ID',
      render: (value) => (
        <div className="flex items-center">
          {value ? (
            <>
              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm text-gray-900">#{value}</span>
            </>
          ) : (
            <>
              <XCircleIcon className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">Not synced</span>
            </>
          )}
        </div>
      )
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'sort_order',
      label: 'Sort Order',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-900">{value}</span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, item) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleToggleActive(item)}
            className={`${
              item.isActive
                ? 'text-red-600 hover:text-red-900'
                : 'text-green-600 hover:text-green-900'
            }`}
            title={item.isActive ? 'Deactivate' : 'Activate'}
          >
            {item.isActive ? (
              <XCircleIcon className="h-4 w-4" />
            ) : (
              <CheckCircleIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      )
    }
  ];

  const activeCount = categories.filter(c => c.isActive).length;
  const syncedCount = categories.filter(c => c.bigcommerceCategoryId).length;

  return (
    <Layout title="Category Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
            <p className="text-gray-600 mt-1">Manage product categories and sync with BigCommerce</p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="secondary" 
              onClick={handleCreateCategory}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Category
            </Button>
            <Button 
              variant="danger"
              onClick={async () => {
                if (window.confirm('This will delete ALL categories and resync from BigCommerce. Are you sure?')) {
                  try {
                    const response = await adminService.resetCategories();
                    if (response.success) {
                      toast.success('Categories reset successfully');
                      await loadCategories();
                    }
                  } catch (error: any) {
                    toast.error('Failed to reset categories');
                  }
                }
              }}
            >
              Reset & Clean
            </Button>
            <Button 
              onClick={handleSyncWithBigCommerce}
              loading={syncing}
            >
              <RefreshIcon className="h-4 w-4 mr-2" />
              Sync with BigCommerce
            </Button>
          </div>
        </div>

        {/* Sync Status */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">BigCommerce Sync Status</h3>
                {lastSync ? (
                  <p className="text-sm text-gray-600">
                    Last synced: {lastSync}
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    Categories can be synced from your BigCommerce store to maintain consistency.
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600">{syncedCount}</div>
                <div className="text-sm text-gray-500">Synced categories</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Categories', value: categories.length, color: 'bg-blue-500' },
            { label: 'Active Categories', value: activeCount, color: 'bg-green-500' },
            { label: 'BigCommerce Synced', value: syncedCount, color: 'bg-purple-500' }
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="flex items-center p-6">
                <div className={`p-3 rounded-full ${stat.color} text-white mr-4`}>
                  <TagIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* BigCommerce Integration Info */}
        <Card>
          <CardHeader>
            <CardTitle>BigCommerce Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Automatic Sync Schedule</h4>
              <p className="text-sm text-blue-800 mb-3">
                Categories are automatically synced with BigCommerce once daily at 2:00 AM UTC. 
                You can also trigger manual syncs using the button above.
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• New categories from BigCommerce will be imported</li>
                <li>• Existing categories will be updated with latest information</li>
                <li>• Category hierarchy (parent/child) relationships are preserved</li>
                <li>• Inactive categories in BigCommerce will be marked as inactive here</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Categories Table */}
        <DataTable
          columns={columns}
          data={categories}
          loading={loading}
          searchable
          searchPlaceholder="Search categories..."
          emptyMessage="No categories found. Sync with BigCommerce to import categories."
        />
      </div>
    </Layout>
  );
};