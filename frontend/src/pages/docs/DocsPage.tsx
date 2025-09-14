import React from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const DocsPage: React.FC = () => {
  const sections = [
    {
      title: 'Getting Started',
      description: 'Learn the basics of the MunchMakers Vendor Portal',
      icon: DocumentTextIcon,
      links: [
        { name: 'Beta Program Overview', href: '#overview' },
        { name: 'Account Setup', href: '#setup' },
        { name: 'Profile Completion', href: '#profile' },
        { name: 'First Steps', href: '#first-steps' }
      ]
    },
    {
      title: 'Product Management',
      description: 'Upload and manage your product catalog',
      icon: CloudArrowUpIcon,
      links: [
        { name: 'Individual Product Upload', href: '#individual-upload' },
        { name: 'Bulk CSV Upload', href: '#bulk-upload' },
        { name: 'Product Categories', href: '#categories' },
        { name: 'Pricing Guidelines', href: '#pricing' }
      ]
    },
    {
      title: 'Orders & Sales',
      description: 'Manage orders and track your sales performance',
      icon: CurrencyDollarIcon,
      links: [
        { name: 'Order Management', href: '#orders' },
        { name: 'Payment Processing', href: '#payments' },
        { name: 'Shipping Integration', href: '#shipping' },
        { name: 'Sales Analytics', href: '#analytics' }
      ]
    },
    {
      title: 'Support & Communication',
      description: 'Get help and stay connected with our team',
      icon: ChatBubbleLeftRightIcon,
      links: [
        { name: 'Contact Support', href: '#support' },
        { name: 'Beta Program Updates', href: '#updates' },
        { name: 'Feedback & Suggestions', href: '#feedback' },
        { name: 'Community Guidelines', href: '#community' }
      ]
    }
  ];

  return (
    <div className="bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link to="/">
                <img
                  className="h-8 w-auto"
                  src="https://cdn11.bigcommerce.com/s-tqjrceegho/images/stencil/500w/munchmakers-logo_1_1752112946__55141.original.png"
                  alt="MunchMakers"
                />
              </Link>
              <nav className="hidden md:ml-8 md:flex space-x-8">
                <Link to="/" className="text-gray-900 hover:text-indigo-600">Home</Link>
                <Link to="/docs" className="text-indigo-600 font-medium">Documentation</Link>
                <Link to="/faq" className="text-gray-900 hover:text-indigo-600">FAQ</Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/vendor/login"
                className="text-gray-900 hover:text-indigo-600"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              MunchMakers Vendor Documentation
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to know to succeed in our exclusive beta vendor program.
              From setup to sales, we've got you covered.
            </p>
            <div className="mt-8 flex justify-center">
              <div className="inline-flex rounded-md shadow">
                <Link
                  to="/register"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Apply for Beta Access
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {sections.map((section) => (
            <div key={section.title} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <section.icon className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                  <p className="text-sm text-gray-600">{section.description}</p>
                </div>
              </div>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Beta Program Details */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Beta Program Overview</h2>
            <p className="mt-4 text-lg text-gray-600">
              Understanding the exclusive MunchMakers vendor beta program
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-indigo-100">
                <UserGroupIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Exclusive Access</h3>
              <p className="mt-2 text-gray-600">
                Limited to select invited vendors with personalized onboarding and support.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-indigo-100">
                <ShieldCheckIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Full Service</h3>
              <p className="mt-2 text-gray-600">
                We handle setup, marketing, and sales so you can focus on your products.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-indigo-100">
                <CurrencyDollarIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Premium Buyers</h3>
              <p className="mt-2 text-gray-600">
                Direct access to our network of US and European buyers actively purchasing.
              </p>
            </div>
          </div>

          <div className="mt-12 bg-white rounded-lg shadow p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">What We Provide</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Technical Setup</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• Complete product catalog setup</li>
                  <li>• Professional product page design</li>
                  <li>• Payment and shipping integration</li>
                  <li>• Order management system</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Marketing & Sales</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• Product promotion and marketing</li>
                  <li>• Buyer outreach and relationship building</li>
                  <li>• Deal negotiation and closing</li>
                  <li>• Performance analytics and reporting</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-indigo-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-indigo-900 mb-2">Ready to Get Started?</h3>
            <p className="text-indigo-800 mb-4">
              Join our exclusive beta program and start connecting with premium buyers today.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Apply for Beta Access
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <img
                className="h-6 w-auto"
                src="https://cdn11.bigcommerce.com/s-tqjrceegho/images/stencil/500w/munchmakers-logo_1_1752112946__55141.original.png"
                alt="MunchMakers"
              />
              <span className="ml-3 text-sm text-gray-600">
                © 2025 MunchMakers. All rights reserved.
              </span>
            </div>
            <div className="flex space-x-6">
              <Link to="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
                Privacy
              </Link>
              <Link to="/terms" className="text-sm text-gray-600 hover:text-gray-900">
                Terms
              </Link>
              <Link to="/contact" className="text-sm text-gray-600 hover:text-gray-900">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DocsPage;