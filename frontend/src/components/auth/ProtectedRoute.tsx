import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: 'vendor' | 'admin';
  requiredRole?: string;
  requiredPermission?: string;
  requireApproved?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredUserType,
  requiredRole,
  requiredPermission,
  requireApproved = false,
}) => {
  const { 
    isAuthenticated, 
    isLoading, 
    isAdmin, 
    isVendor, 
    isApprovedVendor,
    checkPermission,
    hasRole 
  } = useAuth();

  console.log('🔍 ProtectedRoute check:', {
    isAuthenticated,
    isLoading,
    isAdmin: isAdmin(),
    isVendor: isVendor(),
    requiredUserType,
    path: window.location.pathname
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check user type
  if (requiredUserType === 'admin' && !isAdmin()) {
    console.log('❌ Admin required but user is not admin, redirecting to unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredUserType === 'vendor' && !isVendor()) {
    console.log('❌ Vendor required but user is not vendor, redirecting to unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }

  // Check if vendor needs to be approved
  if (requireApproved && isVendor() && !isApprovedVendor()) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check specific role
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check specific permission
  if (requiredPermission && !checkPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('✅ All auth checks passed, rendering component');
  
  try {
    return <>{children}</>;
  } catch (error) {
    console.error('❌ Component rendering error:', error);
    return <Navigate to="/404" replace />;
  }
};