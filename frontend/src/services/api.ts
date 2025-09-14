import axios from 'axios';

const BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://vendors.munchmakers.com' // Same domain as frontend in production
  : 'http://localhost:5000';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userData');

      // Only redirect to login if we're not already on a public page
      const currentPath = window.location.pathname;
      const publicPaths = ['/', '/docs', '/privacy', '/terms', '/vendor-agreement', '/register', '/login', '/vendor/login', '/admin', '/forgot-password', '/reset-password'];

      if (!publicPaths.includes(currentPath)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;