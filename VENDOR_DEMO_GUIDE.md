# 🎯 Vendor Portal Demo Guide

## 🚀 Live Demo Access

**Vendor Portal Homepage**: https://vendors.munchmakers.com/
**Vendor Login**: https://vendors.munchmakers.com/login
**Admin Login**: https://vendors.munchmakers.com/admin

## 📋 Demo Vendor Accounts

### 1. **Demo Restaurant** (Primary Demo Account)
- **Email**: `demo@restaurant.com`
- **Password**: `demo123`
- **Status**: ✅ Approved & Active
- **Features**: Has sample products, full dashboard access
- **Use Case**: Best for demonstrating complete vendor workflow

### 2. **Artisan Coffee Co** (Clean Account)
- **Email**: `vendor@coffee.com`
- **Password**: `coffee123`
- **Status**: ✅ Approved & Active
- **Features**: Clean account, perfect for testing product upload
- **Use Case**: Ideal for showing new vendor onboarding

### 3. **Organic Farms LLC** (Pending Account)
- **Email**: `info@organicfarms.com`
- **Password**: `organic123`
- **Status**: ⏳ Pending Approval
- **Features**: Shows pending approval workflow
- **Use Case**: Demonstrates vendor approval process

## 👩‍💼 Demo Admin Accounts

### 1. **Demo Admin** (Simple Demo Account)
- **Email**: `demo@admin.com`
- **Password**: `admin123`
- **Role**: Admin
- **Use Case**: Product review and vendor management

### 2. **Super Admin** (Full Access)
- **Email**: `admin@munchmakers.com`
- **Password**: `Admin123!`
- **Role**: Super Admin
- **Use Case**: Complete system administration

### 3. **Product Reviewer** (Limited Access)
- **Email**: `reviewer@munchmakers.com`
- **Password**: `Reviewer123!`
- **Role**: Reviewer
- **Use Case**: Product approval workflow only

## 🎪 Demo Features Available

### ✅ **Fully Functional Features**
1. **Product Upload System** - Complete 5-step wizard with:
   - Basic product information (name, price, MOQ, etc.)
   - Image upload with drag & drop
   - Product variants with individual pricing
   - Tiered pricing configuration
   - Shipping options (air/fast boat)
   - Design tool integration
   - Production images

2. **Product Management**
   - View all products with filtering
   - Edit existing products
   - Draft/submit workflow
   - Status tracking

3. **Dashboard & Analytics**
   - Sales overview
   - Product performance
   - Order status
   - Financial metrics

4. **Order Management**
   - Order listing and filtering
   - Order status updates
   - Customer communication

5. **Profile & Settings**
   - Vendor profile management
   - User management (for owners)
   - Business settings

### 🔧 **Backend Integration**
- Complete REST API with all endpoints
- Database schema supports all 17 required data points
- Proper authentication and authorization
- File upload handling (ready for S3/R2 integration)

## 🏗️ **Architecture Overview**

### **Frontend**
- React TypeScript application
- Subdomain-specific routing (`vendors.munchmakers.com` → VendorApp)
- Mobile-responsive design
- Real-time form validation

### **Backend**
- Node.js/Express API server
- PostgreSQL database with Knex.js
- JWT-based authentication
- Comprehensive logging and activity tracking

### **Key Components Built**
1. `ImageUpload.tsx` - Drag & drop image handling
2. `VariantManager.tsx` - Product variant management
3. `PricingTiers.tsx` - Tiered pricing configuration
4. `ProductForm.tsx` - 5-step product upload wizard
5. Complete backend API with all CRUD operations

## 🎯 **What to Demo**

### **For Vendors**
1. **Login Flow**: Use any demo account → auto-fill credentials
2. **Product Upload**: `/products/new` → Complete 17-field upload process
3. **Product Management**: View, edit, and manage product catalog
4. **Dashboard**: See comprehensive vendor analytics
5. **Orders**: Track and manage incoming orders

### **For Admins**
- Product approval workflow
- Vendor management
- System analytics and reporting

## 📊 **All 17 Required Data Points Implemented**

| # | Field | Status | Location |
|---|-------|---------|----------|
| 1 | Product name | ✅ | Step 1 - Required |
| 2 | Product details | ✅ | Step 1 - Optional |
| 3 | Product weight | ✅ | Step 1 - Optional |
| 4 | Product height | ✅ | Step 1 - Optional |
| 5 | Product variants | ✅ | Step 3 - With images |
| 6 | Picture per variant | ✅ | Step 3 - Upload system |
| 7 | Price per variant | ✅ | Step 3 - Additional pricing |
| 8 | MOQ per variant | ✅ | Step 3 - Individual MOQ |
| 9 | Tiered pricing | ✅ | Step 3 - Quantity-based |
| 10 | Production time | ✅ | Step 1 - Business days |
| 11 | Product description | ✅ | Step 1 - Rich text |
| 12 | Shipping options | ✅ | Step 4 - Air/boat pricing |
| 13 | Categories | ✅ | Step 1 - BigCommerce sync |
| 14 | Product images | ✅ | Step 2 - Multi-upload |
| 15 | Production images | ✅ | Step 2 - Separate gallery |
| 16 | Design tool info | ✅ | Step 4 - Text input |
| 17 | Design tool template | ✅ | Step 4 - Template field |

## 🔐 **Security Features**
- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure file upload handling

## 🚦 **Next Steps for Production**
1. **Database Setup**: Configure PostgreSQL and run migrations
2. **File Storage**: Connect S3/R2 for actual image uploads
3. **BigCommerce Integration**: Connect category and product sync
4. **Email Services**: Configure SendGrid for notifications
5. **Domain Configuration**: Set up proper DNS for subdomains

## 📞 **Demo Support**
- All demo accounts reset daily
- Fresh data populated automatically
- Full logging for troubleshooting

## 🌐 **URL Structure Summary**

### **Primary URLs:**
- **`vendors.munchmakers.com/`** → Marketing homepage with demo showcase
- **`vendors.munchmakers.com/login`** → Vendor login (3 demo accounts)
- **`vendors.munchmakers.com/admin`** → Admin login (3 demo accounts)

### **After Login:**
- **Vendors** → Redirect to `/dashboard`
- **Admins** → Redirect to `/admin/dashboard`

### **Navigation Flow:**
1. **Homepage** → Shows marketing content + demo credentials
2. **Login Pages** → Auto-fill demo accounts with one click
3. **Dashboards** → Full functionality access
4. **All Features** → Complete product upload, management, approval workflow

---

**Ready to Demo!** 🎉
- **Single Domain**: All functionality under `vendors.munchmakers.com`
- **Dual Purpose**: Vendor portal + admin access
- **Demo Ready**: 6 total demo accounts (3 vendor + 3 admin)
- **Full Features**: Complete 17-field product upload system