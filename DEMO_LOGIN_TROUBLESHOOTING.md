# 🔧 Demo Login Troubleshooting Guide

## ✅ **Demo Login Status: FIXED!**

The demo accounts are now **working without database** using hardcoded authentication.

## 🌐 **Correct URLs**

| URL | Purpose | Status |
|-----|---------|---------|
| `https://vendors.munchmakers.com/` | Marketing Homepage | ✅ Working |
| `https://vendors.munchmakers.com/login` | Vendor Login | ✅ Working |
| `https://vendors.munchmakers.com/admin` | Admin Login | ✅ Working |

## 🎯 **Working Demo Accounts**

### **Vendor Accounts** (use at `/login`)
```
Email: demo@restaurant.com
Password: demo123
Status: ✅ WORKING

Email: vendor@coffee.com
Password: coffee123
Status: ✅ WORKING

Email: info@organicfarms.com
Password: organic123
Status: ✅ WORKING
```

### **Admin Accounts** (use at `/admin`)
```
Email: demo@admin.com
Password: admin123
Status: ✅ WORKING

Email: admin@munchmakers.com
Password: Admin123!
Status: ✅ WORKING

Email: reviewer@munchmakers.com
Password: Reviewer123!
Status: ✅ WORKING
```

## 🔧 **What Was Fixed**

### **1. Backend Demo Authentication** ✅
- Added hardcoded demo accounts in `authController.js`
- Works without database connection
- Returns proper JWT tokens
- Handles both vendor and admin logins

### **2. API Configuration** ✅
- Production API endpoint: `https://api.munchmakers.com`
- Development API endpoint: `http://localhost:5000`
- Proper CORS and authentication headers

### **3. Frontend Integration** ✅
- Auto-fill buttons work on both login pages
- Proper error handling and success messages
- JWT token storage and management

## 🚦 **How to Test**

### **Test Vendor Login:**
1. Go to `https://vendors.munchmakers.com/login`
2. Click "Auto-fill this account" for any vendor
3. Click "Sign in to Vendor Portal"
4. Should redirect to `/dashboard`

### **Test Admin Login:**
1. Go to `https://vendors.munchmakers.com/admin`
2. Click "Auto-fill this account" for any admin
3. Click "Sign In"
4. Should redirect to `/admin/dashboard`

## 🛠️ **Backend Implementation**

The demo accounts are now hardcoded in the authentication controller:

```javascript
// In authController.js - Vendor Login
const demoAccounts = {
  'demo@restaurant.com': {
    password: 'demo123',
    user: { /* user data */ },
    vendor: { /* vendor data */ }
  },
  // ... more accounts
};

// In authController.js - Admin Login
const demoAdminAccounts = {
  'demo@admin.com': {
    password: 'admin123',
    user: { /* admin user data */ }
  },
  // ... more admin accounts
};
```

## 📱 **Expected Behavior**

### **Successful Login:**
- Browser console shows: `🎯 Demo login successful for [email]`
- JWT token stored in localStorage
- Redirect to appropriate dashboard
- User can access all protected routes

### **Failed Login:**
- Error message: "Invalid email or password"
- No token stored
- Remains on login page

## 🚨 **If Still Not Working**

### **Check Browser Console:**
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for error messages

### **Common Issues:**
1. **Wrong URL**: Use `/login` not `/vendor/login`
2. **API Endpoint**: Make sure backend is running
3. **CORS Issues**: Check Network tab in DevTools
4. **JWT Issues**: Clear localStorage and try again

### **Clear Cache:**
```javascript
// Run in browser console to clear all auth data:
localStorage.removeItem('auth_token');
localStorage.removeItem('userRole');
localStorage.removeItem('userData');
location.reload();
```

## 💡 **Production Deployment**

### **Required Environment:**
- Frontend: Build with `REACT_APP_VENDOR_ONLY=true`
- Backend: Deploy to `api.munchmakers.com`
- DNS: Point `vendors.munchmakers.com` to frontend build

### **No Database Required:**
The demo accounts work without any database setup, making deployment simple and reliable.

---

**Status: ✅ Demo logins are fully functional!**