import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBagIcon,
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const VendorLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="relative bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img
                className="h-10 w-auto"
                src="https://cdn11.bigcommerce.com/s-tqjrceegho/images/stencil/500w/munchmakers-logo_1_1752112946__55141.original.png"
                alt="MunchMakers"
              />
              <span className="ml-3 text-xl font-semibold text-gray-900">Vendor Portal</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to the
              <span className="text-indigo-600"> MunchMakers</span>
              <br />Vendor Portal
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Manage your products, track orders, and grow your business with our comprehensive vendor platform.
              Join our network of premium food and beverage suppliers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Access Your Portal
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Apply for Partnership
              </Link>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full">
            <div className="w-full h-full bg-gradient-to-r from-indigo-100 via-purple-50 to-pink-100 opacity-30"></div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Your Business
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our vendor portal provides comprehensive tools to help you succeed in the MunchMakers marketplace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: ShoppingBagIcon,
                title: 'Product Management',
                description: 'Upload and manage your product catalog with ease. Add variants, pricing tiers, and detailed descriptions.'
              },
              {
                icon: ChartBarIcon,
                title: 'Sales Analytics',
                description: 'Track your performance with detailed analytics and insights to optimize your business strategy.'
              },
              {
                icon: UserGroupIcon,
                title: 'Customer Relations',
                description: 'Communicate directly with customers and manage orders through our integrated messaging system.'
              },
              {
                icon: CogIcon,
                title: 'Business Tools',
                description: 'Access financial dashboards, user management, and business configuration tools.'
              }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-6">
                  <feature.icon className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-blue-900 mb-4">
              🎯 Try Our Demo
            </h3>
            <p className="text-blue-800 mb-6">
              Explore the vendor portal with our demo accounts. See how easy it is to manage your products and orders.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                {
                  name: 'Demo Restaurant',
                  email: 'demo@restaurant.com',
                  password: 'demo123',
                  status: 'Has sample products'
                },
                {
                  name: 'Artisan Coffee Co',
                  email: 'vendor@coffee.com',
                  password: 'coffee123',
                  status: 'Clean account'
                },
                {
                  name: 'Organic Farms LLC',
                  email: 'info@organicfarms.com',
                  password: 'organic123',
                  status: 'Pending approval'
                }
              ].map((account, index) => (
                <div key={index} className="bg-white border border-blue-200 rounded-md p-4">
                  <div className="text-sm font-medium text-gray-900 mb-1">{account.name}</div>
                  <div className="text-xs text-gray-600 mb-2">
                    <div>📧 {account.email}</div>
                    <div>🔑 {account.password}</div>
                    <div className="text-blue-600 font-medium mt-1">{account.status}</div>
                  </div>
                </div>
              ))}
            </div>

            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Try Demo Login
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <img
                className="h-8 w-auto"
                src="https://cdn11.bigcommerce.com/s-tqjrceegho/images/stencil/500w/munchmakers-logo_1_1752112946__55141.original.png"
                alt="MunchMakers"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
              <span className="ml-3 text-lg font-semibold">MunchMakers Vendor Portal</span>
            </div>
            <div className="flex space-x-6">
              <Link to="/privacy" className="text-gray-400 hover:text-white">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white">
                Terms of Service
              </Link>
              <Link to="/vendor-agreement" className="text-gray-400 hover:text-white">
                Vendor Agreement
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 MunchMakers. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VendorLandingPage;