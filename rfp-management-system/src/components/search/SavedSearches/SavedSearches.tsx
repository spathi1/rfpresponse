
// src/components/search/SavedSearches/SavedSearches.tsx

import { format } from 'date-fns';
import { FiClock, FiStar, FiTrash2, FiEdit } from 'react-icons/fi';
import { SavedSearch } from '../../../types/search.types';
import Button from '../../common/Button/Button';

interface SavedSearchesProps {
  savedSearches: SavedSearch[];
  recentSearches?: string[];
  onSelectSavedSearch: (savedSearch: SavedSearch) => void;
  onSelectRecentSearch?: (query: string) => void;
  onEditSavedSearch?: (savedSearch: SavedSearch) => void;
  onDeleteSavedSearch?: (savedSearch: SavedSearch) => void;
  className?: string;
}

const SavedSearches: React.FC<SavedSearchesProps> = ({
  savedSearches,
  recentSearches = [],
  onSelectSavedSearch,
  onSelectRecentSearch,
  onEditSavedSearch,
  onDeleteSavedSearch,
  className = '',
}) => {
  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Saved searches */}
      <div>
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-3 flex items-center">
          <FiStar className="mr-2 text-warning-500" size={18} />
          Saved Searches
        </h3>
        
        {savedSearches.length === 0 ? (
          <div className="text-sm text-neutral-500 dark:text-neutral-400 italic">
            You have no saved searches.
          </div>
        ) : (
          <ul className="space-y-2">
            {savedSearches.map((savedSearch) => (
              <li
                key={savedSearch.id}
                className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md hover:shadow-sm transition-shadow"
              >
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <button
                      className="text-base font-medium text-neutral-900 dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400"
                      onClick={() => onSelectSavedSearch(savedSearch)}
                    >
                      {savedSearch.name}
                    </button>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Query: "{savedSearch.query.query}" • Saved on {formatDate(savedSearch.createdAt)}
                      {savedSearch.lastUsedAt && ` • Last used ${formatDate(savedSearch.lastUsedAt)}`}
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    {onEditSavedSearch && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onEditSavedSearch(savedSearch)}
                        icon={<FiEdit size={14} />}
                      >
                        Edit
                      </Button>
                    )}
                    
                    {onDeleteSavedSearch && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onDeleteSavedSearch(savedSearch)}
                        icon={<FiTrash2 size={14} />}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Recent searches */}
      {recentSearches.length > 0 && onSelectRecentSearch && (
        <div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-3 flex items-center">
            <FiClock className="mr-2 text-neutral-500" size={18} />
            Recent Searches
          </h3>
          
          <ul className="space-y-1">
            {recentSearches.map((query, index) => (
              <li key={index}>
                <button
                  className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
                  onClick={() => onSelectRecentSearch(query)}
                >
                  {query}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SavedSearches;
