import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, VendorUser, AdminUser, LoginFormData, ApiResponse } from '../types';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

interface AuthState {
  user: (VendorUser | AdminUser) | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: VendorUser | AdminUser; token: string } }
  | { type: 'AUTH_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: VendorUser | AdminUser };

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('auth_token'),
  isLoading: false,
  isAuthenticated: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isAuthenticated: true,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
}

interface AuthContextType extends AuthState {
  login: (formData: LoginFormData) => Promise<void>;
  logout: () => void;
  updateUser: (user: VendorUser | AdminUser) => void;
  checkPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  isVendor: () => boolean;
  isAdmin: () => boolean;
  isApprovedVendor: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          dispatch({ type: 'AUTH_START' });
          const response = await authService.getProfile();
          if (response.success && response.data) {
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { user: response.data.user, token },
            });
          } else {
            localStorage.removeItem('auth_token');
            dispatch({ type: 'AUTH_FAILURE' });
          }
        } catch (error) {
          localStorage.removeItem('auth_token');
          dispatch({ type: 'AUTH_FAILURE' });
        }
      }
    };

    initializeAuth();
  }, []);

  const login = async (formData: LoginFormData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = formData.userType === 'admin' 
        ? await authService.adminLogin(formData)
        : await authService.vendorLogin(formData);

      if (response.success && response.data) {
        const { token, user } = response.data;
        localStorage.setItem('auth_token', token);
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token },
        });
        toast.success('Login successful!');
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE' });
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  const updateUser = (user: VendorUser | AdminUser) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  const checkPermission = (permission: string): boolean => {
    if (!state.user) return false;
    
    if ('role' in state.user && state.user.role === 'super_admin') {
      return true;
    }
    
    if ('permissions' in state.user) {
      return state.user.permissions.includes(permission);
    }
    
    return false;
  };

  const hasRole = (role: string): boolean => {
    if (!state.user) return false;
    return state.user.role === role;
  };

  const isVendor = (): boolean => {
    if (!state.user) return false;
    // Check for vendorId (from JWT) or vendor object (from response data)
    return 'vendorId' in state.user || 'vendor' in state.user;
  };

  const isAdmin = (): boolean => {
    if (!state.user) return false;
    return 'permissions' in state.user;
  };

  const isApprovedVendor = (): boolean => {
    if (!isVendor() || !state.user) return false;

    // Check vendor status from different possible structures
    const user = state.user as any;

    // From response data structure
    if (user.vendor?.status) {
      return user.vendor.status === 'approved';
    }

    // From JWT payload structure
    if (user.vendorStatus) {
      return user.vendorStatus === 'approved';
    }

    return false;
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    updateUser,
    checkPermission,
    hasRole,
    isVendor,
    isAdmin,
    isApprovedVendor,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Custom hooks for specific auth checks
export function useIsAuthenticated() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

export function useCurrentUser() {
  const { user } = useAuth();
  return user;
}

export function useIsVendor() {
  const { isVendor } = useAuth();
  return isVendor();
}

export function useIsAdmin() {
  const { isAdmin } = useAuth();
  return isAdmin();
}

export function useIsApprovedVendor() {
  const { isApprovedVendor } = useAuth();
  return isApprovedVendor();
}

export function useHasPermission(permission: string) {
  const { checkPermission } = useAuth();
  return checkPermission(permission);
}

export function useHasRole(role: string) {
  const { hasRole } = useAuth();
  return hasRole(role);
}