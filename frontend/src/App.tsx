import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicRoute } from './components/auth/PublicRoute';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import VendorLoginPage from './pages/auth/VendorLoginPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Vendor Pages
import VendorDashboard from './pages/vendor/VendorDashboard';
import { ProductsPage } from './pages/vendor/ProductsPage';
import { OrdersPage } from './pages/vendor/OrdersPage';
import BulkUploadPage from './pages/vendor/BulkUploadPage';
import VendorProfile from './pages/vendor/Profile';
import VendorUsers from './pages/vendor/Users';
import ProductForm from './pages/vendor/ProductForm';
import ProductDetails from './pages/vendor/ProductDetails';
import FinancialDashboard from './pages/vendor/FinancialDashboard';
import MessagesPage from './pages/vendor/MessagesPage';
import AssignmentsPage from './pages/vendor/AssignmentsPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import { VendorsPage } from './pages/admin/VendorsPage';
import { ProductsPage as AdminProductsPage } from './pages/admin/ProductsPage';
import { CategoriesPage } from './pages/admin/CategoriesPage';
import AdminUsers from './pages/admin/Users';
import AdminReports from './pages/admin/Reports';
import AdminActivityLogs from './pages/admin/ActivityLogs';
import SettingsPage from './pages/admin/SettingsPage';
import APITestPage from './pages/admin/APITestPage';
import VendorDetails from './pages/admin/VendorDetails';
import AdminOrdersPage from './pages/admin/OrdersPage';
import StoreConfigPage from './pages/admin/StoreConfigPage';

// Public Pages
import LandingPage from './pages/LandingPage';
import DocsPage from './pages/docs/DocsPage';
import PrivacyPage from './pages/legal/PrivacyPage';
import TermsPage from './pages/legal/TermsPage';
import VendorAgreementPage from './pages/legal/VendorAgreementPage';

// Shared Pages
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

function App() {
  console.log('🔍 App.tsx loaded, setting up routes...');
  
  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Public Routes */}
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/vendor-agreement" element={<VendorAgreementPage />} />

            {/* Auth Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/vendor/login"
              element={
                <PublicRoute>
                  <VendorLoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/admin"
              element={<AdminLoginPage />}
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPasswordPage />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <ResetPasswordPage />
                </PublicRoute>
              }
            />

            {/* Vendor Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredUserType="vendor">
                  <VendorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute requiredUserType="vendor">
                  <ProductsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments"
              element={
                <ProtectedRoute requiredUserType="vendor">
                  <AssignmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/new"
              element={
                <ProtectedRoute requiredUserType="vendor" requireApproved>
                  <ProductForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/bulk-upload"
              element={
                <ProtectedRoute requiredUserType="vendor" requireApproved>
                  <BulkUploadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/:id"
              element={
                <ProtectedRoute requiredUserType="vendor">
                  <ProductDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/:id/edit"
              element={
                <ProtectedRoute requiredUserType="vendor">
                  <ProductForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute requiredUserType="vendor">
                  <VendorProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute requiredUserType="vendor" requiredRole="owner">
                  <VendorUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financials"
              element={
                <ProtectedRoute requiredUserType="vendor">
                  <FinancialDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute requiredUserType="vendor">
                  <MessagesPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredUserType="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/vendors"
              element={
                <ProtectedRoute requiredUserType="admin">
                  <VendorsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/vendors/:id"
              element={
                <ProtectedRoute requiredUserType="admin">
                  <VendorDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute requiredUserType="admin">
                  <AdminProductsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute requiredUserType="admin">
                  <AdminOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/stores"
              element={
                <ProtectedRoute requiredUserType="admin">
                  <StoreConfigPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute requiredUserType="admin">
                  <CategoriesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredUserType="admin" requiredPermission="manage_admins">
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute requiredUserType="admin">
                  <AdminReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/activity"
              element={
                <ProtectedRoute requiredUserType="admin">
                  <AdminActivityLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute requiredUserType="admin">
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/api-test"
              element={
                <ProtectedRoute requiredUserType="admin">
                  <APITestPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pending"
              element={
                <ProtectedRoute requiredUserType="admin">
                  <VendorsPage />
                </ProtectedRoute>
              }
            />

            {/* Utility Routes */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/404" element={<NotFoundPage />} />
            
            {/* Default Redirects - Handled by landing page route above */}
            
            {/* Catch all - 404 */}
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;