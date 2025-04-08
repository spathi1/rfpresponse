// src/pages/Dashboard/index.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiFileText, 
  FiUpload, 
  FiUsers, 
  FiClock, 
  FiAlertCircle,
  FiFolder,
  FiPlus,
  FiCalendar,
  FiArrowUp,
  FiArrowDown
} from '../../components/common/Icons';
import { format } from 'date-fns';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import DocumentUpload from '../../components/documents/DocumentUpload/DocumentUpload';

// Type definitions for hooks
interface AnalyticsData {
  documentCount: number;
  activeUsers: number;
  processingRate: number;
  processingErrors: number;
}

interface AnalyticsResult {
  data: AnalyticsData;
  isLoading: boolean;
  error: Error | null;
}

// Use your mocked useAnalyticsOverview hook
const useAnalyticsOverview = (timeRange: string): AnalyticsResult => {
  return {
    data: {
      documentCount: 1245,
      activeUsers: 38,
      processingRate: 98.2,
      processingErrors: 5
    },
    isLoading: false,
    error: null
  };
};

// Similarly mock the useDocuments hook for now
const useDocuments = (page: number, limit: number) => {
  return {
    documents: [],
    isLoading: false,
    error: null
  };
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week');
  
  // Fetch analytics data
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useAnalyticsOverview(timeRange);
  
  // Fetch recent documents
  const { documents: recentDocuments, isLoading: isLoadingDocuments } = useDocuments(1, 5);
  
  // Handle document upload
  const handleUpload = (files: File[]) => {
    console.log('Uploading files:', files);
    setUploadModalOpen(false);
  };

  // Stat cards data
  const statCards = [
    {
      title: 'Total Documents',
      value: analyticsData?.documentCount || 0,
      change: 12.5,
      icon: <FiFileText size={24} className="text-blue-500" />,
      color: 'blue'
    },
    {
      title: 'Active Users',
      value: analyticsData?.activeUsers || 0,
      change: 8.1,
      icon: <FiUsers size={24} className="text-indigo-500" />,
      color: 'indigo'
    },
    {
      title: 'Processing Rate',
      value: `${analyticsData?.processingRate || 0}%`,
      change: 3.2,
      icon: <FiClock size={24} className="text-green-500" />,
      color: 'green'
    },
    {
      title: 'Processing Errors',
      value: analyticsData?.processingErrors || 0,
      change: -15.3,
      icon: <FiAlertCircle size={24} className="text-red-500" />,
      color: 'red',
      inverted: true
    }
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Overview of your document management system
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            onClick={() => setUploadModalOpen(true)}
          >
            <FiUpload className="mr-2" /> Upload New Document
          </Button>
        </div>
      </div>

      {/* Time range selector */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <FiCalendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Range:</span>
          <div className="relative inline-block">
            <select
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md py-1 pl-3 pr-8 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as 'day' | 'week' | 'month' | 'year')}
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div 
            key={index} 
            className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-md bg-gray-100 dark:bg-gray-700">
                    {stat.icon}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      {stat.title}
                    </dt>
                    <dd>
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {stat.value}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-5 py-2">
              <div className="flex items-center">
                {stat.change > 0 ? (
                  <FiArrowUp className={`h-4 w-4 ${stat.inverted ? 'text-red-500' : 'text-green-500'}`} />
                ) : (
                  <FiArrowDown className={`h-4 w-4 ${stat.inverted ? 'text-green-500' : 'text-red-500'}`} />
                )}
                <span 
                  className={`text-sm font-medium ml-1 ${
                    stat.inverted
                      ? stat.change < 0 ? 'text-green-500' : 'text-red-500'
                      : stat.change > 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {Math.abs(stat.change)}%
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">from last {timeRange}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Recent Documents Card */}
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Recent Documents
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Latest uploaded and modified documents
            </p>
          </div>
          <button 
            onClick={() => navigate('/documents')}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
          >
            View All
          </button>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-6">
          {isLoadingDocuments ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentDocuments && recentDocuments.length > 0 ? (
                recentDocuments.map((doc, idx) => (
                  <div key={idx} className="py-3 flex items-center">
                    <div className="flex-shrink-0">
                      <FiFileText className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Document Title</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Uploaded on {format(new Date(), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div>
                      <button 
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500"
                        onClick={() => navigate(`/documents/1`)}
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <FiFolder className="h-12 w-12 text-gray-400 mx-auto" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No documents</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Get started by uploading your first document
                  </p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => setUploadModalOpen(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FiUpload className="-ml-1 mr-2 h-4 w-4" />
                      Upload a document
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
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