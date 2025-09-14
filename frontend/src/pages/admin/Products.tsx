import React from 'react';
import { Layout } from '../../components/layout/Layout';

const AdminProducts: React.FC = () => {
  return (
    <Layout title="Product Management">
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Management</h1>
        <p className="text-gray-600">Product management coming soon...</p>
      </div>
    </Layout>
  );
};

export default AdminProducts;