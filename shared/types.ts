export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorUser extends User {
  vendorId: number;
  role: 'vendor_admin' | 'vendor_user';
  vendor?: Vendor;
}

export interface AdminUser extends User {
  role: 'admin' | 'super_admin';
  permissions: string[];
}

export interface Vendor {
  id: number;
  businessName: string;
  contactEmail: string;
  contactName: string;
  phone: string;
  businessAddress: string;
  businessType: string;
  website?: string;
  taxId: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  bigcommerceStoreHash?: string;
  bigcommerceAccessToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  vendorId: number;
  name: string;
  description: string;
  sku: string;
  price: number;
  comparePrice?: number;
  categoryId: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  bigcommerceProductId?: number;
  bigcommerceCategoryId?: number;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  vendor?: Vendor;
  category?: ProductCategory;
  images?: ProductImage[];
}

export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  bigcommerceCategoryId?: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  parent?: ProductCategory;
  children?: ProductCategory[];
}

export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  altText?: string;
  sortOrder: number;
  bigcommerceImageId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoginFormData {
  email: string;
  password: string;
  userType: 'admin' | 'vendor';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  data: {
    items: T[];
    pagination: {
      total: number;
      pages: number;
      page: number;
      limit: number;
    };
  };
}

export interface DashboardStats {
  totalVendors: number;
  pendingVendors: number;
  approvedVendors: number;
  totalProducts: number;
  pendingProducts: number;
  approvedProducts: number;
  recentActivity: ActivityLog[];
}

export interface ActivityLog {
  id: number;
  type: 'vendor_registered' | 'vendor_approved' | 'product_submitted' | 'product_approved';
  description: string;
  userId?: number;
  vendorId?: number;
  productId?: number;
  createdAt: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'file' | 'number';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string; }[];
  validation?: any;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: any) => React.ReactNode;
}