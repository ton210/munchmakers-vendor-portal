import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  TruckIcon,
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { orderMonitoringService } from '../../services/orderMonitoringService';

interface OrderAlert {
  id: number;
  type: string;
  title: string;
  message: string;
  order_number?: string;
  order_id?: number;
  created_at: string;
  data?: any;
  is_read: boolean;
}

interface OrderAlertsProps {
  userType: 'vendor' | 'admin';
  vendorId?: number;
}

export const OrderAlerts: React.FC<OrderAlertsProps> = ({ userType, vendorId }) => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<OrderAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [userType, vendorId]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = userType === 'vendor'
        ? await orderMonitoringService.getVendorAlerts(vendorId!)
        : await orderMonitoringService.getAdminAlerts();

      if (response.success) {
        setAlerts(response.data.alerts || []);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (alertId: number) => {
    try {
      await orderMonitoringService.markAlertAsRead(alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const getAlertIcon = (alertType: string) => {
    const icons: { [key: string]: any } = {
      'unassigned': ExclamationTriangleIcon,
      'not_accepted': ClockIcon,
      'not_started': ClockIcon,
      'stale_in_progress': ExclamationTriangleIcon,
      'missing_tracking': TruckIcon,
      'stale_tracking': TruckIcon,
      'overdue_proof': ExclamationTriangleIcon
    };
    const IconComponent = icons[alertType] || ExclamationTriangleIcon;
    return <IconComponent className="h-5 w-5" />;
  };

  const getAlertColor = (alertType: string) => {
    const colors: { [key: string]: string } = {
      'unassigned': 'border-red-200 bg-red-50',
      'not_accepted': 'border-yellow-200 bg-yellow-50',
      'not_started': 'border-yellow-200 bg-yellow-50',
      'stale_in_progress': 'border-orange-200 bg-orange-50',
      'missing_tracking': 'border-blue-200 bg-blue-50',
      'stale_tracking': 'border-purple-200 bg-purple-50',
      'overdue_proof': 'border-red-200 bg-red-50'
    };
    return colors[alertType] || 'border-gray-200 bg-gray-50';
  };

  const getAlertTextColor = (alertType: string) => {
    const colors: { [key: string]: string } = {
      'unassigned': 'text-red-800',
      'not_accepted': 'text-yellow-800',
      'not_started': 'text-yellow-800',
      'stale_in_progress': 'text-orange-800',
      'missing_tracking': 'text-blue-800',
      'stale_tracking': 'text-purple-800',
      'overdue_proof': 'text-red-800'
    };
    return colors[alertType] || 'text-gray-800';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {userType === 'vendor' ? t('dashboard.orderAlerts') : 'Order Monitoring'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">{t('common.loading')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {userType === 'vendor' ? t('dashboard.orderAlerts') : 'Order Monitoring'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {userType === 'vendor' ? t('dashboard.noAlerts') : 'No Issues Found'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {userType === 'vendor'
                ? t('dashboard.allOrdersOnTrack')
                : 'All orders are being processed on schedule'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayAlerts = showAll ? alerts : alerts.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mr-2" />
            {userType === 'vendor' ? t('dashboard.orderAlerts') : 'Order Monitoring'}
            {alerts.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {alerts.length}
              </span>
            )}
          </CardTitle>
          {alerts.length > 3 && (
            <Button
              onClick={() => setShowAll(!showAll)}
              variant="secondary"
              size="sm"
            >
              {showAll ? 'Show Less' : `Show All (${alerts.length})`}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 ${getAlertColor(alert.data?.alert_type || 'default')}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className={`flex-shrink-0 ${getAlertTextColor(alert.data?.alert_type || 'default')}`}>
                    {getAlertIcon(alert.data?.alert_type || 'default')}
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className={`text-sm font-medium ${getAlertTextColor(alert.data?.alert_type || 'default')}`}>
                      {alert.title}
                    </h4>
                    <p className={`text-sm mt-1 ${getAlertTextColor(alert.data?.alert_type || 'default')} opacity-90`}>
                      {alert.message}
                    </p>
                    {alert.data?.order_number && (
                      <p className="text-xs text-gray-600 mt-1">
                        Order #{alert.data.order_number} • {new Date(alert.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {alert.data?.order_id && (
                    <button
                      onClick={() => {
                        // Navigate to order details
                        window.location.href = userType === 'vendor'
                          ? `/orders#${alert.data.order_id}`
                          : `/admin/orders#${alert.data.order_id}`;
                      }}
                      className="text-indigo-600 hover:text-indigo-800"
                      title="View Order"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleMarkAsRead(alert.id)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Dismiss"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {alerts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>
                {userType === 'vendor'
                  ? t('dashboard.alertsRequireAction')
                  : 'Click alerts to view details and take action'
                }
              </span>
              <button
                onClick={loadAlerts}
                className="text-indigo-600 hover:text-indigo-800"
              >
                {t('common.refresh')}
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};