// src/components/documents/DocumentCard/DocumentCard.tsx
import React from 'react';
import { Link } from 'react-router';
import { format } from 'date-fns';
import { 
  FiFile, 
  FiFileText, 
  FiImage, 
  FiPaperclip, 
  FiLock, 
  FiEye, 
  FiMoreVertical,
  FiTrash2,
  FiEdit,
  FiCopy,
  FiDownload
} from '../../common/Icons';
import Card from '../../common/Card/Card';
import Dropdown from '../../common/Dropdown/Dropdown';
import Tooltip from '../../common/Tooltip/Tooltip';
import { Document, SensitivityLevel } from '../../../types/document.types';

interface DocumentCardProps {
  document: Document;
  onView?: (document: Document) => void;
  onEdit?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onCopy?: (document: Document) => void;
  className?: string;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (document: Document) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onView,
  onEdit,
  onDelete,
  onDownload,
  onCopy,
  className = '',
  isSelectable = false,
  isSelected = false,
  onSelect,
}) => {
  // Function to get appropriate icon based on file type
  const getFileIcon = () => {
    const fileType = document.fileType.toLowerCase();
    
    if (fileType.includes('image')) {
      return <FiImage size={24} />;
    } else if (fileType.includes('pdf') || fileType.includes('document')) {
      return <FiFileText size={24} />;
    } else {
      return <FiFile size={24} />;
    }
  };
  
  // Function to get color based on sensitivity level
  const getSensitivityColor = (level: SensitivityLevel): string => {
    switch (level) {
      case 'public':
        return 'bg-success-100 text-success-800';
      case 'internal':
        return 'bg-primary-100 text-primary-800';
      case 'confidential':
        return 'bg-warning-100 text-warning-800';
      case 'restricted':
        return 'bg-danger-100 text-danger-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };
  
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Handle card click
  const handleCardClick = () => {
    if (isSelectable && onSelect) {
      onSelect(document);
    } else if (onView) {
      onView(document);
    }
  };
  
  return (
    <Card
      className={`h-full transition-all duration-200 ${className} ${
        isSelected ? 'ring-2 ring-primary-500' : ''
      } ${isSelectable ? 'cursor-pointer' : ''}`}
      onClick={handleCardClick}
      noPadding
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3 text-neutral-500">
              {getFileIcon()}
            </div>
            <div>
              <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100 line-clamp-1">
                {document.title}
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1">
                {document.fileName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            {document.piiDetected && (
              <Tooltip content="Contains PII data" position="top">
                <div className="mr-2 text-warning-500">
                  <FiLock size={16} />
                </div>
              </Tooltip>
            )}
            
            <Dropdown
              trigger={
                <button className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500">
                  <FiMoreVertical size={16} />
                </button>
              }
              align="right"
              width={180}
            >
              {onView && (
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(document);
                  }}
                >
                  <FiEye className="mr-2" size={14} /> View Document
                </button>
              )}
              
              {onEdit && (
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(document);
                  }}
                >
                  <FiEdit className="mr-2" size={14} /> Edit Metadata
                </button>
              )}
              
              {onDownload && (
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(document);
                  }}
                >
                  <FiDownload className="mr-2" size={14} /> Download
                </button>
              )}
              
              {onCopy && (
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy(document);
                  }}
                >
                  <FiCopy className="mr-2" size={14} /> Copy Link
                </button>
              )}
              
              {onDelete && (
                <button
                  className="w-full px-4 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900 dark:hover:bg-opacity-20 flex items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(document);
                  }}
                >
                  <FiTrash2 className="mr-2" size={14} /> Delete
                </button>
              )}
            </Dropdown>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSensitivityColor(
              document.sensitivityLevel
            )}`}
          >
            {document.sensitivityLevel}
          </span>
          
          <span className="text-xs text-neutral-500">
            {formatFileSize(document.fileSize)}
          </span>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-neutral-500">
          <div>
            <p className="font-medium">Uploaded</p>
            <p>{formatDate(document.uploadedAt)}</p>
          </div>
          <div>
            <p className="font-medium">Modified</p>
            <p>{formatDate(document.lastModifiedAt)}</p>
          </div>
        </div>
        
        {document.tags && document.tags.length > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-1">
              {document.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300"
                >
                  {tag}
                </span>
              ))}
              
              {document.tags.length > 3 && (
                <Tooltip
                  content={
                    <div>
                      {document.tags.slice(3).map((tag, index) => (
                        <div key={index}>{tag}</div>
                      ))}
                    </div>
                  }
                >
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300">
                    +{document.tags.length - 3}
                  </span>
                </Tooltip>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="border-t border-neutral-200 dark:border-neutral-700 px-4 py-3 bg-neutral-50 dark:bg-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-xs text-neutral-500">
              <span className="font-medium">Status:</span> {document.status}
            </div>
          </div>
          
          {onView && (
            <button
              className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium flex items-center"
              onClick={(e) => {
                e.stopPropagation();
                onView(document);
              }}
            >
              <FiEye className="mr-1" size={12} /> View
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DocumentCard;