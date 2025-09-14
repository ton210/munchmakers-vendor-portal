import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'admin' as const
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData);
      // Navigation will happen automatically via auth context
      navigate('/admin/dashboard');
    } catch (error: any) {
      // Error is handled in the auth context with toast
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-600">
            <ShieldCheckIcon className="h-8 w-8 text-white" aria-hidden="true" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
            Admin Portal Access
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Authorized personnel only
          </p>

          {/* Demo Credentials */}
          <div className="mt-4 p-4 bg-green-900 border border-green-700 rounded-lg">
            <h3 className="text-sm font-medium text-green-200 mb-3 text-center">
              🎯 Demo Admin Accounts
            </h3>
            <div className="space-y-2">
              {[
                {
                  name: 'Demo Admin',
                  email: 'demo@admin.com',
                  password: 'admin123',
                  role: 'Full Access'
                },
                {
                  name: 'Product Reviewer',
                  email: 'reviewer@munchmakers.com',
                  password: 'Reviewer123!',
                  role: 'Product Approval Only'
                }
              ].map((account, index) => (
                <div key={index} className="border border-green-700 rounded-md p-3 bg-green-800">
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-sm font-medium text-white">{account.name}</div>
                    <span className="text-xs text-green-200">{account.role}</span>
                  </div>
                  <div className="text-xs text-green-300 mb-2">
                    <div>📧 {account.email}</div>
                    <div>🔑 {account.password}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        email: account.email,
                        password: account.password,
                        userType: 'admin'
                      });
                    }}
                    className="text-xs text-green-400 hover:text-green-200 underline"
                  >
                    Auto-fill this account
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Admin Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full appearance-none rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="admin@munchmakers.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full appearance-none rounded-md border border-gray-600 bg-gray-800 px-3 py-2 pr-10 text-white placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <ShieldCheckIcon className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" aria-hidden="true" />
              </span>
              {loading ? 'Authenticating...' : 'Access Admin Portal'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              This portal is restricted to authorized MunchMakers administrators only.
              Unauthorized access attempts are logged and monitored.
            </p>
          </div>
        </form>

        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span className="text-xs text-gray-400">System Status: Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;