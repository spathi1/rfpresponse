// src/pages/Documents/index.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  FiUpload,
  FiFilter,
  FiGrid,
  FiList,
  FiTrash2,
  FiDownload,
  FiRefreshCw,
  FiCopy,
  FiFolder,
} from 'react-icons/fi';
import { useDocuments, useCollections } from '../../hooks/useDocuments';
import { Document, DocumentStatus, DocumentCollection } from '../../types/document.types';
import PageHeader from '../../components/layout/PageHeader/PageHeader';
import DocumentGrid from '../../components/documents/DocumentGrid/DocumentGrid';
import DocumentList from '../../components/documents/DocumentList/DocumentList';
import Button from '../../components/common/Button/Button';
import Spinner from '../../components/common/Spinner/Spinner';
import Modal from '../../components/common/Modal/Modal';
import DocumentUpload from '../../components/documents/DocumentUpload/DocumentUpload';
import ContentCard from '../../components/layout/ContentCard/ContentCard';
import { selectDocuments, setDocumentView } from '../../store/slices/documentsSlice';
import { useDispatch, useSelector } from 'react-redux';

const Documents: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  // Get view preference from Redux store
  const { documentView } = useSelector(selectDocuments);
  
  // State for modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  
  // State for filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(24);
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | undefined>(undefined);
  const [collectionFilter, setCollectionFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('uploadedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  
  // State for selected documents (batch operations)
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  
  // Get documents based on filters
  const {
    documents,
    totalCount,
    isLoading,
    error,
    refetch,
    uploadDocument,
    isUploading,
    deleteDocument,
    isDeleting,
  } = useDocuments(page, limit, statusFilter, collectionFilter, sortBy, sortOrder);
  
  // Get collections for filter panel
  const { collections, isLoading: isLoadingCollections } = useCollections();
  
  // Handle view change
  const handleViewChange = (view: 'grid' | 'list') => {
    dispatch(setDocumentView(view));
  };
  
  // Handle document view
  const handleViewDocument = (document: Document) => {
    navigate(`/documents/${document.id}`);
  };
  
  // Handle document edit
  const handleEditDocument = (document: Document) => {
    navigate(`/documents/${document.id}/edit`);
  };
  
  // Handle document delete
  const handleDeleteDocument = (document: Document) => {
    setSelectedDocument(document);
    setDeleteModalOpen(true);
  };
  
  // Confirm delete
  const confirmDelete = () => {
    if (selectedDocument) {
      deleteDocument(selectedDocument.id);
      setDeleteModalOpen(false);
      setSelectedDocument(null);
    }
  };
  
  // Handle document download
  const handleDownloadDocument = (document: Document) => {
    // This would be implemented to trigger a download from your API
    console.log('Download document:', document.id);
  };
  
  // Handle document link copy
  const handleCopyDocumentLink = (document: Document) => {
    const link = `${window.location.origin}/documents/${document.id}`;
    navigator.clipboard.writeText(link);
    // Show a toast notification (would be implemented with a notification system)
    console.log('Link copied to clipboard:', link);
  };
  
  // Handle batch selection change
  const handleSelectionChange = (documents: Document[]) => {
    setSelectedDocuments(documents);
  };
  
  // Handle batch delete
  const handleBatchDelete = () => {
    // Would be implemented to delete multiple documents
    console.log('Delete selected documents:', selectedDocuments.map(doc => doc.id));
  };
  
  // Handle batch download
  const handleBatchDownload = () => {
    // Would be implemented to download multiple documents
    console.log('Download selected documents:', selectedDocuments.map(doc => doc.id));
  };
  
  // Handle document upload
  const handleUpload = (files: File[], metadata?: any) => {
    // Iterate through files and upload each one
    files.forEach(file => {
      uploadDocument({ file, metadata: { ...metadata, fileName: file.name } });
    });
    
    // Close the modal after upload is initiated
    setUploadModalOpen(false);
  };
  
  // Reset filters
  const resetFilters = () => {
    setStatusFilter(undefined);
    setCollectionFilter([]);
    setSortBy('uploadedAt');
    setSortOrder('desc');
  };
  
  // Apply filters
  const applyFilters = () => {
    // This will trigger a refetch with the updated filters
    setPage(1); // Reset to first page when filters change
    setIsFilterPanelOpen(false);
  };
  
  // Toggle filter panel
  const toggleFilterPanel = () => {
    setIsFilterPanelOpen(!isFilterPanelOpen);
  };
  
  return (
    <div>
      <PageHeader
        title="Documents"
        description="Manage and organize your documents"
        actions={
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              icon={<FiRefreshCw />}
              onClick={() => refetch()}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant="secondary"
              icon={<FiFilter />}
              onClick={toggleFilterPanel}
            >
              Filters
            </Button>
            <Button
              variant="primary"
              icon={<FiUpload />}
              onClick={() => setUploadModalOpen(true)}
            >
              Upload
            </Button>
          </div>
        }
      />
      
      <div className="mb-6">
        <ContentCard>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              {/* View toggles */}
              <div className="flex border border-neutral-200 dark:border-neutral-700 rounded-md overflow-hidden">
                <button
                  type="button"
                  className={`p-2 ${
                    documentView === 'grid'
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:bg-opacity-30 dark:text-primary-300'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                  onClick={() => handleViewChange('grid')}
                >
                  <FiGrid size={20} />
                </button>
                <button
                  type="button"
                  className={`p-2 ${
                    documentView === 'list'
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:bg-opacity-30 dark:text-primary-300'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                  onClick={() => handleViewChange('list')}
                >
                  <FiList size={20} />
                </button>
              </div>
              
              {/* Filters summary */}
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                {statusFilter && (
                  <span className="mr-2">
                    Status: <span className="font-medium">{statusFilter}</span>
                  </span>
                )}
                {collectionFilter.length > 0 && (
                  <span className="mr-2">
                    Collections: <span className="font-medium">{collectionFilter.length}</span>
                  </span>
                )}
                {(statusFilter || collectionFilter.length > 0) && (
                  <button
                    type="button"
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                    onClick={resetFilters}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
            
            {/* Batch actions */}
            {selectedDocuments.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {selectedDocuments.length} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<FiDownload />}
                  onClick={handleBatchDownload}
                >
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<FiTrash2 />}
                  onClick={handleBatchDelete}
                >
                  Delete
                </Button>
              </div>
            )}
            
            {/* Pagination info */}
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              {!isLoading && documents.length > 0 && (
                <span>
                  Showing {Math.min((page - 1) * limit + 1, totalCount || 0)} to{' '}
                  {Math.min(page * limit, totalCount || 0)} of {totalCount || 0} documents
                </span>
              )}
            </div>
          </div>
        </ContentCard>
      </div>
      
      {/* Filter Panel (would be a sidebar or expandable panel) */}
      {isFilterPanelOpen && (
        <div className="mb-6">
          <ContentCard title="Filters">
            <div className="space-y-4">
              {/* Status filter */}
              <div>
                <label
                  htmlFor="status-filter"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                >
                  Status
                </label>
                <select
                  id="status-filter"
                  className="block w-full rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={statusFilter || ''}
                  onChange={(e) => setStatusFilter(e.target.value as DocumentStatus || undefined)}
                >
                  <option value="">All Statuses</option>
                  <option value="uploading">Uploading</option>
                  <option value="processing">Processing</option>
                  <option value="processed">Processed</option>
                  <option value="error">Error</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              
              {/* Collections filter */}
              {!isLoadingCollections && collections.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Collections
                  </label>
                  <div className="max-h-52 overflow-y-auto border border-neutral-200 dark:border-neutral-700 rounded-md">
                    {collections.map((collection: DocumentCollection) => (
                      <div
                        key={collection.id}
                        className="flex items-center px-3 py-2 border-b border-neutral-200 dark:border-neutral-700 last:border-b-0"
                      >
                        <input
                          id={`collection-${collection.id}`}
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 dark:border-neutral-700 rounded"
                          checked={collectionFilter.includes(collection.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCollectionFilter([...collectionFilter, collection.id]);
                            } else {
                              setCollectionFilter(
                                collectionFilter.filter((id) => id !== collection.id)
                              );
                            }
                          }}
                        />
                        <label
                          htmlFor={`collection-${collection.id}`}
                          className="ml-2 block text-sm text-neutral-700 dark:text-neutral-300"
                        >
                          {collection.name} ({collection.documentCount})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Sort options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="sort-by"
                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                  >
                    Sort By
                  </label>
                  <select
                    id="sort-by"
                    className="block w-full rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="uploadedAt">Upload Date</option>
                    <option value="lastModifiedAt">Modified Date</option>
                    <option value="title">Title</option>
                    <option value="fileName">File Name</option>
                    <option value="fileSize">File Size</option>
                  </select>
                </div>
                
                <div>
                  <label
                    htmlFor="sort-order"
                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                  >
                    Sort Order
                  </label>
                  <select
                    id="sort-order"
                    className="block w-full rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <Button variant="ghost" onClick={resetFilters}>
                  Reset
                </Button>
                <Button variant="primary" onClick={applyFilters}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </ContentCard>
        </div>
      )}
      
      {/* Documents display */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <ContentCard>
          <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
            <p className="text-lg font-medium text-danger-600 dark:text-danger-400">
              Error loading documents
            </p>
            <p className="mt-1">Please try again or contact support if the problem persists.</p>
            <div className="mt-4">
              <Button variant="primary" size="sm" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          </div>
        </ContentCard>
      ) : documents.length === 0 ? (
        <ContentCard>
          <div className="text-center py-12">
            <FiFolder className="mx-auto h-12 w-12 text-neutral-400" />
            <h3 className="mt-2 text-lg font-medium text-neutral-900 dark:text-neutral-100">
              No documents found
            </h3>
            <p className="mt-1 text-neutral-500 dark:text-neutral-400">
              {statusFilter || collectionFilter.length > 0
                ? 'Try adjusting your filters or upload a new document.'
                : 'Get started by uploading your first document.'}
            </p>
            <div className="mt-6">
              <Button
                variant="primary"
                icon={<FiUpload />}
                onClick={() => setUploadModalOpen(true)}
              >
                Upload Document
              </Button>
            </div>
          </div>
        </ContentCard>
      ) : (
        <div>
          {documentView === 'grid' ? (
            <DocumentGrid
              documents={documents}
              onView={handleViewDocument}
              onEdit={handleEditDocument}
              onDelete={handleDeleteDocument}
              onDownload={handleDownloadDocument}
              onCopy={handleCopyDocumentLink}
              allowSelection={true}
              onSelectionChange={handleSelectionChange}
            />
          ) : (
            <DocumentList
              documents={documents}
              onView={handleViewDocument}
              onEdit={handleEditDocument}
              onDelete={handleDeleteDocument}
              onDownload={handleDownloadDocument}
              onCopy={handleCopyDocumentLink}
              allowSelection={true}
              onSelectionChange={handleSelectionChange}
            />
          )}
          
          {/* Pagination controls */}
          {totalCount > limit && (
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                Page {page} of {Math.ceil((totalCount || 0) / limit)}
              </span>
              <Button
                variant="ghost"
                onClick={() => setPage(page + 1)}
                disabled={page * limit >= (totalCount || 0)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Documents"
        size="lg"
      >
        <DocumentUpload
          onUpload={handleUpload}
          isUploading={isUploading}
          allowMultiple={true}
        />
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Document"
        size="sm"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} isLoading={isDeleting}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-neutral-700 dark:text-neutral-300">
          Are you sure you want to delete{' '}
          <span className="font-medium">{selectedDocument?.title}</span>? This action cannot
          be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Documents;



