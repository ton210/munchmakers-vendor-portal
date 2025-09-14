import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  PlayIcon,
  CheckIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { orderService } from '../../services/orderService';
import toast from 'react-hot-toast';

interface Assignment {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  store_name: string;
  store_type: string;
  total_amount: number;
  currency: string;
  order_date: string;
  assignment: {
    id: number;
    status: string;
    commission_amount: number;
    assigned_at: string;
    notes?: string;
  };
}

interface Stats {
  total: number;
  assigned: number;
  in_progress: number;
  completed: number;
  total_earnings: number;
}

const AssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    assigned: 0,
    in_progress: 0,
    completed: 0,
    total_earnings: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    date_from: '',
    date_to: ''
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 1
  });

  useEffect(() => {
    loadAssignments();
    loadStats();
  }, [pagination.page, filters]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value)
        )
      };

      const response = await orderService.getVendorOrders(params);

      if (response.success) {
        setAssignments(response.data.orders);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }));
      }
    } catch (error: any) {
      toast.error('Failed to load assignments');
      console.error('Failed to load assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await orderService.getOrderStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusUpdate = async (assignmentId: number, status: string) => {
    try {
      const response = await orderService.updateAssignmentStatus(assignmentId, status);
      if (response.success) {
        toast.success('Assignment status updated successfully');
        loadAssignments();
        loadStats();
      } else {
        toast.error(response.message || 'Status update failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Status update failed');
    }
  };

  const handleViewAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowDetails(true);
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      assigned: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionButtons = (assignment: Assignment) => {
    const status = assignment.assignment?.status;

    switch (status) {
      case 'assigned':
        return (
          <>
            <Button
              size="sm"
              onClick={() => handleStatusUpdate(assignment.assignment.id, 'accepted')}
              className="mr-2"
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusUpdate(assignment.assignment.id, 'cancelled')}
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </>
        );
      case 'accepted':
        return (
          <Button
            size="sm"
            onClick={() => handleStatusUpdate(assignment.assignment.id, 'in_progress')}
          >
            <PlayIcon className="h-4 w-4 mr-1" />
            Start Work
          </Button>
        );
      case 'in_progress':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatusUpdate(assignment.assignment.id, 'completed')}
          >
            <CheckIcon className="h-4 w-4 mr-1" />
            Complete
          </Button>
        );
      default:
        return null;
    }
  };

  const columns = [
    {
      key: 'order_number',
      label: 'Order #',
      render: (value: string, row: Assignment) => (
        <div className="font-medium text-gray-900">#{row.order_number}</div>
      )
    },
    {
      key: 'customer_name',
      label: 'Customer',
      render: (value: string, row: Assignment) => (
        <div>
          <div className="font-medium text-gray-900">{row.customer_name}</div>
          <div className="text-sm text-gray-500">{row.customer_email}</div>
        </div>
      )
    },
    {
      key: 'store_name',
      label: 'Store',
      render: (value: string, row: Assignment) => (
        <div>
          <div className="font-medium">{row.store_name}</div>
          <div className="text-sm text-gray-500 capitalize">{row.store_type}</div>
        </div>
      )
    },
    {
      key: 'total_amount',
      label: 'Amount',
      render: (value: number, row: Assignment) => (
        <div className="font-medium text-gray-900">
          {formatCurrency(row.total_amount, row.currency)}
        </div>
      )
    },
    {
      key: 'commission',
      label: 'Commission',
      render: (value: any, row: Assignment) => (
        <div className="font-medium text-green-600">
          {row.assignment?.commission_amount
            ? formatCurrency(row.assignment.commission_amount)
            : 'TBD'
          }
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: any, row: Assignment) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(row.assignment?.status)}`}>
          {row.assignment?.status?.replace('_', ' ').toUpperCase() || 'ASSIGNED'}
        </span>
      )
    },
    {
      key: 'assigned_date',
      label: 'Assigned Date',
      render: (value: any, row: Assignment) => (
        <div className="text-sm text-gray-900">
          {formatDate(row.assignment?.assigned_at || row.order_date)}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: Assignment) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewAssignment(row)}
            className="p-1"
          >
            <EyeIcon className="h-4 w-4" />
          </Button>

          {getActionButtons(row)}

          <Button
            variant="ghost"
            size="sm"
            className="p-1"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <Layout title="My Assignments">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
            <p className="text-gray-600">Manage your assigned orders and track earnings</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-500">Total Assignments</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <ClockIcon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.assigned}</div>
              <div className="text-sm text-gray-500">Pending</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <PlayIcon className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.in_progress}</div>
              <div className="text-sm text-gray-500">In Progress</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <CheckIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
              <div className="text-sm text-gray-500">Completed</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <CurrencyDollarIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.total_earnings)}
              </div>
              <div className="text-sm text-gray-500">Total Earnings</div>
            </CardContent>
          </Card>
        </div>

        {/* Completion Rate */}
        {stats.total > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Completion Rate</h3>
                  <p className="text-sm text-gray-500">
                    {stats.completed} of {stats.total} assignments completed
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {((stats.completed / stats.total) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Order #, customer..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Statuses</option>
                  <option value="assigned">Assigned</option>
                  <option value="accepted">Accepted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Assignments ({pagination.total})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={assignments}
              loading={loading}
              pagination={{
                currentPage: pagination.page,
                totalPages: pagination.pages,
                totalItems: pagination.total,
                onPageChange: (page: number) =>
                  setPagination(prev => ({ ...prev, page }))
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Assignment Details Modal */}
      {showDetails && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">Assignment #{selectedAssignment.order_number}</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Order Information</h3>
                  <p><strong>Customer:</strong> {selectedAssignment.customer_name}</p>
                  <p><strong>Email:</strong> {selectedAssignment.customer_email}</p>
                  <p><strong>Store:</strong> {selectedAssignment.store_name}</p>
                  <p><strong>Total:</strong> {formatCurrency(selectedAssignment.total_amount, selectedAssignment.currency)}</p>
                  <p><strong>Order Date:</strong> {formatDate(selectedAssignment.order_date)}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Assignment Details</h3>
                  <p><strong>Status:</strong>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(selectedAssignment.assignment?.status)}`}>
                      {selectedAssignment.assignment?.status?.replace('_', ' ').toUpperCase() || 'ASSIGNED'}
                    </span>
                  </p>
                  <p><strong>Commission:</strong> {
                    selectedAssignment.assignment?.commission_amount
                      ? formatCurrency(selectedAssignment.assignment.commission_amount)
                      : 'TBD'
                  }</p>
                  <p><strong>Assigned Date:</strong> {formatDate(selectedAssignment.assignment?.assigned_at || selectedAssignment.order_date)}</p>
                  {selectedAssignment.assignment?.notes && (
                    <p><strong>Notes:</strong> {selectedAssignment.assignment.notes}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                {getActionButtons(selectedAssignment)}
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AssignmentsPage;