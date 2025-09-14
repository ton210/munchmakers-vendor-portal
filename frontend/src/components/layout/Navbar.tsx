import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { 
  BellIcon, 
  ChevronDownIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon as LogoutIcon,
  CogIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { clsx } from 'clsx';

interface NavbarProps {
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title }) => {
  const { user, logout, isVendor } = useAuth();

  const getUserDisplayName = (): string => {
    if (!user) return 'User';
    if ('contactName' in user) return (user as any).contactName || 'User';
    return (user as any).name || user.email || 'User';
  };

  const getUserRole = (): string => {
    if (!user) return '';
    if (isVendor()) {
      const vendorUser = user as any;
      return vendorUser.vendor?.businessName || 'Vendor';
    }
    return 'Administrator';
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Title */}
          <div className="flex items-center">
            <img 
              src="https://cdn11.bigcommerce.com/s-tqjrceegho/images/stencil/500w/munchmakers-logo_1_1752112946__55141.original.png" 
              alt="MunchMakers" 
              className="h-8 w-auto"
            />
            {title && (
              <>
                <div className="hidden sm:block mx-4 h-6 w-px bg-gray-200" />
                <h1 className="hidden sm:block text-xl font-semibold text-gray-900">
                  {title}
                </h1>
              </>
            )}
          </div>

          {/* Right side - User menu and notifications */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-full"
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* User menu dropdown */}
            <Menu as="div" className="relative">
              <div>
                <Menu.Button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <span className="sr-only">Open user menu</span>
                  <div className="flex items-center space-x-3">
                    <UserCircleIcon className="h-8 w-8 text-gray-400" />
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-gray-900">
                        {getUserDisplayName()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getUserRole()}
                      </div>
                    </div>
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                  </div>
                </Menu.Button>
              </div>
              
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="#"
                        className={clsx(
                          active ? 'bg-gray-100' : '',
                          'flex items-center px-4 py-2 text-sm text-gray-700'
                        )}
                      >
                        <UserIcon className="mr-3 h-4 w-4" />
                        Your Profile
                      </a>
                    )}
                  </Menu.Item>
                  
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="#"
                        className={clsx(
                          active ? 'bg-gray-100' : '',
                          'flex items-center px-4 py-2 text-sm text-gray-700'
                        )}
                      >
                        <CogIcon className="mr-3 h-4 w-4" />
                        Settings
                      </a>
                    )}
                  </Menu.Item>
                  
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={logout}
                        className={clsx(
                          active ? 'bg-gray-100' : '',
                          'flex items-center w-full px-4 py-2 text-sm text-gray-700'
                        )}
                      >
                        <LogoutIcon className="mr-3 h-4 w-4" />
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </nav>
  );
};