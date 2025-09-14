import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  PlusIcon,
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
}

const StoresPage: React.FC = () => {
  console.log('✅ StoresPage component loaded successfully');
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

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
    <Layout title="Store Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Store Configuration</h1>
            <p className="text-gray-600">Manage connections to your e-commerce platforms</p>
          </div>
        </div>

        {/* Store Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : stores.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No stores configured</h3>
              <p className="text-gray-500 mb-6">Your Shopify, WooCommerce, and BigCommerce stores will appear here once configured.</p>
              <p className="text-sm text-gray-400">Stores are automatically configured from your environment variables.</p>
            </div>
          ) : (
            stores.map((store) => (
              <Card key={store.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                        {store.name}
                      </CardTitle>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStoreTypeColor(store.type)}`}>
                        {store.type.toUpperCase()}
                      </span>
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
                      onClick={() => handleSyncStore(store)}
                      className="flex-1"
                    >
                      <ArrowPathIcon className="h-4 w-4 mr-1" />
                      Sync Orders
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StoresPage;