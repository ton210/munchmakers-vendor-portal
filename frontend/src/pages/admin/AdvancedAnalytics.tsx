import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { orderService } from '../../services/orderService';
import { proofService } from '../../services/proofService';
import { orderSplittingService } from '../../services/orderSplittingService';

interface AnalyticsData {
  orderStats: {
    total_orders: number;
    total_revenue: number;
    average_order_value: number;
    pending_orders: number;
    processing_orders: number;
    fulfilled_orders: number;
  };
  proofStats: {
    total_proofs: number;
    pending_proofs: number;
    approved_proofs: number;
    rejected_proofs: number;
    expired_proofs: number;
  };
  splittingStats: {
    split_orders: number;
    vendors_involved: number;
    total_split_amount: number;
    vendor_distribution: Array<{
      company_name: string;
      assignments_count: number;
      total_amount: number;
    }>;
  };
  vendorPerformance: Array<{
    vendor_name: string;
    total_assignments: number;
    completed_assignments: number;
    completion_rate: number;
    total_commission: number;
  }>;
}

export const AdvancedAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    date_from: '',
    date_to: ''
  });

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [orderStatsRes, proofStatsRes, splittingStatsRes] = await Promise.all([
        orderService.getOrderStats(dateRange),
        proofService.getProofStats(),
        orderSplittingService.getSplittingAnalytics(dateRange)
      ]);

      const analyticsData: AnalyticsData = {
        orderStats: orderStatsRes.success ? orderStatsRes.data.stats : {},
        proofStats: proofStatsRes.success ? proofStatsRes.data.stats : {},
        splittingStats: splittingStatsRes.success ? splittingStatsRes.data : {},
        vendorPerformance: [] // This would come from a vendor performance endpoint
      };

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Advanced Analytics">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (!analytics) {
    return (
      <Layout title="Advanced Analytics">
        <div className="text-center py-12">
          <p className="text-gray-500">Failed to load analytics data</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Advanced Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive business intelligence and performance metrics</p>
          </div>
        </div>

        {/* Date Range Filter */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateRange.date_from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, date_from: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateRange.date_to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, date_to: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setDateRange({ date_from: '', date_to: '' })}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear Dates
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Order Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {[
                {
                  label: 'Total Orders',
                  value: analytics.orderStats.total_orders || 0,
                  color: 'bg-blue-500',
                  icon: ShoppingBagIcon
                },
                {
                  label: 'Total Revenue',
                  value: `$${(analytics.orderStats.total_revenue || 0).toFixed(2)}`,
                  color: 'bg-green-500',
                  icon: CurrencyDollarIcon
                },
                {
                  label: 'Avg Order Value',
                  value: `$${(analytics.orderStats.average_order_value || 0).toFixed(2)}`,
                  color: 'bg-purple-500',
                  icon: ChartBarIcon
                },
                {
                  label: 'Pending',
                  value: analytics.orderStats.pending_orders || 0,
                  color: 'bg-yellow-500',
                  icon: ClockIcon
                },
                {
                  label: 'Processing',
                  value: analytics.orderStats.processing_orders || 0,
                  color: 'bg-blue-500',
                  icon: TruckIcon
                },
                {
                  label: 'Fulfilled',
                  value: analytics.orderStats.fulfilled_orders || 0,
                  color: 'bg-green-500',
                  icon: CheckCircleIcon
                }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 ${stat.color} rounded-full text-white mb-2`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Proof Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Proof Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                {
                  label: 'Total Proofs',
                  value: analytics.proofStats.total_proofs || 0,
                  color: 'bg-indigo-500'
                },
                {
                  label: 'Pending',
                  value: analytics.proofStats.pending_proofs || 0,
                  color: 'bg-yellow-500'
                },
                {
                  label: 'Approved',
                  value: analytics.proofStats.approved_proofs || 0,
                  color: 'bg-green-500'
                },
                {
                  label: 'Rejected',
                  value: analytics.proofStats.rejected_proofs || 0,
                  color: 'bg-red-500'
                },
                {
                  label: 'Expired',
                  value: analytics.proofStats.expired_proofs || 0,
                  color: 'bg-gray-500'
                }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 ${stat.color} rounded-full text-white mb-2`}>
                    <PhotoIcon className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Splitting Analytics */}
        {analytics.splittingStats.split_orders > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Order Splitting Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics.splittingStats.split_orders}
                  </div>
                  <div className="text-sm text-gray-600">Split Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics.splittingStats.vendors_involved}
                  </div>
                  <div className="text-sm text-gray-600">Vendors Involved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    ${(analytics.splittingStats.total_split_amount || 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Split Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {((analytics.splittingStats.split_orders / (analytics.orderStats.total_orders || 1)) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Split Rate</div>
                </div>
              </div>

              {/* Vendor Distribution */}
              {analytics.splittingStats.vendor_distribution?.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Vendor Assignment Distribution</h4>
                  <div className="space-y-2">
                    {analytics.splittingStats.vendor_distribution.map((vendor, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium text-gray-900">{vendor.company_name}</span>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {vendor.assignments_count} assignments
                          </div>
                          <div className="text-sm text-gray-500">
                            ${parseFloat(vendor.total_amount).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    status: 'Pending',
                    count: analytics.orderStats.pending_orders || 0,
                    color: 'bg-yellow-400'
                  },
                  {
                    status: 'Processing',
                    count: analytics.orderStats.processing_orders || 0,
                    color: 'bg-blue-400'
                  },
                  {
                    status: 'Fulfilled',
                    count: analytics.orderStats.fulfilled_orders || 0,
                    color: 'bg-green-400'
                  }
                ].map((item, index) => {
                  const total = analytics.orderStats.total_orders || 1;
                  const percentage = (item.count / total) * 100;

                  return (
                    <div key={index}>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.status}</span>
                        <span className="text-gray-900 font-medium">
                          {item.count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${item.color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Proof Approval Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    status: 'Approved',
                    count: analytics.proofStats.approved_proofs || 0,
                    color: 'bg-green-400'
                  },
                  {
                    status: 'Pending',
                    count: analytics.proofStats.pending_proofs || 0,
                    color: 'bg-yellow-400'
                  },
                  {
                    status: 'Rejected',
                    count: analytics.proofStats.rejected_proofs || 0,
                    color: 'bg-red-400'
                  }
                ].map((item, index) => {
                  const total = analytics.proofStats.total_proofs || 1;
                  const percentage = (item.count / total) * 100;

                  return (
                    <div key={index}>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.status}</span>
                        <span className="text-gray-900 font-medium">
                          {item.count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${item.color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Performance Indicators */}
        <Card>
          <CardHeader>
            <CardTitle>Key Performance Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {analytics.proofStats.total_proofs > 0
                    ? ((analytics.proofStats.approved_proofs / analytics.proofStats.total_proofs) * 100).toFixed(1)
                    : 0}%
                </div>
                <div className="text-sm text-gray-600">Proof Approval Rate</div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {analytics.orderStats.total_orders > 0
                    ? ((analytics.orderStats.fulfilled_orders / analytics.orderStats.total_orders) * 100).toFixed(1)
                    : 0}%
                </div>
                <div className="text-sm text-gray-600">Order Fulfillment Rate</div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {analytics.orderStats.total_orders > 0
                    ? ((analytics.splittingStats.split_orders / analytics.orderStats.total_orders) * 100).toFixed(1)
                    : 0}%
                </div>
                <div className="text-sm text-gray-600">Order Split Rate</div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600">
                  ${((analytics.orderStats.total_revenue || 0) / Math.max(analytics.orderStats.total_orders || 1, 1)).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Avg Order Value</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Order Management</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• {analytics.orderStats.total_orders || 0} total orders processed</li>
                    <li>• {analytics.orderStats.pending_orders || 0} orders awaiting processing</li>
                    <li>• {analytics.splittingStats.vendors_involved || 0} vendors actively involved</li>
                    <li>• {analytics.splittingStats.split_orders || 0} orders split across multiple vendors</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Customer Approval System</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• {analytics.proofStats.total_proofs || 0} proofs submitted to customers</li>
                    <li>• {analytics.proofStats.pending_proofs || 0} proofs awaiting customer response</li>
                    <li>• {analytics.proofStats.approved_proofs || 0} proofs approved by customers</li>
                    <li>• {analytics.proofStats.expired_proofs || 0} proofs expired without response</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};