// src/components/documents/DocumentUpload/DocumentUpload.tsx
import React, { useState, useCallback } from 'react';
import { FiUpload, FiFile, FiX } from 'react-icons/fi';
import Button from '../../common/Button/Button';
import Spinner from '../../common/Spinner/Spinner';
import { useDropzone, DropzoneOptions, FileRejection } from 'react-dropzone';

interface DocumentUploadProps {
  onUpload: (files: File[], metadata?: any) => void;
  isUploading?: boolean;
  allowMultiple?: boolean;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
  className?: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUpload,
  isUploading = false,
  allowMultiple = true,
  acceptedFileTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.csv', '.json', '.xml'],
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  className = '',
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // First, define the onDrop callback
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle accepted files
      setFiles(prev => (allowMultiple ? [...prev, ...acceptedFiles] : acceptedFiles));
      
      // Handle rejected files
      const newErrors = rejectedFiles.map(file => {
        if (file.errors[0]?.code === 'file-too-large') {
          return `File "${file.file.name}" is too large. Max size is ${formatFileSize(maxFileSize)}.`;
        }
        if (file.errors[0]?.code === 'file-invalid-type') {
          return `File "${file.file.name}" has an invalid file type.`;
        }
        return `File "${file.file.name}" could not be uploaded.`;
      });
      
      setErrors(prev => [...prev, ...newErrors]);
    },
    [allowMultiple, maxFileSize]
  );

  // Define a more compatible interface that extends the problematic one
interface CustomDropzoneOptions {
  onDrop: (acceptedFiles: File[], rejectedFiles: FileRejection[]) => void;
  maxSize?: number;
  multiple?: boolean;
  accept?: Record<string, string[]>;
}

// Use different variable names
const { 
  getRootProps: getDropzoneRootProps, 
  getInputProps: getDropzoneInputProps, 
  isDragActive: isDropzoneDragActive 
} = useDropzone({
  onDrop,
  maxSize: maxFileSize,
  multiple: allowMultiple
} as any);

  const removeFile = (fileToRemove: File) => {
    setFiles(files.filter(file => file !== fileToRemove));
  };
  
  // Remove an error from the list
  const removeError = (errorToRemove: string) => {
    setErrors(errors.filter(error => error !== errorToRemove));
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (files.length === 0) return;
    
    onUpload(files);
    
    // Clear the file list after successful upload
    if (!isUploading) {
      setFiles([]);
    }
  };
  
  return (
    <div className={`${className}`}>
      <div
        {...getDropzoneRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors
          ${isDropzoneDragActive  
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900 dark:bg-opacity-20' 
            : 'border-neutral-300 dark:border-neutral-700 hover:border-primary-400 dark:hover:border-primary-600'}
        `}
      >
        <input {...getDropzoneInputProps()} />
        <div className="text-neutral-500 dark:text-neutral-400 text-center">
          <div className="mx-auto h-12 w-12 mb-4">
            <FiUpload size={48} />
          </div>
          <p className="text-lg font-medium">
            {isDropzoneDragActive  ? 'Drop the files here' : 'Drag and drop files here'}
          </p>
          <p className="mt-1">
            or <span className="text-primary-600 dark:text-primary-400">browse</span> to select files
          </p>
          <p className="mt-2 text-sm">
            {allowMultiple ? 'You can upload multiple files' : 'You can upload a single file'}
          </p>
          <p className="mt-1 text-xs">
            Accepted file types: {acceptedFileTypes.join(', ')} (Max: {formatFileSize(maxFileSize)})
          </p>
        </div>
      </div>
      
      {/* File list */}
      {files.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Selected Files ({files.length})
          </h3>
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-md overflow-hidden">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between py-3 px-4 bg-white dark:bg-neutral-800">
                <div className="flex items-center">
                  <div className="h-5 w-5 text-neutral-500 mr-3">
                    <FiFile size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="p-1 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                  onClick={() => removeFile(file)}
                  disabled={isUploading}
                >
                  <div>
                    <FiX size={16} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Error list */}
      {errors.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-danger-600 mb-2">
            Errors ({errors.length})
          </h3>
          <ul className="divide-y divide-danger-200 dark:divide-danger-700 border border-danger-200 dark:border-danger-700 rounded-md overflow-hidden">
            {errors.map((error, index) => (
              <li key={index} className="flex items-center justify-between py-3 px-4 bg-danger-50 dark:bg-danger-900 dark:bg-opacity-20">
                <p className="text-sm text-danger-700 dark:text-danger-400">{error}</p>
                <button
                  type="button"
                  className="p-1 text-danger-500 hover:text-danger-700 dark:text-danger-400 dark:hover:text-danger-300"
                  onClick={() => removeError(error)}
                >
                  <div>
                    <FiX size={16} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Upload button */}
      {files.length > 0 && (
        <div className="mt-4 flex justify-end">
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isUploading || files.length === 0}
            isLoading={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload Files'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
