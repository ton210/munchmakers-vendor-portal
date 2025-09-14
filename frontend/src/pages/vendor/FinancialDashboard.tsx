import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import {
  CurrencyDollarIcon,
  ClockIcon,
  BanknotesIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

interface Transaction {
  id: number;
  transaction_type: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  transaction_date: string;
  payout_date?: string;
  reference_id?: string;
}

interface FinancialSummary {
  summary: {
    sale?: { total: number; count: number };
    commission?: { total: number; count: number };
    fee?: { total: number; count: number };
    payout?: { total: number; count: number };
  };
  pending_payout: number;
  last_payout_date: string | null;
  last_payout_amount: number;
}

const FinancialDashboard: React.FC = () => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const vendorId = 1; // This would come from auth context

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load financial summary
      const summaryResponse = await fetch(`/api/financials/summary/${vendorId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!summaryResponse.ok) {
        throw new Error('Failed to load financial summary');
      }

      const summaryData = await summaryResponse.json();
      setSummary(summaryData.data);

      // Load recent transactions
      const transactionsResponse = await fetch(`/api/financials/recent/${vendorId}?limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!transactionsResponse.ok) {
        throw new Error('Failed to load recent transactions');
      }

      const transactionsData = await transactionsResponse.json();
      setRecentTransactions(transactionsData.data);

    } catch (error) {
      console.error('Error loading financial data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sale': return <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />;
      case 'commission': return <ChartBarIcon className="h-5 w-5 text-blue-600" />;
      case 'fee': return <BanknotesIcon className="h-5 w-5 text-red-600" />;
      case 'payout': return <CurrencyDollarIcon className="h-5 w-5 text-purple-600" />;
      default: return <CurrencyDollarIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'cancelled': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <button
            onClick={loadFinancialData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
        <p className="text-gray-600">Track your earnings, costs, and payouts</p>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary?.summary?.sale?.total || 0)}
            </div>
            <p className="text-xs text-gray-600">
              {summary?.summary?.sale?.count || 0} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
            <ClockIcon className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(summary?.pending_payout || 0)}
            </div>
            <p className="text-xs text-gray-600">
              Available for withdrawal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            <BanknotesIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary?.summary?.fee?.total || 0)}
            </div>
            <p className="text-xs text-gray-600">
              {summary?.summary?.fee?.count || 0} fee charges
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Payout</CardTitle>
            <CurrencyDollarIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(summary?.last_payout_amount || 0)}
            </div>
            <p className="text-xs text-gray-600">
              {summary?.last_payout_date ?
                new Date(summary.last_payout_date).toLocaleDateString() :
                'No payouts yet'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
          <CardDescription>
            Your latest financial activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.transaction_type)}
                    <div>
                      <p className="font-medium capitalize">
                        {transaction.transaction_type.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {transaction.description || `Transaction #${transaction.id}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <CalendarIcon className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {new Date(transaction.transaction_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      transaction.transaction_type === 'sale' || transaction.transaction_type === 'payout'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {transaction.transaction_type === 'fee' ? '-' : '+'}
                      {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
                    </p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialDashboard;