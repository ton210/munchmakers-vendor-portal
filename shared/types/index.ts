// Shared TypeScript types for both frontend and backend

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorUser extends User {
  vendorId: number;
  vendor?: Vendor;
}

export interface AdminUser extends User {
  permissions: string[];
}

export interface Vendor {
  id: number;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  address?: string;
  taxId?: string;
  status: VendorStatus;
  notes?: string;
  approvedAt?: string;
  approvedBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  vendorId: number;
  sku: string;
  name: string;
  description?: string;
  categoryId?: number;
  status: ProductStatus;
  basePrice?: number;
  moq: number;
  productionTime?: number;
  weight?: number;
  dimensions?: string;
  brand?: string;
  material?: string;
  attributes?: Record<string, any>;
  seoData?: SEOData;
  internalNotes?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: number;
  bigcommerceId?: number;
  createdAt: string;
  updatedAt: string;
  // Relations
  vendor?: Vendor;
  category?: ProductCategory;
  images?: ProductImage[];
  variants?: ProductVariant[];
  pricingTiers?: ProductPricingTier[];
  customizations?: ProductCustomization[];
  latestReview?: ProductReview;
}

export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  altText?: string;
  isPrimary: boolean;
  displayOrder: number;
  fileName: string;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  parentId?: number;
  slug: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  // Relations
  children?: ProductCategory[];
  parent?: ProductCategory;
  productCount?: number;
}

export interface ProductVariant {
  id: number;
  productId: number;
  variantName: string;
  variantSku?: string;
  additionalPrice: number;
  stockQuantity: number;
  attributes?: Record<string, any>;
  isActive: boolean;
  bigcommerceVariantId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPricingTier {
  id: number;
  productId: number;
  minQuantity: number;
  maxQuantity?: number;
  unitPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCustomization {
  id: number;
  productId: number;
  customizationType: CustomizationType;
  options?: Record<string, any>;
  additionalCost: number;
  setupTime?: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductReview {
  id: number;
  productId: number;
  reviewerId: number;
  status: ReviewStatus;
  feedbackMessage?: string;
  internalNotes?: string;
  revisionRequests?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  // Relations
  reviewer?: AdminUser;
}

export interface ActivityLog {
  id: number;
  userId?: number;
  userType: UserType;
  action: string;
  entityType?: string;
  entityId?: number;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  // Computed fields
  userName?: string;
  userEmail?: string;
}

export interface VendorDocument {
  id: number;
  vendorId: number;
  documentType: DocumentType;
  documentName: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  status: DocumentStatus;
  rejectionReason?: string;
  reviewedBy?: number;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Enums
export type UserRole = 'owner' | 'manager' | 'employee' | 'super_admin' | 'admin' | 'reviewer';
export type UserType = 'vendor' | 'admin';
export type VendorStatus = 'pending' | 'approved' | 'suspended' | 'rejected';
export type ProductStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'needs_revision';
export type CustomizationType = 'embroidery' | 'printing' | 'engraving' | 'embossing' | 'other';
export type DocumentType = 'tax_certificate' | 'business_license' | 'insurance' | 'bank_details' | 'other';
export type DocumentStatus = 'pending' | 'approved' | 'rejected';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

// Utility Types
export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
}

export interface DashboardStats {
  vendors?: {
    total: number;
    pending: number;
    approved: number;
    suspended: number;
  };
  products?: {
    total: number;
    draft: number;
    pendingReview: number;
    approved: number;
    rejected: number;
  };
  activity?: {
    totalActivities: number;
    vendorActivities: number;
    adminActivities: number;
    logins: number;
  };
}

export interface VendorStats {
  totalProducts: number;
  draftProducts: number;
  pendingProducts: number;
  approvedProducts: number;
  rejectedProducts: number;
  avgPrice?: number;
}

export interface ImageUploadResult {
  fileName: string;
  publicUrl: string;
  size: number;
  contentType: string;
}

export interface CSVImportResult {
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    data: any;
    error: string;
  }>;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
  userType?: 'vendor' | 'admin';
}

export interface VendorRegistrationData {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  address?: string;
  taxId?: string;
  user: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  };
}

export interface ProductFormData {
  name: string;
  sku: string;
  description?: string;
  categoryId?: number;
  basePrice?: number;
  moq: number;
  productionTime?: number;
  weight?: number;
  dimensions?: string;
  brand?: string;
  material?: string;
  attributes?: Record<string, any>;
  seoData?: SEOData;
}

// Filter Types
export interface ProductFilters {
  status?: ProductStatus;
  vendorId?: number;
  categoryId?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface VendorFilters {
  status?: VendorStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ActivityFilters {
  userType?: UserType;
  userId?: number;
  action?: string;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
}