// src/pages/Documents/DocumentView.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  FiArrowLeft,
  FiEdit,
  FiDownload,
  FiTrash2,
  FiCopy,
  FiShare2,
  FiTag,
  FiFolder,
  FiLock,
  FiInfo,
  FiClock,
  FiUpload,
} from '../../components/common/Icons';
import { useDocument } from '../../hooks/useDocuments';
import PageHeader from '../../components/layout/PageHeader/PageHeader';
import ContentCard from '../../components/layout/ContentCard/ContentCard';
import Button from '../../components/common/Button/Button';
import Spinner from '../../components/common/Spinner/Spinner';
import Modal from '../../components/common/Modal/Modal';
import DocumentPreview from '../../components/documents/DocumentPreview/DocumentPreview';
import VersionHistory from '../../components/documents/VersionHistory/VersionHistory';
import { format } from 'date-fns';

const DocumentView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State for modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'metadata' | 'versions'>('preview');
  
  // Get document data
  const {
    document,
    isLoading,
    error,
    versions,
    isLoadingVersions,
    createVersion,
    isCreatingVersion,
  } = useDocument(id || '');
  
  // Handle document delete
  const handleDelete = () => {
    // This would be implemented to delete the document
    console.log('Delete document:', id);
    setDeleteModalOpen(false);
    navigate('/documents');
  };
  
  // Handle document download
  const handleDownload = () => {
    // This would be implemented to trigger a download from your API
    console.log('Download document:', id);
  };
  
  // Handle document link copy
  const handleCopyLink = () => {
    const link = `${window.location.origin}/documents/${id}`;
    navigator.clipboard.writeText(link);
    // Show a toast notification (would be implemented with a notification system)
    console.log('Link copied to clipboard:', link);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (error || !document) {
    return (
      <div>
        <PageHeader
          title="Document Not Found"
          breadcrumbs={[
            { name: 'Documents', to: '/documents' },
            { name: 'Not Found' },
          ]}
        />
        <ContentCard>
          <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
            <p className="text-lg font-medium text-danger-600 dark:text-danger-400">
              Error loading document
            </p>
            <p className="mt-1">
              The document you are looking for does not exist or you don't have permission to
              view it.
            </p>
            <div className="mt-4">
              <Button variant="primary" onClick={() => navigate('/documents')}>
                Back to Documents
              </Button>
            </div>
          </div>
        </ContentCard>
      </div>
    );
  }
  
  return (
    <div>
      <PageHeader
        title={document.title}
        description={document.fileName}
        breadcrumbs={[
          { name: 'Documents', to: '/documents' },
          { name: document.title },
        ]}
        actions={
          <div className="flex space-x-2">
            <Button variant="ghost" icon={<FiCopy />} onClick={handleCopyLink}>
              Copy Link
            </Button>
            <Button variant="ghost" icon={<FiShare2 />} onClick={() => setShareModalOpen(true)}>
              Share
            </Button>
            <Button variant="ghost" icon={<FiDownload />} onClick={handleDownload}>
              Download
            </Button>
            <Button
              variant="ghost"
              icon={<FiEdit />}
              to={`/documents/${document.id}/edit`}
            >
              Edit
            </Button>
            <Button variant="danger" icon={<FiTrash2 />} onClick={() => setDeleteModalOpen(true)}>
              Delete
            </Button>
          </div>
        }
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2">
          <ContentCard
            title="Document"
            headerAction={
              <div className="flex border border-neutral-200 dark:border-neutral-700 rounded-md overflow-hidden">
                <button
                  type="button"
                  className={`px-3 py-1 text-sm ${
                    activeTab === 'preview'
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:bg-opacity-30 dark:text-primary-300'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                  onClick={() => setActiveTab('preview')}
                >
                  Preview
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 text-sm ${
                    activeTab === 'metadata'
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:bg-opacity-30 dark:text-primary-300'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                  onClick={() => setActiveTab('metadata')}
                >
                  Metadata
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 text-sm ${
                    activeTab === 'versions'
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:bg-opacity-30 dark:text-primary-300'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                  onClick={() => setActiveTab('versions')}
                >
                  Versions
                </button>
              </div>
            }
            noPadding
          >
            {activeTab === 'preview' && (
              <div className="h-[70vh]">
                <DocumentPreview
                  document={document}
                  pdfUrl={`/api/documents/${document.id}/content`} // This would be your API endpoint
                  onDownload={handleDownload}
                />
              </div>
            )}
            
            {activeTab === 'metadata' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                  Metadata
                </h3>
                
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Basic Information
                    </h4>
                    <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-md border border-neutral-200 dark:border-neutral-700">
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                        <div>
                          <dt className="text-xs text-neutral-500 dark:text-neutral-400">Title</dt>
                          <dd className="text-sm text-neutral-900 dark:text-neutral-100">
                            {document.title}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-neutral-500 dark:text-neutral-400">
                            File Name
                          </dt>
                          <dd className="text-sm text-neutral-900 dark:text-neutral-100">
                            {document.fileName}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-neutral-500 dark:text-neutral-400">
                            File Type
                          </dt>
                          <dd className="text-sm text-neutral-900 dark:text-neutral-100">
                            {document.fileType}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-neutral-500 dark:text-neutral-400">
                            File Size
                          </dt>
                          <dd className="text-sm text-neutral-900 dark:text-neutral-100">
                            {document.fileSize} bytes
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-neutral-500 dark:text-neutral-400">Status</dt>
                          <dd className="text-sm">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                document.status === 'processed'
                                  ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:bg-opacity-30 dark:text-success-400'
                                  : document.status === 'processing'
                                  ? 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:bg-opacity-30 dark:text-warning-400'
                                  : document.status === 'error'
                                  ? 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:bg-opacity-30 dark:text-danger-400'
                                  : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300'
                              }`}
                            >
                              {document.status}
                            </span>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-neutral-500 dark:text-neutral-400">
                            Sensitivity
                          </dt>
                          <dd className="text-sm">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                document.sensitivityLevel === 'public'
                                  ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:bg-opacity-30 dark:text-success-400'
                                  : document.sensitivityLevel === 'internal'
                                  ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:bg-opacity-30 dark:text-primary-400'
                                  : document.sensitivityLevel === 'confidential'
                                  ? 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:bg-opacity-30 dark:text-warning-400'
                                  : 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:bg-opacity-30 dark:text-danger-400'
                              }`}
                            >
                              {document.sensitivityLevel}
                              {document.piiDetected && (
                                <FiLock className="ml-1 h-3 w-3" />
                              )}
                            </span>
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                  
                  {/* Document Metadata */}
                  <div>
                    <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Document Metadata
                    </h4>
                    <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-md border border-neutral-200 dark:border-neutral-700">
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                        {document.metadata.author && (
                          <div>
                            <dt className="text-xs text-neutral-500 dark:text-neutral-400">Author</dt>
                            <dd className="text-sm text-neutral-900 dark:text-neutral-100">
                              {document.metadata.author}
                            </dd>
                          </div>
                        )}
                        {document.metadata.company && (
                          <div>
                            <dt className="text-xs text-neutral-500 dark:text-neutral-400">Company</dt>
                            <dd className="text-sm text-neutral-900 dark:text-neutral-100">
                              {document.metadata.company}
                            </dd>
                          </div>
                        )}
                        {document.metadata.createdAt && (
                          <div>
                            <dt className="text-xs text-neutral-500 dark:text-neutral-400">
                              Document Created
                            </dt>
                            <dd className="text-sm text-neutral-900 dark:text-neutral-100">
                              {formatDate(document.metadata.createdAt)}
                            </dd>
                          </div>
                        )}
                        {document.metadata.language && (
                          <div>
                            <dt className="text-xs text-neutral-500 dark:text-neutral-400">Language</dt>
                            <dd className="text-sm text-neutral-900 dark:text-neutral-100">
                              {document.metadata.language}
                            </dd>
                          </div>
                        )}
                        {document.metadata.pageCount && (
                          <div>
                            <dt className="text-xs text-neutral-500 dark:text-neutral-400">
                              Page Count
                            </dt>
                            <dd className="text-sm text-neutral-900 dark:text-neutral-100">
                              {document.metadata.pageCount} pages
                            </dd>
                          </div>
                        )}
                        {document.metadata.wordCount && (
                          <div>
                            <dt className="text-xs text-neutral-500 dark:text-neutral-400">
                              Word Count
                            </dt>
                            <dd className="text-sm text-neutral-900 dark:text-neutral-100">
                              {document.metadata.wordCount} words
                            </dd>
                          </div>
                        )}
                      </dl>
                      
                      {document.metadata.industry && document.metadata.industry.length > 0 && (
                        <div className="mt-4">
                          <dt className="text-xs text-neutral-500 dark:text-neutral-400">Industry</dt>
                          <dd className="mt-1 flex flex-wrap gap-1">
                            {document.metadata.industry.map((industry: string, index: number) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300"
                              >
                                {industry}
                              </span>
                            ))}
                          </dd>
                        </div>
                      )}
                      
                      {document.metadata.summary && (
                        <div className="mt-4">
                          <dt className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                            Summary
                          </dt>
                          <dd className="text-sm text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-900 p-2 rounded border border-neutral-200 dark:border-neutral-700">
                            {document.metadata.summary}
                          </dd>
                        </div>
                      )}
                      
                      {document.metadata.keywords && document.metadata.keywords.length > 0 && (
                        <div className="mt-4">
                          <dt className="text-xs text-neutral-500 dark:text-neutral-400">Keywords</dt>
                          <dd className="mt-1 flex flex-wrap gap-1">
                            {document.metadata.keywords.map((keyword: string, index: number) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:bg-opacity-30 dark:text-primary-400"
                              >
                                {keyword}
                              </span>
                            ))}
                          </dd>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Taxonomy Categories */}
                  {document.metadata.taxonomyCategories && Object.keys(document.metadata.taxonomyCategories).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Taxonomy Categories
                      </h4>
                      <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-md border border-neutral-200 dark:border-neutral-700">
                        {Object.entries(document.metadata.taxonomyCategories).map(([category, terms]) => (
                          <div key={category} className="mb-3 last:mb-0">
                            <dt className="text-xs text-neutral-500 dark:text-neutral-400">{category}</dt>
                            <dd className="mt-1 flex flex-wrap gap-1">
                              {(terms as string[]).map((term: string, index: number) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:bg-opacity-30 dark:text-secondary-400"
                                >
                                  {term}
                                </span>
                              ))}
                            </dd>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Custom Fields */}
                  {document.metadata.customFields && Object.keys(document.metadata.customFields).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Custom Fields
                      </h4>
                      <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-md border border-neutral-200 dark:border-neutral-700">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                          {Object.entries(document.metadata.customFields).map(([key, value]) => (
                            <div key={key}>
                              <dt className="text-xs text-neutral-500 dark:text-neutral-400">{key}</dt>
                              <dd className="text-sm text-neutral-900 dark:text-neutral-100">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'versions' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                  Version History
                </h3>
                
                {/* Version Upload Button */}
                <div className="mb-6">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<FiUpload />}
                    onClick={() => {
                      // Add implementation to upload a new version
                      console.log('Upload new version');
                    }}
                  >
                    Upload New Version
                  </Button>
                </div>
                
                {/* Version List */}
                <VersionHistory
                  versions={versions || []}
                  isLoading={isLoadingVersions}
                  onViewVersion={(version) => {
                    // Add implementation to view a specific version
                    console.log('View version:', version.id);
                  }}
                  onDownloadVersion={(version) => {
                    // Add implementation to download a specific version
                    console.log('Download version:', version.id);
                  }}
                  currentVersionId={versions?.[0]?.id}
                />
              </div>
            )}
          </ContentCard>
        </div>
        
        {/* Sidebar */}
        <div>
          {/* Document Info */}
          <ContentCard title="Document Information" className="mb-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-500 dark:text-neutral-400">Uploaded by</div>
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {document.uploadedBy}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-500 dark:text-neutral-400">Uploaded on</div>
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {formatDate(document.uploadedAt)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-500 dark:text-neutral-400">Last modified by</div>
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {document.lastModifiedBy}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-500 dark:text-neutral-400">Last modified on</div>
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {formatDate(document.lastModifiedAt)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-500 dark:text-neutral-400">Version</div>
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {versions && versions.length > 0 ? versions[0].versionNumber : '1.0'}
                </div>
              </div>
            </div>
          </ContentCard>
          
          {/* Tags */}
          <ContentCard title="Tags" className="mb-6">
            {document.tags.length === 0 ? (
              <div className="text-center py-4 text-sm text-neutral-500 dark:text-neutral-400">
                No tags
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                icon={<FiTag />}
                fullWidth
                to={`/documents/${document.id}/edit`}
              >
                Edit Tags
              </Button>
            </div>
          </ContentCard>
          
          {/* Collections */}
          <ContentCard title="Collections">
            {document.collections.length === 0 ? (
              <div className="text-center py-4 text-sm text-neutral-500 dark:text-neutral-400">
                Not in any collections
              </div>
            ) : (
              <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {document.collections.map((collectionId: string, index: number) => (
                  <li key={collectionId} className="py-2">
                    <Link
                      to={`/collections/${collectionId}`}
                      className="flex items-center text-sm font-medium text-neutral-900 dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      <FiFolder className="mr-2 h-4 w-4 text-neutral-500" />
                      Collection Name {/* This would be replaced with actual collection name */}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                icon={<FiFolder />}
                fullWidth
                to={`/documents/${document.id}/edit`}
              >
                Manage Collections
              </Button>
            </div>
          </ContentCard>
        </div>
      </div>
      
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
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-neutral-700 dark:text-neutral-300">
          Are you sure you want to delete <span className="font-medium">{document.title}</span>?
          This action cannot be undone.
        </p>
      </Modal>
      
      {/* Share Modal */}
      <Modal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title="Share Document"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="share-link" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Document Link
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                id="share-link"
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={`${window.location.origin}/documents/${id}`}
                readOnly
              />
              <Button
                variant="primary"
                className="ml-3"
                onClick={handleCopyLink}
              >
                Copy
              </Button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Share with Users
            </label>
            <div className="mt-1">
              {/* This would be a user search and select component */}
              <input
                type="text"
                className="block w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Search users..."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Access Level
            </label>
            <select
              className="block w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              defaultValue="view"
            >
              <option value="view">View</option>
              <option value="edit">Edit</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Current Access
            </h4>
            {document.permissions.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                No users have been granted access to this document.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {document.permissions.map((permission: {userId: string, userName: string, accessLevel: string}, index: number) => (
                  <li key={permission.userId} className="py-2 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {permission.userName.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {permission.userName}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {permission.accessLevel} access
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="xs" icon={<FiTrash2 />}>Remove</Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="ghost" onClick={() => setShareModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary">Share</Button>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentView;
