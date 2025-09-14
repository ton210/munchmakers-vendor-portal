import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { 
  CogIcon,
  LinkIcon,
  ShieldCheckIcon,
  BellIcon,
  EnvelopeIcon,
  KeyIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';

interface SystemSettings {
  siteName: string;
  adminEmail: string;
  bigcommerce: {
    storeHash: string;
    accessToken: string;
    webhookUrl: string;
    syncEnabled: boolean;
  };
  email: {
    provider: string;
    fromEmail: string;
    fromName: string;
  };
  notifications: {
    slackEnabled: boolean;
    emailEnabled: boolean;
    webhookUrl: string;
  };
  security: {
    twoFactorRequired: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
}

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [connectionTest, setConnectionTest] = useState<{ testing: boolean; result: string | null }>({
    testing: false,
    result: null
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Mock settings data - replace with actual API call
      const mockSettings: SystemSettings = {
        siteName: 'MunchMakers Vendor Portal',
        adminEmail: 'admin@munchmakers.com',
        bigcommerce: {
          storeHash: 'tqjrceegho',
          accessToken: '***************************',
          webhookUrl: 'https://munchmakers-vendor-portal-a05873c786c1.herokuapp.com/webhooks/bigcommerce',
          syncEnabled: true
        },
        email: {
          provider: 'SendGrid',
          fromEmail: 'info@munchmakers.com',
          fromName: 'MunchMakers'
        },
        notifications: {
          slackEnabled: true,
          emailEnabled: true,
          webhookUrl: 'https://hooks.slack.com/services/***'
        },
        security: {
          twoFactorRequired: false,
          sessionTimeout: 24,
          maxLoginAttempts: 5
        }
      };

      setSettings(mockSettings);
    } catch (error: any) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (settingsData: Partial<SystemSettings>) => {
    setSaving(true);
    try {
      const response = await adminService.updateSettings(settingsData);
      if (response.success) {
        setSettings(prev => ({ ...prev, ...settingsData }) as SystemSettings);
        toast.success('Settings updated successfully');
      }
    } catch (error: any) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestBigCommerceConnection = async () => {
    setConnectionTest({ testing: true, result: null });
    try {
      const response = await adminService.testBigCommerceConnection(
        settings?.bigcommerce.storeHash || '',
        settings?.bigcommerce.accessToken || ''
      );
      
      if (response.success) {
        setConnectionTest({ testing: false, result: 'success' });
        toast.success('BigCommerce connection successful');
      } else {
        setConnectionTest({ testing: false, result: 'error' });
        toast.error(response.message || 'Connection test failed');
      }
    } catch (error: any) {
      setConnectionTest({ testing: false, result: 'error' });
      toast.error('Connection test failed');
    }
  };

  if (loading) {
    return (
      <Layout title="Settings">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!settings) {
    return (
      <Layout title="Settings">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Settings Not Available</h1>
          <p className="text-gray-600">Unable to load system settings.</p>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'general', name: 'General', icon: CogIcon },
    { id: 'bigcommerce', name: 'BigCommerce', icon: LinkIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon }
  ];

  return (
    <Layout title="System Settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600 mt-1">Configure system-wide settings and integrations</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Site Name"
                  value={settings.siteName}
                  onChange={() => {}}
                />
                <Input
                  label="Admin Email"
                  type="email"
                  value={settings.adminEmail}
                  onChange={() => {}}
                />
                <Input
                  label="From Email"
                  type="email"
                  value={settings.email.fromEmail}
                  onChange={() => {}}
                />
                <Input
                  label="From Name"
                  value={settings.email.fromName}
                  onChange={() => {}}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Database</span>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium text-green-600">Connected</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">BigCommerce API</span>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium text-green-600">Connected</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email Service</span>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium text-green-600">Operational</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'bigcommerce' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LinkIcon className="h-5 w-5 mr-2" />
                  BigCommerce Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Store Hash"
                  value={settings.bigcommerce.storeHash}
                  onChange={() => {}}
                  placeholder="Your BigCommerce store hash"
                />
                <Input
                  label="Access Token"
                  type="password"
                  value={settings.bigcommerce.accessToken}
                  onChange={() => {}}
                  placeholder="Your BigCommerce API access token"
                />
                <Input
                  label="Webhook URL"
                  value={settings.bigcommerce.webhookUrl}
                  onChange={() => {}}
                  placeholder="Webhook endpoint URL"
                />
                <div className="flex items-center space-x-3 pt-2">
                  <Button
                    onClick={handleTestBigCommerceConnection}
                    loading={connectionTest.testing}
                    variant="secondary"
                  >
                    Test Connection
                  </Button>
                  {connectionTest.result === 'success' && (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  )}
                  {connectionTest.result === 'error' && (
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sync Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Auto Sync</h4>
                      <p className="text-sm text-gray-500">Automatically sync products and categories</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        value="" 
                        className="sr-only peer"
                        checked={settings.bigcommerce.syncEnabled}
                        onChange={() => {}}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Sync Schedule</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Categories: Daily at 2:00 AM UTC</li>
                      <li>• Products: Every 6 hours</li>
                      <li>• Orders: Real-time via webhooks</li>
                      <li>• Inventory: Every 30 minutes</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'notifications' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BellIcon className="h-5 w-5 mr-2" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Email Notifications</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" checked={settings.notifications.emailEnabled} className="rounded border-gray-300" />
                      <span className="ml-2 text-sm text-gray-700">Vendor approvals</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                      <span className="ml-2 text-sm text-gray-700">Product submissions</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                      <span className="ml-2 text-sm text-gray-700">System errors</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Slack Notifications</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" checked={settings.notifications.slackEnabled} className="rounded border-gray-300" />
                      <span className="ml-2 text-sm text-gray-700">New vendor registrations</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                      <span className="ml-2 text-sm text-gray-700">Critical system alerts</span>
                    </label>
                    <Input
                      label="Slack Webhook URL"
                      value={settings.notifications.webhookUrl}
                      onChange={() => {}}
                      placeholder="https://hooks.slack.com/services/..."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'security' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 mr-2" />
                  Security Policies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Require 2FA for Admins</h4>
                    <p className="text-sm text-gray-500">Force two-factor authentication for all admin users</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={settings.security.twoFactorRequired}
                      onChange={() => {}}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <Input
                  label="Session Timeout (hours)"
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={() => {}}
                />
                
                <Input
                  label="Max Login Attempts"
                  type="number"
                  value={settings.security.maxLoginAttempts}
                  onChange={() => {}}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Security</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Rate Limiting</span>
                    <span className="text-sm font-medium text-green-600">Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">JWT Tokens</span>
                    <span className="text-sm font-medium text-green-600">Secured</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">CORS Policy</span>
                    <span className="text-sm font-medium text-green-600">Configured</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">CSP Headers</span>
                    <span className="text-sm font-medium text-green-600">Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={() => handleSaveSettings(settings)}
            loading={saving}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;