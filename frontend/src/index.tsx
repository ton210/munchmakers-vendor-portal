import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import VendorApp from './VendorApp';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Detect if this is the vendor subdomain
const isVendorDomain = () => {
  const hostname = window.location.hostname;
  return hostname.startsWith('vendors.') ||
         hostname === 'localhost' && window.location.pathname.startsWith('/vendor') ||
         process.env.REACT_APP_VENDOR_ONLY === 'true';
};

const AppComponent = isVendorDomain() ? VendorApp : App;

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppComponent />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
          },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);