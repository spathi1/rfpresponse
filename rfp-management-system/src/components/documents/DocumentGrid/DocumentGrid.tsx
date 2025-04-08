// src/components/documents/DocumentGrid/DocumentGrid.tsx
import React, { useState } from 'react';
import { Document } from '../../../types/document.types';
import DocumentCard from '../DocumentCard/DocumentCard';
import Spinner from '../../common/Spinner/Spinner';

interface DocumentGridProps {
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

const DocumentGrid: React.FC<DocumentGridProps> = ({
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
  
  // Handle document selection
  const handleSelect = (document: Document) => {
    if (!allowSelection) return;
    
    const isSelected = selectedDocuments.some((doc) => doc.id === document.id);
    
    let newSelection: Document[];
    
    if (isSelected) {
      newSelection = selectedDocuments.filter((doc) => doc.id !== document.id);
    } else {
      newSelection = [...selectedDocuments, document];
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {documents.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onDownload={onDownload}
          onCopy={onCopy}
          isSelectable={allowSelection}
          isSelected={isDocumentSelected(document)}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
};

export default DocumentGrid;
