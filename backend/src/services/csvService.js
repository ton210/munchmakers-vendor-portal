const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { Readable } = require('stream');
const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');

class CSVService {
  static async importProducts(file, vendorId) {
    return new Promise((resolve, reject) => {
      const results = [];
      const errors = [];
      let processedCount = 0;

      const stream = Readable.from(file.buffer);
      
      stream
        .pipe(csv())
        .on('data', (row) => {
          results.push(row);
        })
        .on('end', async () => {
          try {
            const importResults = await this.processProductRows(results, vendorId);
            resolve(importResults);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  static async processProductRows(rows, vendorId) {
    const results = {
      totalProcessed: rows.length,
      successCount: 0,
      errorCount: 0,
      errors: []
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;

      try {
        await this.processProductRow(row, vendorId, rowNumber);
        results.successCount++;
      } catch (error) {
        results.errorCount++;
        results.errors.push({
          row: rowNumber,
          data: row,
          error: error.message
        });
        console.error(`Error processing row ${rowNumber}:`, error.message);
      }
    }

    return results;
  }

  static async processProductRow(row, vendorId, rowNumber) {
    // Validate required fields
    const requiredFields = ['name', 'sku'];
    for (const field of requiredFields) {
      if (!row[field] || row[field].trim() === '') {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Check if SKU already exists
    const existingProduct = await Product.findBySku(row.sku.trim());
    if (existingProduct) {
      throw new Error(`Product with SKU '${row.sku}' already exists`);
    }

    // Find category if provided
    let categoryId = null;
    if (row.category && row.category.trim() !== '') {
      const category = await ProductCategory.findBySlug(row.category.trim());
      if (!category) {
        throw new Error(`Category '${row.category}' not found`);
      }
      categoryId = category.id;
    }

    // Parse and validate numeric fields
    const parseNumber = (value, fieldName, defaultValue = null) => {
      if (!value || value.trim() === '') return defaultValue;
      const parsed = parseFloat(value);
      if (isNaN(parsed)) {
        throw new Error(`Invalid number format for ${fieldName}: ${value}`);
      }
      return parsed;
    };

    const parseInteger = (value, fieldName, defaultValue = null) => {
      if (!value || value.trim() === '') return defaultValue;
      const parsed = parseInt(value);
      if (isNaN(parsed)) {
        throw new Error(`Invalid integer format for ${fieldName}: ${value}`);
      }
      return parsed;
    };

    // Parse attributes if provided
    let attributes = {};
    if (row.attributes && row.attributes.trim() !== '') {
      try {
        attributes = JSON.parse(row.attributes);
      } catch (error) {
        throw new Error(`Invalid JSON format for attributes: ${row.attributes}`);
      }
    }

    // Parse SEO data if provided
    let seoData = {};
    if (row.seo_title || row.seo_description || row.seo_keywords) {
      seoData = {
        title: row.seo_title || row.name,
        description: row.seo_description || '',
        keywords: row.seo_keywords || ''
      };
    }

    // Create product data
    const productData = {
      vendor_id: vendorId,
      name: row.name.trim(),
      sku: row.sku.trim(),
      description: row.description || '',
      category_id: categoryId,
      base_price: parseNumber(row.base_price, 'base_price'),
      moq: parseInteger(row.moq, 'moq', 1),
      production_time: parseInteger(row.production_time, 'production_time'),
      weight: parseNumber(row.weight, 'weight'),
      dimensions: row.dimensions || '',
      brand: row.brand || '',
      material: row.material || '',
      attributes: Object.keys(attributes).length > 0 ? JSON.stringify(attributes) : null,
      seo_data: Object.keys(seoData).length > 0 ? JSON.stringify(seoData) : null,
      status: 'draft'
    };

    // Create product
    const product = await Product.create(productData);

    return product;
  }

  static async exportProducts(filters = {}) {
    try {
      // Get all products based on filters
      const products = await Product.getAll(filters, { limit: 10000 }); // Large limit for export

      // Define CSV headers
      const csvWriter = createCsvWriter({
        path: '/tmp/products-export.csv',
        header: [
          { id: 'id', title: 'ID' },
          { id: 'vendor_name', title: 'Vendor' },
          { id: 'name', title: 'Product Name' },
          { id: 'sku', title: 'SKU' },
          { id: 'description', title: 'Description' },
          { id: 'category_name', title: 'Category' },
          { id: 'status', title: 'Status' },
          { id: 'base_price', title: 'Base Price' },
          { id: 'moq', title: 'MOQ' },
          { id: 'production_time', title: 'Production Time' },
          { id: 'weight', title: 'Weight' },
          { id: 'dimensions', title: 'Dimensions' },
          { id: 'brand', title: 'Brand' },
          { id: 'material', title: 'Material' },
          { id: 'attributes', title: 'Attributes' },
          { id: 'seo_data', title: 'SEO Data' },
          { id: 'created_at', title: 'Created At' },
          { id: 'updated_at', title: 'Updated At' },
          { id: 'submitted_at', title: 'Submitted At' },
          { id: 'reviewed_at', title: 'Reviewed At' }
        ]
      });

      // Process products for CSV export
      const csvData = products.map(product => ({
        ...product,
        attributes: product.attributes ? JSON.stringify(product.attributes) : '',
        seo_data: product.seo_data ? JSON.stringify(product.seo_data) : '',
        created_at: new Date(product.created_at).toISOString(),
        updated_at: new Date(product.updated_at).toISOString(),
        submitted_at: product.submitted_at ? new Date(product.submitted_at).toISOString() : '',
        reviewed_at: product.reviewed_at ? new Date(product.reviewed_at).toISOString() : ''
      }));

      // Write to temporary file
      await csvWriter.writeRecords(csvData);

      // Read file as buffer
      const fs = require('fs');
      const csvBuffer = fs.readFileSync('/tmp/products-export.csv');
      
      // Clean up temporary file
      fs.unlinkSync('/tmp/products-export.csv');

      return csvBuffer;

    } catch (error) {
      console.error('CSV export error:', error);
      throw new Error('Failed to export products to CSV');
    }
  }

  static generateImportTemplate() {
    const templateData = [
      {
        name: 'Sample Product',
        sku: 'SAMPLE-001',
        description: 'This is a sample product description',
        category: 'sample-category-slug',
        base_price: '29.99',
        moq: '1',
        production_time: '5',
        weight: '0.5',
        dimensions: '10x10x5',
        brand: 'Sample Brand',
        material: 'Cotton',
        attributes: '{"color": "red", "size": "large"}',
        seo_title: 'Sample Product - Best Quality',
        seo_description: 'Sample product with amazing features',
        seo_keywords: 'sample, product, quality'
      }
    ];

    const csvWriter = createCsvWriter({
      path: '/tmp/product-import-template.csv',
      header: [
        { id: 'name', title: 'name' },
        { id: 'sku', title: 'sku' },
        { id: 'description', title: 'description' },
        { id: 'category', title: 'category' },
        { id: 'base_price', title: 'base_price' },
        { id: 'moq', title: 'moq' },
        { id: 'production_time', title: 'production_time' },
        { id: 'weight', title: 'weight' },
        { id: 'dimensions', title: 'dimensions' },
        { id: 'brand', title: 'brand' },
        { id: 'material', title: 'material' },
        { id: 'attributes', title: 'attributes' },
        { id: 'seo_title', title: 'seo_title' },
        { id: 'seo_description', title: 'seo_description' },
        { id: 'seo_keywords', title: 'seo_keywords' }
      ]
    });

    return csvWriter.writeRecords(templateData);
  }

  static async getTemplateBuffer() {
    try {
      await this.generateImportTemplate();
      
      const fs = require('fs');
      const templateBuffer = fs.readFileSync('/tmp/product-import-template.csv');
      
      // Clean up temporary file
      fs.unlinkSync('/tmp/product-import-template.csv');

      return templateBuffer;

    } catch (error) {
      console.error('Template generation error:', error);
      throw new Error('Failed to generate import template');
    }
  }

  static validateCSVStructure(file) {
    return new Promise((resolve, reject) => {
      const requiredColumns = ['name', 'sku'];
      const foundColumns = [];

      const stream = Readable.from(file.buffer);
      
      stream
        .pipe(csv())
        .on('headers', (headers) => {
          foundColumns.push(...headers);
        })
        .on('data', () => {
          // We only need the headers, so we can end after first row
          stream.destroy();
        })
        .on('end', () => {
          const missingColumns = requiredColumns.filter(col => 
            !foundColumns.includes(col)
          );

          if (missingColumns.length > 0) {
            reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`));
          } else {
            resolve({
              valid: true,
              foundColumns,
              missingColumns: []
            });
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  static async previewImport(file, vendorId, maxRows = 10) {
    try {
      const validation = await this.validateCSVStructure(file);
      if (!validation.valid) {
        throw new Error('Invalid CSV structure');
      }

      return new Promise((resolve, reject) => {
        const preview = [];
        let rowCount = 0;

        const stream = Readable.from(file.buffer);
        
        stream
          .pipe(csv())
          .on('data', (row) => {
            if (rowCount < maxRows) {
              preview.push({
                rowNumber: rowCount + 1,
                data: row,
                valid: this.validateRow(row)
              });
              rowCount++;
            } else {
              stream.destroy();
            }
          })
          .on('end', () => {
            resolve({
              preview,
              totalRows: rowCount,
              columns: validation.foundColumns
            });
          })
          .on('error', (error) => {
            reject(error);
          });
      });

    } catch (error) {
      throw error;
    }
  }

  static validateRow(row) {
    const errors = [];

    if (!row.name || row.name.trim() === '') {
      errors.push('Name is required');
    }

    if (!row.sku || row.sku.trim() === '') {
      errors.push('SKU is required');
    }

    if (row.base_price && isNaN(parseFloat(row.base_price))) {
      errors.push('Base price must be a valid number');
    }

    if (row.moq && isNaN(parseInt(row.moq))) {
      errors.push('MOQ must be a valid integer');
    }

    if (row.attributes) {
      try {
        JSON.parse(row.attributes);
      } catch (error) {
        errors.push('Attributes must be valid JSON');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = CSVService;