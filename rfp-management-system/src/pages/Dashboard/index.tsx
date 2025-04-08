// src/pages/Dashboard/index.tsx
import React, { useState } from 'react';
import { Link } from 'react-router';
import { 
  FiFileText, 
  FiSearch, 
  FiUpload, 
  FiPieChart, 
  FiUsers, 
  FiClock, 
  FiAlertCircle,
  FiFolder,
  FiPlus
} from 'react-icons/fi';
import { format, subDays } from 'date-fns';
import { useAnalyticsOverview } from '../../hooks/useAnalytics';
import { useDocuments } from '../../hooks/useDocuments';
import { Document } from '../../types/document.types';
import PageHeader from '../../components/layout/PageHeader/PageHeader';
import ContentCard from '../../components/layout/ContentCard/ContentCard';
import Button from '../../components/common/Button/Button';
import DocumentCard from '../../components/documents/DocumentCard/DocumenCard';
import Spinner from '../../components/common/Spinner/Spinner';
import Modal from '../../components/common/Modal/Modal';
import DocumentUpload from '../../components/documents/DocumentUpload/DocumentUpload';

// Mock data for stats cards
const statsCardsData = [
  {
    title: 'Total Documents',
    value: 1245,
    change: 12.5,
    icon: <div className="text-primary-600"><FiFileText size={24} /></div>,
  },
  {
    title: 'Active Users',
    value: 38,
    change: 8.1,
    icon: <div className="text-secondary-600"><FiUsers size={24} /></div>,
  },
  {
    title: 'Processing Rate',
    value: '98.2%',
    change: 3.2,
    icon: <div className="text-success-600"><FiClock size={24} /></div>,
  },
  {
    title: 'Processing Errors',
    value: 5,
    change: -15.3,
    icon: <div className="text-danger-600"><FiAlertCircle size={24} /></div>,
    inverted: true, // For this metric, negative change is good
  },
];

// Mock data for recent activity
const recentActivityData = [
  {
    id: 1,
    type: 'upload',
    user: 'John Doe',
    document: 'Q1 Financial Report.pdf',
    timestamp: new Date(2023, 3, 15, 9, 30),
  },
  {
    id: 2,
    type: 'search',
    user: 'Jane Smith',
    searchTerm: 'procurement guidelines',
    timestamp: new Date(2023, 3, 15, 11, 15),
  },
  {
    id: 3,
    type: 'process',
    user: 'System',
    document: 'Vendor Agreement.docx',
    timestamp: new Date(2023, 3, 15, 12, 45),
  },
  {
    id: 4,
    type: 'edit',
    user: 'Mike Johnson',
    document: 'Project Proposal.pptx',
    timestamp: new Date(2023, 3, 14, 16, 20),
  },
  {
    id: 5,
    type: 'download',
    user: 'Sarah Williams',
    document: 'Technical Specs.pdf',
    timestamp: new Date(2023, 3, 14, 14, 10),
  },
];

const Dashboard: React.FC = () => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week');
  
  // Fetch analytics data
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useAnalyticsOverview(timeRange);
  
  // Fetch recent documents
  const { documents: recentDocuments, isLoading: isLoadingDocuments } = useDocuments(1, 5);
  
  // Format date for activity
  const formatActivityDate = (date: Date) => {
    const today = new Date();
    const yesterday = subDays(today, 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy h:mm a');
    }
  };
  
  // Get icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return <div className="text-primary-600"><FiUpload size={16} /></div>;
      case 'search':
        return <div className="text-secondary-600"><FiSearch size={16} /></div>;
      case 'process':
        return <div className="text-success-600"><FiClock size={16} /></div>;
      case 'edit':
        return <div className="text-warning-600"><FiFileText size={16} /></div>;
      case 'download':
        return <div className="text-info-600"><FiFileText size={16} /></div>;
      default:
        return <div className="text-neutral-600"><FiFileText size={16} /></div>;
    }
  };
  
  // Handle document upload
  const handleUpload = (files: File[]) => {
    console.log('Uploading files:', files);
    // Here you would call your API to upload the files
    // After successful upload, close the modal
    setUploadModalOpen(false);
  };
  
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your document management system"
        actions={
          <Button
            variant="primary"
            icon={<div className="text-white"><FiUpload /></div>}
            onClick={() => setUploadModalOpen(true)}
          >
            Upload New Document
          </Button>
        }
      />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCardsData.map((stat, index) => (
          <ContentCard key={index} className="border-l-4 border-l-primary-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                  {stat.value}
                </p>
              </div>
              <div className="p-3 rounded-full bg-neutral-100 dark:bg-neutral-700">
                {stat.icon}
              </div>
            </div>
            <div className="mt-2">
              <span
                className={`text-sm font-medium ${
                  stat.inverted
                    ? stat.change < 0
                      ? 'text-success-600'
                      : 'text-danger-600'
                    : stat.change > 0
                    ? 'text-success-600'
                    : 'text-danger-600'
                }`}
              >
                {stat.change > 0 ? '+' : ''}
                {stat.change}%
              </span>{' '}
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                from last {timeRange}
              </span>
            </div>
          </ContentCard>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Documents */}
        <ContentCard
          title="Recent Documents"
          headerAction={
            <Link
              to="/documents"
              className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              View All
            </Link>
          }
          className="lg:col-span-2"
        >
          {isLoadingDocuments ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : recentDocuments.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-neutral-400">
                <FiFileText size={48} />
              </div>
              <h3 className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                No documents yet
              </h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Get started by uploading your first document.
              </p>
              <div className="mt-6">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<div className="text-white"><FiUpload /></div>}
                  onClick={() => setUploadModalOpen(true)}
                >
                  Upload Document
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentDocuments.map((document: Document) => (
                <div
                  key={document.id}
                  className="flex items-center p-3 border border-neutral-200 dark:border-neutral-700 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  <div className="flex-shrink-0 mr-4 text-neutral-500">
                    <div className="text-neutral-500">
                      <FiFileText size={20} />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/documents/${document.id}`}
                      className="text-sm font-medium text-neutral-900 dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      {document.title}
                    </Link>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {document.fileName} • Uploaded {format(new Date(document.uploadedAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-4">
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </ContentCard>
        
        {/* Recent Activity */}
        <ContentCard title="Recent Activity">
          <div className="flow-root">
            <ul className="-mb-8">
              {recentActivityData.map((activity, activityIdx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {activityIdx !== recentActivityData.length - 1 ? (
                      <span
                        className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-neutral-200 dark:bg-neutral-700"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                          {getActivityIcon(activity.type)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm">
                            <span className="font-medium text-neutral-900 dark:text-neutral-100">
                              {activity.user}
                            </span>
                          </div>
                          <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                            {activity.type === 'upload' && `Uploaded ${activity.document}`}
                            {activity.type === 'search' && `Searched for "${activity.searchTerm}"`}
                            {activity.type === 'process' && `Processed ${activity.document}`}
                            {activity.type === 'edit' && `Edited ${activity.document}`}
                            {activity.type === 'download' && `Downloaded ${activity.document}`}
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                            {formatActivityDate(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </ContentCard>
      </div>
      
      {/* Collections Quick Access */}
      <div className="mt-6">
        <ContentCard
          title="Quick Access"
          subtitle="Frequently accessed collections and saved searches"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Collections */}
            <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer">
              <div className="flex items-center">
                <div className="p-2 rounded-md bg-primary-100 dark:bg-primary-900 dark:bg-opacity-30 text-primary-600 dark:text-primary-400">
                  <div className="text-primary-600 dark:text-primary-400">
                    <FiFolder size={20} />
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Recent RFPs
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    28 documents
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer">
              <div className="flex items-center">
                <div className="p-2 rounded-md bg-secondary-100 dark:bg-secondary-900 dark:bg-opacity-30 text-secondary-600 dark:text-secondary-400">
                  <div className="text-secondary-600 dark:text-secondary-400">
                    <FiFolder size={20} />
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Vendor Contracts
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    42 documents
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer">
              <div className="flex items-center">
                <div className="p-2 rounded-md bg-success-100 dark:bg-success-900 dark:bg-opacity-30 text-success-600 dark:text-success-400">
                  <div className="text-success-600 dark:text-success-400">
                    <FiSearch size={20} />
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    "compliance report"
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Saved search
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border border-dashed border-neutral-300 dark:border-neutral-600 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-6 w-6 text-neutral-400">
                  <FiPlus size={24} />
                </div>
                <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Add Collection
                </p>
              </div>
            </div>
          </div>
        </ContentCard>
      </div>
      
      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload New Document"
        size="lg"
      >
        <DocumentUpload
          onUpload={handleUpload}
          isUploading={false}
          allowMultiple={true}
        />
      </Modal>
    </div>
  );
};

export default Dashboard;






