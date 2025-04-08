// src/components/search/SearchResults/SearchResults.tsx

import { FiFileText, FiEye } from 'react-icons/fi';
import Spinner from '../../common/Spinner/Spinner';
import { SearchResult } from '../../../types/search.types';
import Button from '../../common/Button/Button';

interface SearchResultsProps {
  results: SearchResult[];
  isLoading?: boolean;
  totalCount?: number;
  onViewDocument?: (documentId: string) => void;
  className?: string;
  query?: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  isLoading = false,
  totalCount = 0,
  onViewDocument,
  className = '',
  query = '',
}) => {
  // Highlight search terms in text
  const highlightText = (text: string, highlightTerms: string[] = []) => {
    if (!text || highlightTerms.length === 0) return text;
    
    // Create a regex to match all terms
    const regex = new RegExp(
      `(${highlightTerms.map(term => term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})`,
      'gi'
    );
    
    // Split the text by matches
    const parts = text.split(regex);
    
    return parts.map((part, i) => {
      // Check if this part matches any of the highlight terms
      if (highlightTerms.some(term => part.toLowerCase() === term.toLowerCase())) {
        return <span key={i} className="bg-yellow-200 dark:bg-yellow-700 dark:bg-opacity-70">{part}</span>;
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };
  
  // Display loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // Display no results message
  if (results.length === 0) {
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
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          ></path>
        </svg>
        <p className="text-lg font-medium">No results found</p>
        <p className="text-sm mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }
  
  // Prepare search terms for highlighting
  const searchTerms = query.split(/\s+/).filter(term => term.length > 2);
  
  return (
    <div className={className}>
      <div className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
        Found {totalCount} {totalCount === 1 ? 'result' : 'results'} for "{query}"
      </div>
      
      <div className="space-y-4">
        {results.map((result) => (
          <div
            key={result.document.id}
            className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3 text-neutral-500">
                <FiFileText size={20} />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400">
                  {highlightText(result.document.title, searchTerms)}
                </h3>
                
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {result.document.fileName} • Last modified {new Date(result.document.lastModifiedAt).toLocaleDateString()}
                </p>
                
                {result.highlights.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {result.highlights.map((highlight, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">
                          {highlight.field}:
                        </span>
                        <div className="mt-1 text-neutral-600 dark:text-neutral-400 border-l-2 border-neutral-300 dark:border-neutral-700 pl-3">
                          {highlight.snippets.map((snippet, idx) => (
                            <p key={idx} className="mb-1">
                              {highlightText(snippet, searchTerms)}...
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {onViewDocument && (
                  <div className="mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDocument(result.document.id)}
                      icon={<FiEye size={14} />}
                    >
                      View Document
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="ml-4 text-right flex-shrink-0">
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Score: {Math.round(result.score * 100)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
