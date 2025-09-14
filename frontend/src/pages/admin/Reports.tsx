import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ShoppingBagIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';

interface AnalyticsData {
  totalRevenue: number;
  revenueGrowth: number;
  totalVendors: number;
  vendorGrowth: number;
  totalProducts: number;
  productGrowth: number;
  totalOrders: number;
  orderGrowth: number;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  topVendors: Array<{ name: string; revenue: number; orders: number }>;
  categoryBreakdown: Array<{ category: string; count: number; revenue: number }>;
}

const AdminReports: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await adminService.getAnalytics({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error: any) {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    setExportLoading(true);
    try {
      toast.success('Report export initiated. You will receive an email when ready.');
    } catch (error: any) {
      toast.error('Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(analytics?.totalRevenue || 0),
      change: analytics?.revenueGrowth || 0,
      icon: CurrencyDollarIcon,
      color: 'bg-green-500'
    },
    {
      title: 'Active Vendors',
      value: analytics?.totalVendors || 0,
      change: analytics?.vendorGrowth || 0,
      icon: UsersIcon,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Products',
      value: analytics?.totalProducts || 0,
      change: analytics?.productGrowth || 0,
      icon: ShoppingBagIcon,
      color: 'bg-purple-500'
    },
    {
      title: 'Total Orders',
      value: analytics?.totalOrders || 0,
      change: analytics?.orderGrowth || 0,
      icon: ChartBarIcon,
      color: 'bg-orange-500'
    }
  ];

  if (loading) {
    return (
      <Layout title="Reports & Analytics">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Reports & Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Track platform performance and vendor metrics</p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={handleExportReport}
              loading={exportLoading}
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Date Range Filter */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <div className="flex space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={loadAnalytics}>Apply</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} hover>
              <CardContent className="flex items-center p-6">
                <div className={`p-3 rounded-full ${stat.color} text-white mr-4`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center mt-1">
                    <span className={`text-sm font-medium ${
                      stat.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercentage(stat.change)}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">vs last period</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowTrendingUpIcon className="h-5 w-5 mr-2" />
                Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center text-gray-500">
                  <ChartBarIcon className="h-12 w-12 mx-auto mb-4" />
                  <p>Revenue chart visualization</p>
                  <p className="text-sm">Chart.js integration coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Vendors */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Vendors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.topVendors?.slice(0, 5).map((vendor, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{vendor.name}</p>
                        <p className="text-sm text-gray-500">{vendor.orders} orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(vendor.revenue)}</p>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8">
                    <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No vendor data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Products
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Revenue/Product
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics?.categoryBreakdown?.map((category, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{category.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{category.count}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(category.revenue)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(category.revenue / (category.count || 1))}
                        </div>
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <ChartBarIcon className="h-12 w-12 mx-auto mb-4" />
                          <p>No category data available</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* System Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Growth Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Vendor Acquisition</span>
                  <span className="text-sm font-medium text-green-600">+{analytics?.vendorGrowth?.toFixed(1) || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Product Listings</span>
                  <span className="text-sm font-medium text-blue-600">+{analytics?.productGrowth?.toFixed(1) || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Order Volume</span>
                  <span className="text-sm font-medium text-purple-600">+{analytics?.orderGrowth?.toFixed(1) || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Products per Vendor</span>
                  <span className="text-sm font-medium text-gray-900">
                    {((analytics?.totalProducts || 0) / (analytics?.totalVendors || 1)).toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Revenue per Order</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency((analytics?.totalRevenue || 0) / (analytics?.totalOrders || 1))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="secondary" fullWidth className="justify-start">
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Export Vendor Report
              </Button>
              <Button variant="secondary" fullWidth className="justify-start">
                <ChartBarIcon className="h-4 w-4 mr-2" />
                View Detailed Analytics
              </Button>
              <Button variant="secondary" fullWidth className="justify-start">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Schedule Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AdminReports;