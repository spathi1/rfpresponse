// src/components/search/SearchBar/SearchBar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX, FiFilter } from 'react-icons/fi';
import { useSearchSuggestions } from '../../../hooks/useSearch';
import Button from '../../common/Button/Button';

interface SearchBarProps {
  initialQuery?: string;
  onSearch: (query: string) => void;
  onToggleFilters?: () => void;
  showFilterButton?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  initialQuery = '',
  onSearch,
  onToggleFilters,
  showFilterButton = true,
  placeholder = 'Search documents...',
  className = '',
  autoFocus = false,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get search suggestions
  const { suggestions, isLoading } = useSearchSuggestions(query);
  
  // Set focus on mount if autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  // Update query when initialQuery changes
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);
  
  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };
  
  // Handle form submission
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(query);
  };
  
  // Clear search query
  const clearSearch = () => {
    setQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
  };
  
  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-neutral-400" />
          </div>
          
          <input
            ref={inputRef}
            type="text"
            className="block w-full pl-10 pr-10 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Delay to allow clicking suggestions
          />
          
          {query && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                type="button"
                className="text-neutral-400 hover:text-neutral-500 dark:hover:text-neutral-300"
                onClick={clearSearch}
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
        
        <div className="flex mt-2">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            icon={<FiSearch size={14} />}
            className="mr-2"
          >
            Search
          </Button>
          
          {showFilterButton && onToggleFilters && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<FiFilter size={14} />}
              onClick={onToggleFilters}
            >
              Filters
            </Button>
          )}
        </div>
      </form>
      
      {/* Suggestions dropdown */}
      {isFocused && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-neutral-800 shadow-lg rounded-md border border-neutral-200 dark:border-neutral-700 max-h-60 overflow-auto">
          <ul className="py-1">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer text-neutral-900 dark:text-neutral-100"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;

