import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  ShoppingBagIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { vendorService } from '../../services/vendorService';
import toast from 'react-hot-toast';

interface VendorDashboardStats {
  totalProducts: number;
  pendingProducts: number;
  approvedProducts: number;
  rejectedProducts: number;
  totalOrders: number;
  monthlyRevenue: number;
  totalAssignments: number;
  completedAssignments: number;
  totalEarnings: number;
  recentActivity: any[];
}

const VendorDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<VendorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const response = await vendorService.getDashboardStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error: any) {
      toast.error(t('toast.dashboardStatsLoadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSyncBigCommerce = async () => {
    setSyncLoading(true);
    try {
      const response = await vendorService.syncWithBigCommerce();
      if (response.success) {
        toast.success(t('toast.syncInitiated'));
        loadDashboardStats(); // Refresh stats
      } else {
        toast.error(response.message || t('toast.syncFailed'));
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error(t('toast.loginRequired'));
      } else if (error.response?.status === 403) {
        toast.error(t('toast.vendorSyncPermissionDenied'));
      } else {
        toast.error(error.response?.data?.message || t('toast.bigCommerceSyncFailed'));
      }
    } finally {
      setSyncLoading(false);
    }
  };

  const statCards = [
    {
      title: t('dashboard.vendor.totalProducts'),
      value: stats?.totalProducts || 0,
      icon: ShoppingBagIcon,
      color: 'bg-blue-500'
    },
    {
      title: t('dashboard.vendor.activeAssignments'),
      value: stats?.totalAssignments || 0,
      icon: ClockIcon,
      color: 'bg-orange-500'
    },
    {
      title: t('dashboard.vendor.completedOrders'),
      value: stats?.completedAssignments || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500'
    },
    {
      title: t('dashboard.vendor.totalEarnings'),
      value: `$${(stats?.totalEarnings || 0).toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: 'bg-purple-500'
    }
  ];

  if (loading) {
    return (
      <Layout title={t('dashboard.vendor.title')}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t('dashboard.vendor.title')}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">{t('dashboard.vendor.welcome')}</h1>
          <p className="opacity-90">
            {t('dashboard.vendor.welcomeMessage')}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} hover>
              <CardContent className="flex items-center p-6">
                <div className={`p-3 rounded-full ${stat.color} text-white mr-4`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.vendor.quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                fullWidth 
                className="justify-start"
                onClick={() => navigate('/products/new')}
              >
                <ShoppingBagIcon className="h-4 w-4 mr-2" />
                {t('dashboard.vendor.addNewProduct')}
              </Button>
              <Button
                variant="secondary"
                fullWidth
                className="justify-start"
                onClick={() => navigate('/assignments')}
              >
                <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
                {t('dashboard.vendor.viewAssignments')}
              </Button>
              <Button
                variant="secondary"
                fullWidth
                className="justify-start"
                onClick={() => navigate('/products')}
              >
                <ShoppingBagIcon className="h-4 w-4 mr-2" />
                {t('dashboard.vendor.viewProducts')}
              </Button>
              <Button 
                variant="ghost" 
                fullWidth 
                className="justify-start"
                loading={syncLoading}
                onClick={handleSyncBigCommerce}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                {t('dashboard.vendor.syncBigCommerce')}
              </Button>
            </CardContent>
          </Card>

          {/* Product Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.vendor.productStatus')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600">{t('dashboard.vendor.approved')}</span>
                  </div>
                  <span className="text-sm font-medium">{stats?.approvedProducts || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600">{t('dashboard.vendor.pending')}</span>
                  </div>
                  <span className="text-sm font-medium">{stats?.pendingProducts || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600">{t('dashboard.vendor.rejected')}</span>
                  </div>
                  <span className="text-sm font-medium">{stats?.rejectedProducts || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.vendor.recentActivity')}</CardTitle>
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
                  <p className="text-sm text-gray-500">{t('dashboard.vendor.noRecentActivity')}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.vendor.salesPerformance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center text-gray-500">
                <ArrowTrendingUpIcon className="h-12 w-12 mx-auto mb-4" />
                <p>{t('dashboard.vendor.salesChart')}</p>
                <p className="text-sm">{t('dashboard.vendor.connectStore')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default VendorDashboard;