import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  ArrowUpTrayIcon, 
  PhotoIcon, 
  XMarkIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface UploadedFile extends File {
  preview?: string;
  id: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
  },
  multiple = true,
  disabled = false,
  className,
  children
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setErrors([]);
    
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const newErrors: string[] = [];
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach((error: any) => {
          if (error.code === 'file-too-large') {
            newErrors.push(`${file.name} is too large. Maximum size is ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
          } else if (error.code === 'file-invalid-type') {
            newErrors.push(`${file.name} is not a supported file type`);
          } else if (error.code === 'too-many-files') {
            newErrors.push(`Too many files. Maximum is ${maxFiles} files`);
          }
        });
      });
      setErrors(newErrors);
    }

    // Handle accepted files
    if (acceptedFiles.length > 0) {
      const newFiles: UploadedFile[] = acceptedFiles.map((file) => {
        const fileWithPreview = Object.assign(file, {
          id: Math.random().toString(36).substring(7),
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        }) as UploadedFile;
        
        return fileWithPreview;
      });

      const updatedFiles = multiple ? [...uploadedFiles, ...newFiles] : newFiles;
      setUploadedFiles(updatedFiles);
      onFileSelect(updatedFiles);
    }
  }, [uploadedFiles, maxFiles, maxSize, multiple, onFileSelect]);

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => {
      const updated = prev.filter((file) => file.id !== fileId);
      onFileSelect(updated);
      return updated;
    });
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxFiles: multiple ? maxFiles : 1,
    maxSize,
    multiple,
    disabled
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200',
          isDragActive && !isDragReject && 'border-primary-400 bg-primary-50',
          isDragReject && 'border-red-400 bg-red-50',
          !isDragActive && !isDragReject && 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        
        {children ? (
          children
        ) : (
          <>
            <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive ? 'Drop the files here' : 'Drop files here or click to upload'}
            </p>
            <p className="text-sm text-gray-600">
              {Object.keys(accept).join(', ')} up to {(maxSize / 1024 / 1024).toFixed(1)}MB each
            </p>
            {multiple && (
              <p className="text-xs text-gray-500 mt-1">
                Maximum {maxFiles} files
              </p>
            )}
          </>
        )}
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="mt-4 space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center text-red-600 text-sm">
              <ExclamationCircleIcon className="h-4 w-4 mr-2" />
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Uploaded Files</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="relative bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                {/* Remove button */}
                <button
                  onClick={() => removeFile(file.id)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>

                {/* File preview */}
                <div className="flex items-center space-x-3">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="h-12 w-12 object-cover rounded"
                    />
                  ) : (
                    <PhotoIcon className="h-12 w-12 text-gray-400" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};