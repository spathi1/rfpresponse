// src/components/documents/VersionHistory/VersionHistory.tsx

import { format } from 'date-fns';
import { FiFileText, FiDownload, FiEye }  from '../../common/Icons';
import { DocumentVersion } from '../../../types/document.types';
import Spinner from '../../common/Spinner/Spinner';
import Button from '../../common/Button/Button';

interface VersionHistoryProps {
  versions: DocumentVersion[];
  isLoading?: boolean;
  onViewVersion?: (version: DocumentVersion) => void;
  onDownloadVersion?: (version: DocumentVersion) => void;
  currentVersionId?: string;
  className?: string;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({
  versions,
  isLoading = false,
  onViewVersion,
  onDownloadVersion,
  currentVersionId,
  className = '',
}) => {
  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };
  
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (versions.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
        No version history available.
      </div>
    );
  }
  
  return (
    <div className={`${className}`}>
      <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
        {versions.map((version) => (
          <li
            key={version.id}
            className={`p-4 ${
              version.id === currentVersionId ? 'bg-primary-50 dark:bg-primary-900 dark:bg-opacity-20' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3 text-neutral-500">
                  <FiFileText size={20} />
                </div>
                <div>
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center">
                    Version {version.versionNumber}
                    {version.id === currentVersionId && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:bg-opacity-50 dark:text-primary-300">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    Created {formatDate(version.createdAt)} by {version.createdBy}
                  </div>
                  {version.changeDescription && (
                    <div className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
                      {version.changeDescription}
                    </div>
                  )}
                  <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {formatFileSize(version.fileSize)}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {onViewVersion && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => onViewVersion(version)}
                    icon={<FiEye size={14} />}
                  >
                    View
                  </Button>
                )}
                
                {onDownloadVersion && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => onDownloadVersion(version)}
                    icon={<FiDownload size={14} />}
                  >
                    Download
                  </Button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VersionHistory;
      
     