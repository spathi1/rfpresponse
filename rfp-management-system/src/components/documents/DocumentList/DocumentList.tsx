
// src/components/documents/DocumentList/DocumentList.tsx
import React, { useState } from 'react';
import { format } from 'date-fns';
import { FiFileText, FiEye, FiEdit, FiDownload, FiTrash2, FiCopy, FiLock } from '../../common/Icons';
import { Document, SensitivityLevel } from '../../../types/document.types';
import Spinner from '../../common/Spinner/Spinner';
import Tooltip from '../../common/Tooltip/Tooltip';

interface DocumentListProps {
  documents: Document[];
  isLoading?: boolean;
  onView?: (document: Document) => void;
  onEdit?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onCopy?: (document: Document) => void;
  allowSelection?: boolean;
  onSelectionChange?: (selectedDocuments: Document[]) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
  onDownload,
  onCopy,
  allowSelection = false,
  onSelectionChange,
}) => {
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  
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
  
  // Handle document selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedDocuments([...documents]);
    } else {
      setSelectedDocuments([]);
    }
    
    if (onSelectionChange) {
      onSelectionChange(e.target.checked ? [...documents] : []);
    }
  };
  
  // Handle single document selection
  const handleSelectDocument = (e: React.ChangeEvent<HTMLInputElement>, document: Document) => {
    e.stopPropagation();
    
    let newSelection: Document[];
    
    if (e.target.checked) {
      newSelection = [...selectedDocuments, document];
    } else {
      newSelection = selectedDocuments.filter((doc) => doc.id !== document.id);
    }
    
    setSelectedDocuments(newSelection);
    
    if (onSelectionChange) {
      onSelectionChange(newSelection);
    }
  };
  
  // Check if a document is selected
  const isDocumentSelected = (document: Document): boolean => {
    return selectedDocuments.some((doc) => doc.id === document.id);
  };
  
  // If loading
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // If no documents
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-neutral-500 dark:text-neutral-400">
        <svg
          className="w-16 h-16 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          ></path>
        </svg>
        <p className="text-lg font-medium">No documents found</p>
        <p className="text-sm mt-1">Upload documents or adjust your filters</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
        <thead className="bg-neutral-50 dark:bg-neutral-800">
          <tr>
            {allowSelection && (
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  onChange={handleSelectAll}
                  checked={selectedDocuments.length === documents.length && documents.length > 0}
                />
              </th>
            )}
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Document
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Status
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Sensitivity
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Size
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Uploaded
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Modified
            </th>
            <th scope="col" className="relative px-3 py-3.5">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700 bg-white dark:bg-neutral-900">
          {documents.map((document) => (
            <tr
              key={document.id}
              className="hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
              onClick={() => onView && onView(document)}
            >
              {allowSelection && (
                <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-500">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    onChange={(e) => handleSelectDocument(e, document)}
                    checked={isDocumentSelected(document)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
              )}
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0 text-neutral-500 mr-3">
                    <FiFileText size={20} />
                  </div>
                  <div>
                    <div className="font-medium text-neutral-900 dark:text-neutral-100">
                      {document.title}
                    </div>
                    <div className="text-neutral-500 dark:text-neutral-400">
                      {document.fileName}
                      {document.piiDetected && (
                        <Tooltip content="Contains PII data" position="top">
                          <span className="ml-2 text-warning-500">
                            <FiLock size={14} />
                          </span>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                <span className="capitalize">{document.status}</span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSensitivityColor(
                    document.sensitivityLevel
                  )}`}
                >
                  {document.sensitivityLevel}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                {formatFileSize(document.fileSize)}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                {formatDate(document.uploadedAt)}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                {formatDate(document.lastModifiedAt)}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                <div className="flex items-center justify-end space-x-2">
                  {onView && (
                    <button
                      type="button"
                      className="p-1 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(document);
                      }}
                    >
                      <FiEye size={16} />
                    </button>
                  )}
                  
                  {onEdit && (
                    <button
                      type="button"
                      className="p-1 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(document);
                      }}
                    >
                      <FiEdit size={16} />
                    </button>
                  )}
                  
                  {onDownload && (
                    <button
                      type="button"
                      className="p-1 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload(document);
                      }}
                    >
                      <FiDownload size={16} />
                    </button>
                  )}
                  
                  {onCopy && (
                    <button
                      type="button"
                      className="p-1 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopy(document);
                      }}
                    >
                      <FiCopy size={16} />
                    </button>
                  )}
                  
                  {onDelete && (
                    <button
                      type="button"
                      className="p-1 text-danger-500 hover:text-danger-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(document);
                      }}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentList;

