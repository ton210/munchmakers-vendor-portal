import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  Squares2X2Icon,
  ShoppingBagIcon,
  UsersIcon,
  CogIcon,
  ChartBarIcon,
  DocumentTextIcon,
  TagIcon,
  CheckCircleIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { clsx } from 'clsx';

interface NavItem {
  name: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  adminOnly?: boolean;
  vendorOnly?: boolean;
}

const navigation: NavItem[] = [
  // Vendor routes
  { 
    name: 'Dashboard', 
    to: '/dashboard', 
    icon: HomeIcon, 
    vendorOnly: true 
  },
  { 
    name: 'Products', 
    to: '/products', 
    icon: ShoppingBagIcon, 
    vendorOnly: true 
  },
  { 
    name: 'Orders', 
    to: '/orders', 
    icon: DocumentTextIcon, 
    vendorOnly: true 
  },
  {
    name: 'Profile',
    to: '/profile',
    icon: TagIcon,
    vendorOnly: true
  },
  {
    name: 'Financials',
    to: '/financials',
    icon: CurrencyDollarIcon,
    vendorOnly: true
  },
  {
    name: 'Messages',
    to: '/messages',
    icon: ChatBubbleLeftIcon,
    vendorOnly: true
  },
  
  // Admin routes
  {
    name: 'Admin Dashboard',
    to: '/admin/dashboard',
    icon: ChartBarIcon,
    adminOnly: true
  },
  { 
    name: 'Vendors', 
    to: '/admin/vendors', 
    icon: UsersIcon, 
    adminOnly: true 
  },
  { 
    name: 'Products', 
    to: '/admin/products', 
    icon: Squares2X2Icon, 
    adminOnly: true 
  },
  { 
    name: 'Pending Approval', 
    to: '/admin/pending', 
    icon: ClockIcon, 
    adminOnly: true,
    badge: '3'
  },
  { 
    name: 'Categories', 
    to: '/admin/categories', 
    icon: TagIcon, 
    adminOnly: true 
  },
];

const settingsNavigation: NavItem[] = [
  { name: 'Settings', to: '/admin/settings', icon: CogIcon },
  { name: 'API Testing', to: '/admin/api-test', icon: WrenchScrewdriverIcon, adminOnly: true },
];

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { isAdmin, isVendor } = useAuth();

  const filterNavigation = (items: NavItem[]) => {
    return items.filter(item => {
      if (item.adminOnly && !isAdmin()) return false;
      if (item.vendorOnly && !isVendor()) return false;
      return true;
    });
  };

  const filteredNavigation = filterNavigation(navigation);
  const filteredSettingsNavigation = filterNavigation(settingsNavigation);

  const NavItem: React.FC<{ item: NavItem }> = ({ item }) => (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        clsx(
          isActive
            ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
            : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900',
          'group flex items-center px-3 py-2 text-sm font-medium border-l-4 transition-colors duration-150'
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon
            className={clsx(
              isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500',
              'mr-3 h-5 w-5 transition-colors duration-150'
            )}
          />
          <span className="truncate">{item.name}</span>
          {item.badge && (
            <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-red-100 text-red-800">
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <div className={clsx('flex flex-col h-full bg-white border-r border-gray-200', className)}>
      {/* Main navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {filteredNavigation.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
      </nav>

      {/* Settings section */}
      {filteredSettingsNavigation.length > 0 && (
        <div className="border-t border-gray-200">
          <nav className="px-2 py-4 space-y-1">
            {filteredSettingsNavigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
          <div>
            <div className="text-xs font-medium text-gray-900">System Status</div>
            <div className="text-xs text-gray-500">All systems operational</div>
          </div>
        </div>
      </div>
    </div>
  );
};