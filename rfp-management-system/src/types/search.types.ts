// src/types/search.types.ts
export interface SearchQuery {
    query: string;
    filters: SearchFilter[];
    sort: SearchSort;
    page: number;
    limit: number;
  }
  
  export interface SearchFilter {
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'in' | 'between';
    value: any;
  }
  
  export interface SearchSort {
    field: string;
    direction: 'asc' | 'desc';
  }
  
  export interface SearchResult {
    document: Document;
    score: number;
    highlights: {
      field: string;
      snippets: string[];
    }[];
  }
  
  export interface SavedSearch {
    id: string;
    name: string;
    query: SearchQuery;
    createdAt: string;
    lastUsedAt?: string;
  }