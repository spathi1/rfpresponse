// src/components/search/FilterPanel/FilterPanel.tsx
import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiX } from '../../common/Icons';
import Button from '../../common/Button/Button';
import { SearchFilter } from '../../../types/search.types';

interface FilterGroup {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'dateRange' | 'text' | 'range';
  field: string;
  options?: { value: string; label: string }[];
  isExpanded?: boolean;
}

interface FilterPanelProps {
  filters: SearchFilter[];
  onFilterChange: (filters: SearchFilter[]) => void;
  filterGroups: FilterGroup[];
  className?: string;
  onApply?: () => void;
  onReset?: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  filterGroups,
  className = '',
  onApply,
  onReset,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    filterGroups.reduce((acc, group) => {
      acc[group.id] = group.isExpanded !== false; // Default to expanded unless explicitly set to false
      return acc;
    }, {} as Record<string, boolean>)
  );
  
  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };
  
  // Get filter value for a field
  const getFilterValue = (field: string): any => {
    const filter = filters.find(f => f.field === field);
    return filter ? filter.value : null;
  };
  
  // Update filter
  const updateFilter = (field: string, operator: SearchFilter['operator'], value: any) => {
    // If value is empty or null, remove the filter
    if (value === '' || value === null || (Array.isArray(value) && value.length === 0)) {
      onFilterChange(filters.filter(f => f.field !== field));
      return;
    }
    
    // Check if filter already exists
    const filterIndex = filters.findIndex(f => f.field === field);
    
    if (filterIndex !== -1) {
      // Update existing filter
      const updatedFilters = [...filters];
      updatedFilters[filterIndex] = { field, operator, value };
      onFilterChange(updatedFilters);
    } else {
      // Add new filter
      onFilterChange([...filters, { field, operator, value }]);
    }
  };
  
  // Reset all filters
  const handleReset = () => {
    onFilterChange([]);
    if (onReset) {
      onReset();
    }
  };
  
  // Apply filters
  const handleApply = () => {
    if (onApply) {
      onApply();
    }
  };
  
  // Check if any filters are applied
  const hasActiveFilters = filters.length > 0;
  
  return (
    <div className={`bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-sm ${className}`}>
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
            Filters
          </h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="xs"
              onClick={handleReset}
              icon={<FiX size={14} />}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {filterGroups.map((group) => (
          <div key={group.id} className="border-b border-neutral-200 dark:border-neutral-700 pb-4 last:border-b-0 last:pb-0">
            <button
              type="button"
              className="flex items-center justify-between w-full text-left font-medium text-neutral-900 dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400"
              onClick={() => toggleGroup(group.id)}
            >
              <span>{group.label}</span>
              {expandedGroups[group.id] ? (
                <FiChevronUp className="h-5 w-5" />
              ) : (
                <FiChevronDown className="h-5 w-5" />
              )}
            </button>
            
            {expandedGroups[group.id] && (
              <div className="mt-2">
                {group.type === 'select' && group.options && (
                  <select
                    className="block w-full mt-1 rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    value={getFilterValue(group.field) || ''}
                    onChange={(e) => updateFilter(group.field, 'eq', e.target.value || null)}
                  >
                    <option value="">All</option>
                    {group.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                
                {group.type === 'multiselect' && group.options && (
                  <div className="space-y-2 mt-1">
                    {group.options.map((option) => {
                      const filterValue = getFilterValue(group.field) || [];
                      const isChecked = Array.isArray(filterValue) && filterValue.includes(option.value);
                      
                      return (
                        <div key={option.value} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`${group.id}-${option.value}`}
                            className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                            checked={isChecked}
                            onChange={(e) => {
                              const currentValues = Array.isArray(filterValue) ? [...filterValue] : [];
                              
                              if (e.target.checked) {
                                updateFilter(group.field, 'in', [...currentValues, option.value]);
                              } else {
                                updateFilter(
                                  group.field,
                                  'in',
                                  currentValues.filter((v) => v !== option.value)
                                );
                              }
                            }}
                          />
                          <label
                            htmlFor={`${group.id}-${option.value}`}
                            className="ml-2 block text-sm text-neutral-700 dark:text-neutral-300"
                          >
                            {option.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {group.type === 'date' && (
                  <input
                    type="date"
                    className="block w-full mt-1 rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    value={getFilterValue(group.field) || ''}
                    onChange={(e) => updateFilter(group.field, 'eq', e.target.value || null)}
                  />
                )}
                
                {group.type === 'dateRange' && (
                  <div className="space-y-2 mt-1">
                    <div>
                      <label
                        className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                        htmlFor={`${group.id}-from`}
                      >
                        From
                      </label>
                      <input
                        type="date"
                        id={`${group.id}-from`}
                        className="block w-full mt-1 rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        value={(getFilterValue(group.field) || [])[0] || ''}
                        onChange={(e) => {
                          const currentValue = getFilterValue(group.field) || ['', ''];
                          updateFilter(group.field, 'between', [
                            e.target.value,
                            currentValue[1] || '',
                          ]);
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                        htmlFor={`${group.id}-to`}
                      >
                        To
                      </label>
                      <input
                        type="date"
                        id={`${group.id}-to`}
                        className="block w-full mt-1 rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        value={(getFilterValue(group.field) || ['', ''])[1] || ''}
                        onChange={(e) => {
                          const currentValue = getFilterValue(group.field) || ['', ''];
                          updateFilter(group.field, 'between', [
                            currentValue[0] || '',
                            e.target.value,
                          ]);
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {group.type === 'text' && (
                  <input
                    type="text"
                    className="block w-full mt-1 rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    value={getFilterValue(group.field) || ''}
                    onChange={(e) => updateFilter(group.field, 'contains', e.target.value || null)}
                    placeholder={`Filter by ${group.label.toLowerCase()}`}
                  />
                )}
                
                {group.type === 'range' && (
                  <div className="space-y-2 mt-1">
                    <div>
                      <label
                        className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                        htmlFor={`${group.id}-min`}
                      >
                        Min
                      </label>
                      <input
                        type="number"
                        id={`${group.id}-min`}
                        className="block w-full mt-1 rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        value={(getFilterValue(group.field) || [])[0] || ''}
                        onChange={(e) => {
                          const currentValue = getFilterValue(group.field) || ['', ''];
                          updateFilter(group.field, 'between', [
                            e.target.value === '' ? null : Number(e.target.value),
                            currentValue[1],
                          ]);
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                        htmlFor={`${group.id}-max`}
                      >
                        Max
                      </label>
                      <input
                        type="number"
                        id={`${group.id}-max`}
                        className="block w-full mt-1 rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        value={(getFilterValue(group.field) || ['', ''])[1] || ''}
                        onChange={(e) => {
                          const currentValue = getFilterValue(group.field) || ['', ''];
                          updateFilter(group.field, 'between', [
                            currentValue[0],
                            e.target.value === '' ? null : Number(e.target.value),
                          ]);
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 flex justify-end space-x-2">
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Reset
        </Button>
        <Button variant="primary" size="sm" onClick={handleApply}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
};

export default FilterPanel;

