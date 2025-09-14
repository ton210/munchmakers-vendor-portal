import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  UserGroupIcon,
  ChartBarIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const LandingPage: React.FC = () => {
  const features = [
    {
      name: 'Effortless Product Upload',
      description: 'Upload your entire catalog with our advanced CSV bulk upload system. No technical skills required.',
      icon: CloudArrowUpIcon,
    },
    {
      name: 'Access Premium Buyers Network',
      description: 'Connect directly with our curated network of US and European buyers actively seeking new products.',
      icon: UserGroupIcon,
    },
    {
      name: 'Professional Setup & Design',
      description: 'We handle all the technical setup and design work. Your products will look professional from day one.',
      icon: ShieldCheckIcon,
    },
    {
      name: 'Marketing & Promotion',
      description: 'Our marketing team promotes your products across multiple channels to maximize visibility.',
      icon: ChartBarIcon,
    },
    {
      name: 'Deal Closing Support',
      description: 'We manage the entire sales process and help close deals, so you can focus on your business.',
      icon: GlobeAltIcon,
    },
    {
      name: 'Beta Exclusivity',
      description: 'Limited to a select group of invited vendors. Join an exclusive program with personalized attention.',
      icon: ClockIcon,
    },
  ];

  const stats = [
    { id: 1, name: 'Active Buyers', value: '500+' },
    { id: 2, name: 'Product Categories', value: '50+' },
    { id: 3, name: 'Countries Served', value: '25+' },
    { id: 4, name: 'Beta Vendors', value: 'Limited' },
  ];

  return (
    <div className="bg-white">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <Link to="/" className="-m-1.5 p-1.5">
              <img
                className="h-8 w-auto"
                src="https://cdn11.bigcommerce.com/s-tqjrceegho/images/stencil/500w/munchmakers-logo_1_1752112946__55141.original.png"
                alt="MunchMakers"
              />
            </Link>
          </div>
          <div className="flex lg:flex-1 lg:justify-end">
            <Link
              to="/vendor/login"
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-indigo-600"
            >
              Vendor Login <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>

        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
              Exclusive Beta Program - Limited Invitations Only{' '}
              <Link to="/register" className="font-semibold text-primary-600">
                <span className="absolute inset-0" aria-hidden="true" />
                Apply Now <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Join the MunchMakers Vendor Network
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Connect with premium buyers across the US and Europe. We handle everything from setup to sales,
              so you can focus on what you do best - creating amazing products.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/register"
                className="rounded-lg bg-primary-500 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 transition-all duration-200 hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Apply for Beta Access
              </Link>
              <Link to="/docs" className="text-sm font-semibold leading-6 text-gray-900">
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>

        <div
          className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
      </div>

      {/* Feature section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">Everything Included</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            We Handle Everything So You Don't Have To
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Focus on your products while we take care of the technical setup, marketing, and sales process.
            Our comprehensive platform is designed for vendors who want results without the complexity.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500 shadow-md">
                    <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Stats section */}
      <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-40 lg:px-8">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Join Our Exclusive Network
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Connect with a curated network of buyers actively seeking quality products
            </p>
          </div>
          <dl className="mt-16 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.id} className="flex flex-col bg-gray-400/5 p-8">
                <dt className="text-sm font-semibold leading-6 text-gray-600">{stat.name}</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* CTA section */}
      <div className="mx-auto mt-32 max-w-7xl sm:mt-40 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden bg-gray-900 px-6 py-24 text-center shadow-2xl sm:rounded-3xl sm:px-16">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to Join Our Beta Program?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
            Limited spots available. Apply now to be considered for our exclusive vendor beta program
            and start selling to premium buyers across the US and Europe.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              to="/register"
              className="rounded-lg bg-white px-6 py-3 text-base font-semibold text-gray-900 shadow-lg hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all duration-200 hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Apply for Beta Access
            </Link>
            <Link to="/docs" className="text-sm font-semibold leading-6 text-white">
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
          <svg
            viewBox="0 0 1024 1024"
            className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]"
            aria-hidden="true"
          >
            <circle cx={512} cy={512} r={512} fill="url(#827591b1-ce8c-4110-b064-7cb85a0b1217)" fillOpacity="0.7" />
            <defs>
              <radialGradient id="827591b1-ce8c-4110-b064-7cb85a0b1217">
                <stop stopColor="#7775D6" />
                <stop offset={1} stopColor="#E935C1" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Footer */}
      <footer className="mx-auto mt-32 max-w-7xl px-6 lg:px-8">
        <div className="border-t border-gray-900/10 py-16 sm:py-24 lg:py-32">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <img
              className="h-7"
              src="https://cdn11.bigcommerce.com/s-tqjrceegho/images/stencil/500w/munchmakers-logo_1_1752112946__55141.original.png"
              alt="MunchMakers"
            />
            <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold leading-6 text-gray-900">Company</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li>
                      <Link to="/about" className="text-sm leading-6 text-gray-600 hover:text-gray-900">
                        About
                      </Link>
                    </li>
                    <li>
                      <Link to="/docs" className="text-sm leading-6 text-gray-600 hover:text-gray-900">
                        Documentation
                      </Link>
                    </li>
                    <li>
                      <Link to="/contact" className="text-sm leading-6 text-gray-600 hover:text-gray-900">
                        Contact
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="mt-10 md:mt-0">
                  <h3 className="text-sm font-semibold leading-6 text-gray-900">Support</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li>
                      <Link to="/help" className="text-sm leading-6 text-gray-600 hover:text-gray-900">
                        Help Center
                      </Link>
                    </li>
                    <li>
                      <Link to="/faq" className="text-sm leading-6 text-gray-600 hover:text-gray-900">
                        FAQ
                      </Link>
                    </li>
                    <li>
                      <Link to="/status" className="text-sm leading-6 text-gray-600 hover:text-gray-900">
                        System Status
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold leading-6 text-gray-900">Legal</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li>
                      <Link to="/privacy" className="text-sm leading-6 text-gray-600 hover:text-gray-900">
                        Privacy Policy
                      </Link>
                    </li>
                    <li>
                      <Link to="/terms" className="text-sm leading-6 text-gray-600 hover:text-gray-900">
                        Terms of Service
                      </Link>
                    </li>
                    <li>
                      <Link to="/vendor-agreement" className="text-sm leading-6 text-gray-600 hover:text-gray-900">
                        Vendor Agreement
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-16 border-t border-gray-900/10 pt-8 sm:mt-20 lg:mt-24">
            <p className="text-xs leading-5 text-gray-500">
              &copy; 2025 MunchMakers Vendor Portal. All rights reserved. This is a beta program with limited access.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;