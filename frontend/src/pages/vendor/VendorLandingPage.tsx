import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBagIcon,
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  StarIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  TruckIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

const VendorLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900">
      {/* Header */}
      <header className="relative bg-black bg-opacity-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img
                className="h-12 w-auto"
                src="https://cdn11.bigcommerce.com/s-tqjrceegho/images/stencil/500w/munchmakers-logo_1_1752112946__55141.original.png"
                alt="MunchMakers"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
              <span className="ml-3 text-xl font-semibold text-white">Supplier Network</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Supplier Login
              </Link>
              <Link
                to="/register"
                className="bg-orange-600 text-white hover:bg-orange-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                Join Network
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Join the
              <span className="text-orange-500"> MunchMakers</span>
              <br />Supplier Network
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto">
              Connect your smoke accessories business with our exclusive network of demand partners across the US and Europe.
              We handle marketing, deal closing, and customer relationships while you focus on what you do best - creating quality products.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-lg"
              >
                Start Partnership
                <ArrowRightIcon className="ml-2 h-6 w-6" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-4 border border-gray-400 text-lg font-medium rounded-md text-gray-300 bg-transparent hover:bg-gray-800 transition-colors"
              >
                Access Portal
              </Link>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full opacity-20">
            <div className="w-full h-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500"></div>
          </div>
        </div>
      </div>

      {/* What We Do Section */}
      <div className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              We Connect You to Premium Buyers
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              MunchMakers has established relationships with premium smoke accessory retailers,
              cannabis dispensaries, and high-end lifestyle brands looking for quality suppliers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: UserGroupIcon,
                title: 'We Handle Marketing',
                description: 'Our team showcases your products to our network of premium buyers, creating demand and generating qualified leads for your business.'
              },
              {
                icon: CurrencyDollarIcon,
                title: 'We Close Deals',
                description: 'From initial contact to final contracts, our sales team manages the entire process while keeping you informed every step of the way.'
              },
              {
                icon: CogIcon,
                title: 'You Control Products',
                description: 'Maintain full control over product details, pricing, inventory, and fulfillment through your comprehensive vendor dashboard.'
              }
            ].map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Target Market Section */}
      <div className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Perfect for Smoke Accessories Suppliers
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We specialize in connecting manufacturers and suppliers of smoking accessories
              with premium retailers and brands seeking quality products.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                category: 'Grinders',
                items: ['Herb Grinders', 'Electric Grinders', 'Custom Grinders', 'Premium Materials']
              },
              {
                category: 'Rolling Accessories',
                items: ['Rolling Papers', 'Rolling Trays', 'Rolling Machines', 'Custom Papers']
              },
              {
                category: 'Lighting & Tools',
                items: ['Butane Lighters', 'Torch Lighters', 'Custom Lighters', 'Accessories']
              },
              {
                category: 'Vaping Products',
                items: ['Dry Herb Vaporizers', 'Vape Accessories', 'Replacement Parts', 'Custom Designs']
              }
            ].map((category, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-6 hover:bg-gray-600 transition-colors">
                <h4 className="text-lg font-semibold text-white mb-4">{category.category}</h4>
                <ul className="space-y-2">
                  {category.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-gray-300 text-sm flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-8">
                Why Suppliers Choose MunchMakers
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: GlobeAltIcon,
                    title: 'Access to Premium Markets',
                    description: 'Connect with high-end dispensaries, head shops, and lifestyle brands across North America and Europe.'
                  },
                  {
                    icon: TruckIcon,
                    title: 'Streamlined Fulfillment',
                    description: 'Our integrated system handles order routing, vendor assignment, and tracking - you just ship.'
                  },
                  {
                    icon: ChartBarIcon,
                    title: 'Complete Transparency',
                    description: 'Real-time analytics, commission tracking, and performance metrics give you full visibility.'
                  },
                  {
                    icon: UserGroupIcon,
                    title: 'Dedicated Support',
                    description: 'Personal account managers help optimize your product listings and maximize sales.'
                  }
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-600 rounded-lg mr-4 flex-shrink-0">
                      <benefit.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                      <p className="text-gray-300">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:pl-8">
              <div className="bg-gradient-to-br from-orange-600 to-red-700 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6">Ready to Get Started?</h3>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-orange-200 mr-3" />
                    <span>Upload your product catalog</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-orange-200 mr-3" />
                    <span>Connect your existing stores</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-orange-200 mr-3" />
                    <span>Start receiving qualified orders</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-orange-200 mr-3" />
                    <span>Track performance and earnings</span>
                  </div>
                </div>

                <Link
                  to="/register"
                  className="block w-full text-center bg-white text-orange-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Apply for Partnership
                </Link>

                <p className="text-center text-orange-200 text-sm mt-4">
                  Exclusive network • Vetted suppliers only
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Stories Section */}
      <div className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Success Stories from Our Network
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              See how MunchMakers has helped smoke accessories suppliers scale their businesses
              and reach premium markets across North America and Europe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Premium Grinder Co.',
                growth: '300% Revenue Growth',
                story: 'Expanded from local sales to nationwide distribution through MunchMakers premium buyer network.',
                specialty: 'High-end herb grinders'
              },
              {
                name: 'Artisan Rolling Papers',
                growth: '150+ New Accounts',
                story: 'Connected with dispensaries and head shops across 15 states, doubling their wholesale business.',
                specialty: 'Custom rolling papers'
              },
              {
                name: 'Torch Lighter Specialists',
                growth: '$500K Annual Sales',
                story: 'Leveraged MunchMakers platform to automate order management and scale production efficiently.',
                specialty: 'Premium torch lighters'
              }
            ].map((story, index) => (
              <div key={index} className="bg-gray-700 rounded-xl p-6 hover:bg-gray-600 transition-colors">
                <div className="text-orange-500 font-semibold text-sm mb-2">{story.specialty}</div>
                <h4 className="text-xl font-bold text-white mb-2">{story.name}</h4>
                <div className="text-2xl font-bold text-orange-400 mb-4">{story.growth}</div>
                <p className="text-gray-300 text-sm leading-relaxed">{story.story}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Complete Business Management Platform
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Our comprehensive dashboard gives you everything you need to manage your business,
              from product listings to order fulfillment and performance analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: ShoppingBagIcon,
                title: 'Product Management',
                description: 'Upload products with our 17-field system. Sync existing catalogs from Shopify, BigCommerce, or WooCommerce stores.',
                features: ['Bulk product upload', 'Store synchronization', 'Variant management', 'Pricing tiers']
              },
              {
                icon: TruckIcon,
                title: 'Order Fulfillment',
                description: 'Receive orders from multiple channels. Track shipments with integrated TrackShip system and real-time updates.',
                features: ['Multi-store orders', 'Shipment tracking', 'Customer notifications', 'Status management']
              },
              {
                icon: CurrencyDollarIcon,
                title: 'Revenue Analytics',
                description: 'Monitor performance with comprehensive analytics. Track commissions, order metrics, and business growth.',
                features: ['Commission tracking', 'Performance metrics', 'Revenue reports', 'Growth analytics']
              },
              {
                icon: UserGroupIcon,
                title: 'Customer Approvals',
                description: 'Streamlined proof approval system. Customers approve designs via email before production begins.',
                features: ['Design proof system', 'Email approvals', 'Production tracking', 'Revision management']
              },
              {
                icon: GlobeAltIcon,
                title: 'Multi-Store Integration',
                description: 'Connect your existing e-commerce stores. Automatic order sync from Shopify, BigCommerce, and WooCommerce.',
                features: ['Store connectivity', 'Auto synchronization', 'Order routing', 'Inventory management']
              },
              {
                icon: ChartBarIcon,
                title: 'Business Intelligence',
                description: 'Advanced analytics dashboard with KPIs, performance tracking, and business insights.',
                features: ['Real-time metrics', 'Vendor performance', 'Market insights', 'Trend analysis']
              }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-600 rounded-lg mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300 mb-4 leading-relaxed">{feature.description}</p>
                <ul className="space-y-1">
                  {feature.features.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-sm text-gray-400 flex items-center">
                      <CheckCircleIcon className="h-3 w-3 text-orange-500 mr-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-20 bg-gradient-to-r from-orange-600 to-red-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Scale Your Business?
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Join our exclusive network of premium smoke accessories suppliers.
            Limited spots available for qualified manufacturers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-orange-600 bg-white hover:bg-gray-100 transition-colors shadow-lg"
            >
              Apply for Partnership
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
            <a
              href="mailto:partnerships@munchmakers.com"
              className="inline-flex items-center px-8 py-4 border border-white text-lg font-medium rounded-md text-white bg-transparent hover:bg-white hover:text-orange-600 transition-colors"
            >
              <PhoneIcon className="mr-2 h-5 w-5" />
              Speak with Partner Manager
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-white">500+</div>
              <div className="text-orange-200">Premium Buyers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">$2M+</div>
              <div className="text-orange-200">Orders Processed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">15%</div>
              <div className="text-orange-200">Avg Commission Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <img
                  className="h-8 w-auto"
                  src="https://cdn11.bigcommerce.com/s-tqjrceegho/images/stencil/500w/munchmakers-logo_1_1752112946__55141.original.png"
                  alt="MunchMakers"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
                <span className="ml-3 text-lg font-semibold">MunchMakers Supplier Network</span>
              </div>
              <p className="text-gray-400 mb-4">
                Connecting premium smoke accessories suppliers with high-end retailers and brands worldwide.
              </p>
              <div className="flex space-x-4">
                <a href="mailto:partnerships@munchmakers.com" className="text-gray-400 hover:text-white">
                  partnerships@munchmakers.com
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">For Suppliers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/register" className="hover:text-white">Join Network</Link></li>
                <li><Link to="/login" className="hover:text-white">Supplier Login</Link></li>
                <li><Link to="/vendor-agreement" className="hover:text-white">Partnership Terms</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link to="/vendor-agreement" className="hover:text-white">Vendor Agreement</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 MunchMakers. All rights reserved. | Connecting premium suppliers with premium buyers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VendorLandingPage;