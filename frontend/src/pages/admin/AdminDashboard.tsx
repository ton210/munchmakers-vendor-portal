import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  UsersIcon, 
  ShoppingBagIcon, 
  ClockIcon, 
  CheckCircleIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { adminService } from '../../services/adminService';
import { DashboardStats } from '../../types';
import toast from 'react-hot-toast';

const AdminDashboard: React.FC = () => {
  console.log('🔍 AdminDashboard component loading...');
  
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const response = await adminService.getDashboardStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error: any) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncLoading(true);
    try {
      const response = await adminService.syncAllWithBigCommerce();
      if (response.success) {
        toast.success('BigCommerce sync initiated successfully');
        loadDashboardStats(); // Refresh stats
      } else {
        toast.error(response.message || 'Sync failed');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Please log in as an admin to use BigCommerce sync');
      } else if (error.response?.status === 403) {
        toast.error('You don\'t have permission to sync with BigCommerce');
      } else {
        toast.error(error.response?.data?.message || 'BigCommerce sync failed');
      }
    } finally {
      setSyncLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Vendors',
      value: stats?.totalVendors || 0,
      icon: UsersIcon,
      color: 'bg-blue-500'
    },
    {
      title: 'Pending Vendors',
      value: stats?.pendingVendors || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      urgent: (stats?.pendingVendors || 0) > 0
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ArrowTrendingUpIcon,
      color: 'bg-purple-500'
    },
    {
      title: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: ShoppingBagIcon,
      color: 'bg-green-500'
    },
    {
      title: 'Pending Products',
      value: stats?.pendingProducts || 0,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      urgent: (stats?.pendingProducts || 0) > 0
    },
    {
      title: 'Active Assignments',
      value: stats?.activeAssignments || 0,
      icon: CurrencyDollarIcon,
      color: 'bg-indigo-500'
    }
  ];

  if (loading) {
    return (
      <Layout title="Admin Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
          <p className="opacity-90">
            Monitor vendors, approve products, and manage the MunchMakers marketplace.
          </p>
        </div>

        {/* Alert for pending items */}
        {((stats?.pendingVendors || 0) > 0 || (stats?.pendingProducts || 0) > 0) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Items need your attention</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  You have {stats?.pendingVendors || 0} vendors and {stats?.pendingProducts || 0} products waiting for approval.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} hover>
              <CardContent className="flex items-center p-6">
                <div className={`p-3 rounded-full ${stat.color} text-white mr-4`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  {stat.urgent && (
                    <p className="text-xs text-red-600 font-medium">Requires attention</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                fullWidth 
                className="justify-start"
                onClick={() => {
                  if ((stats?.pendingVendors || 0) > 0) {
                    navigate('/admin/vendors?status=pending');
                  } else {
                    navigate('/admin/products?status=pending');
                  }
                }}
              >
                <ClockIcon className="h-4 w-4 mr-2" />
                Review Pending ({(stats?.pendingVendors || 0) + (stats?.pendingProducts || 0)})
              </Button>
              <Button 
                variant="secondary" 
                fullWidth 
                className="justify-start"
                onClick={() => navigate('/admin/vendors')}
              >
                <UsersIcon className="h-4 w-4 mr-2" />
                Manage Vendors
              </Button>
              <Button
                variant="secondary"
                fullWidth
                className="justify-start"
                onClick={() => navigate('/admin/orders')}
              >
                <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
                Manage Orders
              </Button>
              <Button
                variant="secondary"
                fullWidth
                className="justify-start"
                onClick={() => navigate('/admin/products')}
              >
                <ShoppingBagIcon className="h-4 w-4 mr-2" />
                Manage Products
              </Button>
              <Button 
                variant="ghost" 
                fullWidth 
                className="justify-start"
                loading={syncLoading}
                onClick={handleSyncAll}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                </svg>
                Sync with BigCommerce
              </Button>
            </CardContent>
          </Card>

          {/* Vendor Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600">Approved</span>
                  </div>
                  <span className="text-sm font-medium">{stats?.approvedVendors || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600">Pending</span>
                  </div>
                  <span className="text-sm font-medium">{stats?.pendingVendors || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600">Total</span>
                  </div>
                  <span className="text-sm font-medium">{stats?.totalVendors || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentActivity?.length ? (
                  stats.recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500">{new Date(activity.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Status</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-green-600">Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('dashboard.admin.database')}</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-green-600">{t('dashboard.admin.connected')}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('dashboard.admin.bigcommerceApi')}</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-green-600">{t('dashboard.admin.connected')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Overview Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center text-gray-500">
                  <ArrowTrendingUpIcon className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Growth chart will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;