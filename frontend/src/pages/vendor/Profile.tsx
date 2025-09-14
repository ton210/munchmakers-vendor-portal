import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { 
  BuildingStorefrontIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
  DocumentTextIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { vendorService } from '../../services/vendorService';
import { Vendor } from '../../types';
import toast from 'react-hot-toast';

interface BigCommerceConnectionProps {
  vendor: Vendor;
  onUpdate: () => void;
}

const BigCommerceConnection: React.FC<BigCommerceConnectionProps> = ({ vendor, onUpdate }) => {
  const [connecting, setConnecting] = useState(false);
  const [credentials, setCredentials] = useState({
    storeHash: vendor.bigcommerceStoreHash || '',
    accessToken: vendor.bigcommerceAccessToken || ''
  });

  const handleConnect = async () => {
    if (!credentials.storeHash || !credentials.accessToken) {
      toast.error('Please enter both store hash and access token');
      return;
    }

    setConnecting(true);
    try {
      // Mock connection - replace with actual API call
      toast.success('BigCommerce store connected successfully!');
      onUpdate();
    } catch (error: any) {
      toast.error('Failed to connect to BigCommerce store');
    } finally {
      setConnecting(false);
    }
  };

  const isConnected = vendor.bigcommerceStoreHash && vendor.bigcommerceAccessToken;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <LinkIcon className="h-5 w-5 mr-2" />
          BigCommerce Integration
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-green-900">Connected to BigCommerce</h4>
                <p className="text-sm text-green-700">
                  Store Hash: {vendor.bigcommerceStoreHash}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button variant="secondary" className="flex-1">
                Sync Products
              </Button>
              <Button variant="secondary" className="flex-1">
                Test Connection
              </Button>
              <Button variant="danger">
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-yellow-900">BigCommerce Not Connected</h4>
                <p className="text-sm text-yellow-700">
                  Connect your BigCommerce store to sync products automatically.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Input
                label="Store Hash"
                value={credentials.storeHash}
                onChange={(e) => setCredentials(prev => ({ ...prev, storeHash: e.target.value }))}
                placeholder="Your BigCommerce store hash"
              />
              <Input
                label="Access Token"
                type="password"
                value={credentials.accessToken}
                onChange={(e) => setCredentials(prev => ({ ...prev, accessToken: e.target.value }))}
                placeholder="Your BigCommerce API access token"
              />
              <Button 
                onClick={handleConnect} 
                loading={connecting}
                className="w-full"
              >
                Connect BigCommerce Store
              </Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-900 mb-2">How to get your credentials:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Go to your BigCommerce admin panel</li>
                <li>• Navigate to Advanced Settings → API Accounts</li>
                <li>• Create a new API account or use existing one</li>
                <li>• Copy the Store Hash and Access Token</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const VendorProfile: React.FC = () => {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading vendor profile from database...');
      const response = await vendorService.getProfile();
      if (response.success) {
        console.log('✅ Loaded vendor profile:', response.data);
        setVendor(response.data);
      } else {
        console.error('❌ Failed to load profile:', response.message);
        toast.error(response.message || 'Failed to load profile');
      }
    } catch (error: any) {
      console.error('❌ Profile API error:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (profileData: Partial<Vendor>) => {
    setSaving(true);
    try {
      const response = await vendorService.updateProfile(profileData);
      if (response.success) {
        setVendor(response.data);
        toast.success('Profile updated successfully');
      }
    } catch (error: any) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!vendor) return;

    const formData = new FormData(e.currentTarget);
    const profileData = {
      businessName: formData.get('businessName') as string,
      contactName: formData.get('contactName') as string,
      contactEmail: formData.get('contactEmail') as string,
      phone: formData.get('phone') as string,
      businessAddress: formData.get('businessAddress') as string,
      businessType: formData.get('businessType') as string,
      website: formData.get('website') as string,
      taxId: formData.get('taxId') as string
    };

    handleSaveProfile(profileData);
  };

  if (loading) {
    return (
      <Layout title="Profile">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!vendor) {
    return (
      <Layout title="Profile">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <p className="text-gray-600">Unable to load your profile information.</p>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'profile', name: 'Business Profile', icon: BuildingStorefrontIcon },
    { id: 'integration', name: 'BigCommerce', icon: LinkIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon }
  ];

  const StatusBadge = () => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Approval' },
      approved: { color: 'bg-green-100 text-green-800', text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected' }
    };

    const config = statusConfig[vendor.status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <Layout title="Vendor Profile">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{vendor.businessName}</h1>
            <p className="text-gray-600 mt-1">Manage your business profile and settings</p>
          </div>
          <StatusBadge />
        </div>

        {/* Status Alert */}
        {vendor.status === 'pending' && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-900">
                    Your vendor application is under review
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    We're reviewing your application. You'll receive an email once approved.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {vendor.status === 'rejected' && vendor.rejectionReason && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-900">
                    Application Rejected
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    {vendor.rejectionReason}
                  </p>
                  <Button variant="secondary" className="mt-3">
                    Resubmit Application
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
        {activeTab === 'profile' && (
          <form onSubmit={handleFormSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Business Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BuildingStorefrontIcon className="h-5 w-5 mr-2" />
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    name="businessName"
                    label="Business Name"
                    defaultValue={vendor.businessName}
                    required
                  />
                  <Input
                    name="businessType"
                    label="Business Type"
                    defaultValue={vendor.businessType}
                    required
                  />
                  <Input
                    name="taxId"
                    label="Tax ID"
                    defaultValue={vendor.taxId}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Address
                    </label>
                    <textarea
                      name="businessAddress"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      defaultValue={vendor.businessAddress}
                      required
                    />
                  </div>
                  <Input
                    name="website"
                    label="Website"
                    type="url"
                    defaultValue={vendor.website || ''}
                  />
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserIcon className="h-5 w-5 mr-2" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    name="contactName"
                    label="Contact Name"
                    defaultValue={vendor.contactName}
                    required
                  />
                  <Input
                    name="contactEmail"
                    label="Contact Email"
                    type="email"
                    defaultValue={vendor.contactEmail}
                    required
                  />
                  <Input
                    name="phone"
                    label="Phone Number"
                    type="tel"
                    defaultValue={vendor.phone}
                    required
                  />
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end mt-6">
              <Button type="submit" loading={saving}>
                Save Changes
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'integration' && (
          <BigCommerceConnection vendor={vendor} onUpdate={loadProfile} />
        )}

        {activeTab === 'security' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <Button variant="secondary">
                    Enable 2FA
                  </Button>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Change Password</h4>
                      <p className="text-sm text-gray-500">Update your account password</p>
                    </div>
                    <Button variant="secondary">
                      Change Password
                    </Button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">API Keys</h4>
                      <p className="text-sm text-gray-500">Manage API keys for integrations</p>
                    </div>
                    <Button variant="secondary">
                      Manage Keys
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last Login</p>
                      <p className="text-sm text-gray-500">
                        {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Account Created</p>
                      <p className="text-sm text-gray-500">
                        {new Date(vendor.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Profile Updated</p>
                      <p className="text-sm text-gray-500">
                        {new Date(vendor.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VendorProfile;