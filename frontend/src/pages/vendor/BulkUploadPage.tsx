import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { 
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { vendorService } from '../../services/vendorService';
import toast from 'react-hot-toast';

interface UploadResult {
  success: boolean;
  processed: number;
  created: number;
  updated: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
}

export const BulkUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const generateCSVTemplate = () => {
    const headers = [
      'name',
      'description', 
      'sku',
      'price',
      'compare_price',
      'category_id',
      'weight',
      'dimensions',
      'image_url',
      'status'
    ];

    const sampleData = [
      [
        'Organic Honey',
        'Pure organic honey from local farms',
        'HON-001',
        '24.99',
        '29.99',
        '1',
        '1.5',
        '3x3x6',
        'https://example.com/honey.jpg',
        'draft'
      ],
      [
        'Artisan Bread',
        'Freshly baked sourdough bread',
        'BRD-001', 
        '8.50',
        '',
        '1',
        '1.0',
        '12x6x3',
        'https://example.com/bread.jpg',
        'draft'
      ]
    ];

    const csvContent = [headers, ...sampleData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'munchmakers-product-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('CSV template downloaded successfully');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a CSV file first');
      return;
    }

    setUploading(true);
    try {
      console.log('🔄 Uploading CSV file:', selectedFile.name);
      
      const formData = new FormData();
      formData.append('csvFile', selectedFile);

      const response = await fetch('/api/products/bulk-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ CSV upload successful:', result.data);
        setUploadResult(result.data);
        toast.success(`Successfully processed ${result.data.processed} products!`);
      } else {
        console.error('❌ CSV upload failed:', result.message);
        toast.error(result.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('❌ CSV upload error:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Layout title="Bulk Product Upload">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bulk Product Upload</h1>
            <p className="text-gray-600 mt-1">Upload multiple products at once using CSV</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/products')}>
            Back to Products
          </Button>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <InformationCircleIcon className="h-5 w-5 mr-2" />
              How to Upload Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Step 1: Download Template</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Download our CSV template with the correct format and sample data.
                </p>
                <Button 
                  variant="secondary" 
                  onClick={generateCSVTemplate}
                  className="w-full"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Download CSV Template
                </Button>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Step 2: Upload Your File</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Fill out the template and upload your CSV file. We'll process up to 1000 products.
                </p>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {selectedFile && (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm text-green-700">{selectedFile.name}</span>
                      </div>
                      <button
                        onClick={resetUpload}
                        className="text-sm text-green-600 hover:text-green-700"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">CSV Format Requirements</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>name</strong>: Product name (required)</li>
                <li>• <strong>description</strong>: Product description</li>
                <li>• <strong>sku</strong>: Unique product SKU (required)</li>
                <li>• <strong>price</strong>: Product price in USD (required)</li>
                <li>• <strong>compare_price</strong>: Original price for discounts</li>
                <li>• <strong>category_id</strong>: Category ID (1 for Food & Beverages)</li>
                <li>• <strong>weight</strong>: Product weight in lbs</li>
                <li>• <strong>dimensions</strong>: LxWxH in inches (e.g., "12x6x3")</li>
                <li>• <strong>image_url</strong>: Product image URL</li>
                <li>• <strong>status</strong>: draft, pending, or approved</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              {!selectedFile ? (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-indigo-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Upload CSV File</h3>
                  <p className="text-gray-600 mb-4">
                    Drag and drop your CSV file here, or click to browse
                  </p>
                  <Button variant="secondary">Choose File</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-4">
                    <CheckCircleIcon className="h-8 w-8 text-green-500" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{selectedFile.name}</h3>
                      <p className="text-gray-600">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Ready to upload
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 justify-center">
                    <Button
                      onClick={handleUpload}
                      loading={uploading}
                      disabled={uploading}
                    >
                      {uploading ? 'Processing...' : 'Upload Products'}
                    </Button>
                    <Button variant="secondary" onClick={resetUpload}>
                      Choose Different File
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upload Results */}
        {uploadResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {uploadResult.success ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                )}
                Upload Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{uploadResult.processed}</div>
                  <div className="text-sm text-blue-800">Total Processed</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{uploadResult.created}</div>
                  <div className="text-sm text-green-800">Products Created</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{uploadResult.errors.length}</div>
                  <div className="text-sm text-red-800">Errors</div>
                </div>
              </div>

              {uploadResult.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Errors Found</h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {uploadResult.errors.map((error, index) => (
                      <div key={index} className="flex items-start p-3 bg-red-50 border border-red-200 rounded-lg">
                        <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <span className="font-medium text-red-900">Row {error.row}:</span>
                          <span className="text-red-800 ml-1">{error.error}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-3 mt-6">
                <Button onClick={() => navigate('/products')}>
                  View Products
                </Button>
                <Button variant="secondary" onClick={resetUpload}>
                  Upload Another File
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Tips for Successful Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Best Practices</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Use unique SKUs for each product</li>
                  <li>• Include high-quality product descriptions</li>
                  <li>• Ensure all required fields are filled</li>
                  <li>• Use valid image URLs (HTTPS preferred)</li>
                  <li>• Set status to "draft" for review before publishing</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Common Issues</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Duplicate SKUs will cause upload errors</li>
                  <li>• Invalid price formats (use numbers only)</li>
                  <li>• Missing required fields (name, sku, price)</li>
                  <li>• Invalid category IDs</li>
                  <li>• Malformed CSV (extra commas, quotes)</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-900">Important Notes</h4>
                  <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                    <li>• All uploaded products start in "draft" status and require admin approval</li>
                    <li>• Large uploads may take several minutes to process</li>
                    <li>• You can upload a maximum of 1000 products per file</li>
                    <li>• Products with errors will be skipped but won't stop the upload</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default BulkUploadPage;