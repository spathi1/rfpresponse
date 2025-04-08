// src/components/documents/DocumentGrid/DocumentGrid.tsx
import React, { useState, useEffect } from 'react';
import { Document } from '../../../types/document.types';
import DocumentCard from '../DocumentCard/DocumentCard';
import Spinner from '../../common/Spinner/Spinner';

interface DocumentGridProps {
  documents: Document[];
  isLoading?: boolean;
  error?: string | null;
  
  // Support both naming conventions for callbacks
  onViewDocument?: (document: Document) => void;
  onEditDocument?: (document: Document) => void;
  onDeleteDocument?: (document: Document) => void;
  onDownloadDocument?: (document: Document) => void;
  onCopyDocumentLink?: (document: Document) => void;
  
  // Alternative prop names used directly in Documents/index.tsx
  onView?: (document: Document) => void;
  onEdit?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onCopy?: (document: Document) => void;
  
  // Selection props
  isSelectable?: boolean;
  allowSelection?: boolean;
  onSelectionChange?: (documents: Document[]) => void;
  className?: string;
}

const DocumentGrid: React.FC<DocumentGridProps> = ({
  documents,
  isLoading = false,
  error = null,
  
  // Support both naming conventions
  onViewDocument,
  onEditDocument,
  onDeleteDocument,
  onDownloadDocument,
  onCopyDocumentLink,
  
  onView,
  onEdit,
  onDelete,
  onDownload,
  onCopy,
  
  isSelectable,
  allowSelection = false,
  onSelectionChange,
  className = '',
}) => {
  // Use either naming convention - prefer the onView style if provided
  const handleView = onView || onViewDocument;
  const handleEdit = onEdit || onEditDocument;
  const handleDelete = onDelete || onDeleteDocument;
  const handleDownload = onDownload || onDownloadDocument;
  const handleCopy = onCopy || onCopyDocumentLink;
  
  // Determine if selection is enabled from either prop
  const selectionEnabled = isSelectable || allowSelection;
  
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  
  // Update selected documents when selection changes
  useEffect(() => {
    if (onSelectionChange && selectionEnabled) {
      const selectedDocuments = documents.filter(doc => 
        selectedDocumentIds.includes(doc.id)
      );
      onSelectionChange(selectedDocuments);
    }
  }, [selectedDocumentIds, documents, onSelectionChange, selectionEnabled]);
  
  // Handle document selection
  const handleSelectDocument = (document: Document) => {
    setSelectedDocumentIds(prev => {
      if (prev.includes(document.id)) {
        return prev.filter(id => id !== document.id);
      } else {
        return [...prev, document.id];
      }
    });
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="bg-danger-50 dark:bg-danger-900 dark:bg-opacity-20 text-danger-800 dark:text-danger-300 p-4 rounded-md">
        <p className="font-medium">Error loading documents</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }
  
  // Render empty state
  if (documents.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md p-8 text-center">
        <p className="text-neutral-600 dark:text-neutral-400">No documents found</p>
      </div>
    );
  }
  
  // Render documents grid
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
      {documents.map(document => (
        <DocumentCard
          key={document.id}
          document={document}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDownload={handleDownload}
          onCopy={handleCopy}
          isSelectable={selectionEnabled}
          isSelected={selectedDocumentIds.includes(document.id)}
          onSelect={selectionEnabled ? handleSelectDocument : undefined}
        />
      ))}
    </div>
  );
};

export default DocumentGrid;