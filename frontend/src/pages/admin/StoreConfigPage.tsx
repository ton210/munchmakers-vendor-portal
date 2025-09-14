import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { storeService } from '../../services/storeService';
import toast from 'react-hot-toast';

interface Store {
  id: number;
  name: string;
  type: 'shopify' | 'bigcommerce' | 'woocommerce';
  store_url: string;
  is_active: boolean;
  sync_enabled: boolean;
  last_sync_at?: string;
  created_at: string;
  connection_status?: 'connected' | 'disconnected' | 'error';
}

const StoreConfigPage: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [testingConnection, setTestingConnection] = useState<number | null>(null);

  const [newStore, setNewStore] = useState({
    name: '',
    type: 'shopify' as const,
    store_url: '',
    api_credentials: {},
    is_active: true,
    sync_enabled: true
  });

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      const response = await storeService.getStores();
      if (response.success) {
        setStores(response.data.stores);
      }
    } catch (error: any) {
      toast.error('Failed to load stores');
      console.error('Failed to load stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStore = async () => {
    try {
      const response = await storeService.createStore(newStore);
      if (response.success) {
        toast.success('Store created successfully');
        setShowAddModal(false);
        setNewStore({
          name: '',
          type: 'shopify',
          store_url: '',
          api_credentials: {},
          is_active: true,
          sync_enabled: true
        });
        loadStores();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create store');
    }
  };

  const handleTestConnection = async (store: Store) => {
    setTestingConnection(store.id);
    try {
      const response = await storeService.testConnection(store.id);
      if (response.success) {
        toast.success(`Connection to ${store.name} successful`);
      } else {
        toast.error(`Connection failed: ${response.message}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Connection test failed');
    } finally {
      setTestingConnection(null);
    }
  };

  const handleSyncStore = async (store: Store) => {
    try {
      const response = await storeService.syncStore(store.id);
      if (response.success) {
        toast.success(`Sync initiated for ${store.name}`);
        loadStores();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Sync failed');
    }
  };

  const getStoreTypeColor = (type: string) => {
    const colors = {
      shopify: 'bg-green-100 text-green-800',
      bigcommerce: 'bg-blue-100 text-blue-800',
      woocommerce: 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getConnectionStatusIcon = (status?: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const formatLastSync = (date?: string) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout title="Store Configuration">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Store Configuration</h1>
            <p className="text-gray-600">Manage connections to Shopify, BigCommerce, and WooCommerce stores</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Store
          </Button>
        </div>

        {/* Store Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : stores.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">No stores configured yet</p>
            </div>
          ) : (
            stores.map((store) => (
              <Card key={store.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        {getConnectionStatusIcon(store.connection_status)}
                        <span className="ml-2">{store.name}</span>
                      </CardTitle>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStoreTypeColor(store.type)}`}>
                        {store.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestConnection(store)}
                        loading={testingConnection === store.id}
                        className="p-1"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedStore(store);
                          setShowEditModal(true);
                        }}
                        className="p-1"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Store URL</label>
                    <p className="text-sm font-medium truncate">{store.store_url}</p>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-xs text-gray-500">Status</label>
                      <p className={`text-sm font-medium ${store.is_active ? 'text-green-600' : 'text-red-600'}`}>
                        {store.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Sync</label>
                      <p className={`text-sm font-medium ${store.sync_enabled ? 'text-green-600' : 'text-gray-600'}`}>
                        {store.sync_enabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">Last Sync</label>
                    <p className="text-sm">{formatLastSync(store.last_sync_at)}</p>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSyncStore(store)}
                      className="flex-1"
                    >
                      <ArrowPathIcon className="h-4 w-4 mr-1" />
                      Sync Now
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleTestConnection(store)}
                      loading={testingConnection === store.id}
                    >
                      Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Add Store Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Add New Store</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                    <input
                      type="text"
                      value={newStore.name}
                      onChange={(e) => setNewStore(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="My Store"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                    <select
                      value={newStore.type}
                      onChange={(e) => setNewStore(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="shopify">Shopify</option>
                      <option value="bigcommerce">BigCommerce</option>
                      <option value="woocommerce">WooCommerce</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Store URL</label>
                    <input
                      type="url"
                      value={newStore.store_url}
                      onChange={(e) => setNewStore(prev => ({ ...prev, store_url: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://your-store.myshopify.com"
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">API Credentials Required</h4>
                    <p className="text-sm text-yellow-700">
                      After creating the store, you'll need to configure API credentials in the store settings.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddModal(false);
                      setNewStore({
                        name: '',
                        type: 'shopify',
                        store_url: '',
                        api_credentials: {},
                        is_active: true,
                        sync_enabled: true
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateStore}
                    disabled={!newStore.name || !newStore.store_url}
                  >
                    Create Store
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StoreConfigPage;