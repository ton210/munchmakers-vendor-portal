const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const path = require('path');

class R2Service {
  constructor() {
    this.client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });

    this.bucket = process.env.R2_BUCKET;
    this.publicUrl = process.env.R2_PUBLIC_URL;
  }

  generateFileName(originalName, vendorId, productId = null) {
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9]/g, '-');
    
    let folderPath = `vendors/${vendorId}`;
    if (productId) {
      folderPath += `/products/${productId}`;
    }
    
    return `${folderPath}/${timestamp}-${randomHash}-${baseName}${ext}`;
  }

  async uploadFile(file, vendorId, productId = null) {
    try {
      const fileName = this.generateFileName(file.originalname, vendorId, productId);
      
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
        Metadata: {
          vendorId: vendorId.toString(),
          productId: productId ? productId.toString() : '',
          originalName: file.originalname,
          uploadedAt: new Date().toISOString()
        }
      });

      await this.client.send(command);

      const publicUrl = `${this.publicUrl}/${fileName}`;

      return {
        fileName,
        publicUrl,
        size: file.size,
        contentType: file.mimetype
      };

    } catch (error) {
      console.error('R2 upload error:', error);
      throw new Error('Failed to upload file to storage');
    }
  }

  async uploadMultipleFiles(files, vendorId, productId = null) {
    const uploadPromises = files.map(file => 
      this.uploadFile(file, vendorId, productId)
    );

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('R2 bulk upload error:', error);
      throw new Error('Failed to upload files to storage');
    }
  }

  async deleteFile(fileName) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
      });

      await this.client.send(command);
      console.log(`File deleted from R2: ${fileName}`);
      return true;

    } catch (error) {
      console.error('R2 delete error:', error);
      throw new Error('Failed to delete file from storage');
    }
  }

  async deleteMultipleFiles(fileNames) {
    const deletePromises = fileNames.map(fileName => 
      this.deleteFile(fileName)
    );

    try {
      await Promise.all(deletePromises);
      return true;
    } catch (error) {
      console.error('R2 bulk delete error:', error);
      throw new Error('Failed to delete files from storage');
    }
  }

  async getFileInfo(fileName) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
      });

      const response = await this.client.send(command);
      
      return {
        fileName,
        size: response.ContentLength,
        contentType: response.ContentType,
        lastModified: response.LastModified,
        metadata: response.Metadata
      };

    } catch (error) {
      console.error('R2 get file info error:', error);
      throw new Error('Failed to get file information');
    }
  }

  async generatePresignedUrl(fileName, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      return url;

    } catch (error) {
      console.error('R2 presigned URL error:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }

  async copyFile(sourceFileName, destinationFileName) {
    try {
      const getCommand = new GetObjectCommand({
        Bucket: this.bucket,
        Key: sourceFileName,
      });

      const sourceObject = await this.client.send(getCommand);

      const putCommand = new PutObjectCommand({
        Bucket: this.bucket,
        Key: destinationFileName,
        Body: sourceObject.Body,
        ContentType: sourceObject.ContentType,
        Metadata: sourceObject.Metadata
      });

      await this.client.send(putCommand);

      return {
        sourceFileName,
        destinationFileName,
        publicUrl: `${this.publicUrl}/${destinationFileName}`
      };

    } catch (error) {
      console.error('R2 copy file error:', error);
      throw new Error('Failed to copy file');
    }
  }

  validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
    }

    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 10MB.');
    }

    return true;
  }

  async uploadProductImage(file, vendorId, productId, altText = '') {
    try {
      this.validateImageFile(file);

      const uploadResult = await this.uploadFile(file, vendorId, productId);

      return {
        ...uploadResult,
        altText
      };

    } catch (error) {
      console.error('Product image upload error:', error);
      throw error;
    }
  }

  async uploadVendorDocument(file, vendorId, documentType) {
    try {
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.mimetype)) {
        throw new Error('Invalid document type. Only PDF, images, and Word documents are allowed.');
      }

      const maxSize = 20 * 1024 * 1024; // 20MB for documents
      if (file.size > maxSize) {
        throw new Error('Document size too large. Maximum size is 20MB.');
      }

      const fileName = `vendors/${vendorId}/documents/${documentType}/${this.generateFileName(file.originalname, vendorId)}`;

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
        Metadata: {
          vendorId: vendorId.toString(),
          documentType,
          originalName: file.originalname,
          uploadedAt: new Date().toISOString()
        }
      });

      await this.client.send(command);

      return {
        fileName,
        publicUrl: `${this.publicUrl}/${fileName}`,
        size: file.size,
        contentType: file.mimetype,
        documentType
      };

    } catch (error) {
      console.error('Vendor document upload error:', error);
      throw error;
    }
  }

  // Cleanup old files (for maintenance)
  async cleanupOldFiles(days = 30) {
    try {
      // This would require listing objects and checking their age
      // Implementation would depend on specific cleanup requirements
      console.log(`Cleanup task for files older than ${days} days would run here`);
      return true;
    } catch (error) {
      console.error('Cleanup error:', error);
      throw error;
    }
  }

  // Get storage statistics
  async getStorageStats(vendorId = null) {
    try {
      // This would require listing objects and calculating statistics
      // Implementation would depend on specific reporting requirements
      console.log(`Storage stats calculation for vendor ${vendorId || 'all'} would run here`);
      return {
        totalFiles: 0,
        totalSize: 0,
        byType: {}
      };
    } catch (error) {
      console.error('Storage stats error:', error);
      throw error;
    }
  }
}

module.exports = new R2Service();