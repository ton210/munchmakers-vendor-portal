import React from 'react';
import { Layout } from '../../components/layout/Layout';

const ProductDetails: React.FC = () => {
  return (
    <Layout title="Product Details">
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Details</h1>
        <p className="text-gray-600">Product details coming soon...</p>
      </div>
    </Layout>
  );
};

export default ProductDetails;