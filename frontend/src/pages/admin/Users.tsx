import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { DataTable, Column } from '../../components/ui/DataTable';
import { 
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  UserIcon,
  EnvelopeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { AdminUser } from '../../types';
import toast from 'react-hot-toast';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: Partial<AdminUser>) => void;
  editUser?: AdminUser | null;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onSubmit, editUser }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'admin' as 'admin' | 'super_admin',
    permissions: [] as string[]
  });

  useEffect(() => {
    if (editUser) {
      setFormData({
        name: editUser.name,
        email: editUser.email,
        role: editUser.role,
        permissions: editUser.permissions || []
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'admin',
        permissions: []
      });
    }
  }, [editUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const availablePermissions = [
    { id: 'manage_vendors', label: 'Manage Vendors' },
    { id: 'manage_products', label: 'Manage Products' },
    { id: 'manage_categories', label: 'Manage Categories' },
    { id: 'manage_admins', label: 'Manage Admin Users' },
    { id: 'view_reports', label: 'View Reports' },
    { id: 'system_settings', label: 'System Settings' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {editUser ? 'Edit Admin User' : 'Create Admin User'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'super_admin' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permissions
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {availablePermissions.map((permission) => (
                <label key={permission.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(permission.id)}
                    onChange={(e) => {
                      const permissions = e.target.checked
                        ? [...formData.permissions, permission.id]
                        : formData.permissions.filter(p => p !== permission.id);
                      setFormData(prev => ({ ...prev, permissions }));
                    }}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{permission.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1">
              {editUser ? 'Update User' : 'Create User'}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Mock data for now - replace with actual API call
      const mockUsers: AdminUser[] = [
        {
          id: 1,
          email: 'admin@munchmakers.com',
          name: 'Super Admin',
          role: 'super_admin',
          permissions: ['manage_vendors', 'manage_products', 'manage_categories', 'manage_admins', 'view_reports', 'system_settings'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          email: 'manager@munchmakers.com',
          name: 'Platform Manager',
          role: 'admin',
          permissions: ['manage_vendors', 'manage_products', 'view_reports'],
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 3,
          email: 'moderator@munchmakers.com',
          name: 'Content Moderator',
          role: 'admin',
          permissions: ['manage_products'],
          createdAt: '2024-02-01T00:00:00Z',
          updatedAt: '2024-02-01T00:00:00Z'
        }
      ];
      
      setUsers(mockUsers);
      setPagination({
        page: 1,
        pages: 1,
        total: mockUsers.length
      });
    } catch (error: any) {
      toast.error('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: Partial<AdminUser>) => {
    try {
      // Mock creation - replace with actual API call
      const newUser: AdminUser = {
        id: users.length + 1,
        email: userData.email!,
        name: userData.name!,
        role: userData.role!,
        permissions: userData.permissions || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setUsers(prev => [...prev, newUser]);
      toast.success('Admin user created successfully');
    } catch (error: any) {
      toast.error('Failed to create admin user');
    }
  };

  const handleEditUser = async (userData: Partial<AdminUser>) => {
    if (!editUser) return;
    
    try {
      // Mock update - replace with actual API call
      const updatedUser: AdminUser = {
        ...editUser,
        ...userData,
        updatedAt: new Date().toISOString()
      };
      
      setUsers(prev => prev.map(u => u.id === editUser.id ? updatedUser : u));
      toast.success('Admin user updated successfully');
      setEditUser(null);
    } catch (error: any) {
      toast.error('Failed to update admin user');
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      return;
    }
    
    try {
      // Mock deletion - replace with actual API call
      setUsers(prev => prev.filter(u => u.id !== user.id));
      toast.success('Admin user deleted successfully');
    } catch (error: any) {
      toast.error('Failed to delete admin user');
    }
  };

  const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
    const roleConfig = {
      super_admin: { color: 'bg-purple-100 text-purple-800', label: 'Super Admin' },
      admin: { color: 'bg-blue-100 text-blue-800', label: 'Admin' }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.admin;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <ShieldCheckIcon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const columns: Column[] = [
    {
      key: 'name',
      label: 'User',
      sortable: true,
      render: (value, item) => (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
            <UserIcon className="h-6 w-6 text-gray-500" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 flex items-center">
              <EnvelopeIcon className="h-3 w-3 mr-1" />
              {item.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      render: (value) => <RoleBadge role={value} />
    },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (value: string[]) => (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 2).map((permission, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-800"
            >
              {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          ))}
          {value.length > 2 && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
              +{value.length - 2} more
            </span>
          )}
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => (
        <div className="text-sm text-gray-900 flex items-center">
          <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
          {new Date(value).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, item) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setEditUser(item);
              setShowCreateModal(true);
            }}
            className="text-indigo-600 hover:text-indigo-900"
            title="Edit user"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          
          {item.role !== 'super_admin' && (
            <button
              onClick={() => handleDeleteUser(item)}
              className="text-red-600 hover:text-red-900"
              title="Delete user"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  const superAdminCount = users.filter(u => u.role === 'super_admin').length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <Layout title="Admin User Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin User Management</h1>
            <p className="text-gray-600 mt-1">Manage admin users and their permissions</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Add Admin User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Admins', value: users.length, color: 'bg-blue-500' },
            { label: 'Super Admins', value: superAdminCount, color: 'bg-purple-500' },
            { label: 'Regular Admins', value: adminCount, color: 'bg-green-500' }
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="flex items-center p-6">
                <div className={`p-3 rounded-full ${stat.color} text-white mr-4`}>
                  <UserIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Security Notice */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <ShieldCheckIcon className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Security Guidelines</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Super Admin users have full system access and cannot be deleted</li>
                  <li>• Regular Admin users can be assigned specific permissions</li>
                  <li>• Always follow the principle of least privilege when assigning permissions</li>
                  <li>• Review user permissions regularly to ensure they align with current responsibilities</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          searchable
          searchPlaceholder="Search admin users..."
          pagination={{
            ...pagination,
            onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
          }}
          emptyMessage="No admin users found."
        />

        {/* Create/Edit User Modal */}
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditUser(null);
          }}
          onSubmit={editUser ? handleEditUser : handleCreateUser}
          editUser={editUser}
        />
      </div>
    </Layout>
  );
};

export default AdminUsers;