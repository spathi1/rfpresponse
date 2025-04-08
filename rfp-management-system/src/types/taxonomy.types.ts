// src/types/taxonomy.types.ts
export interface TaxonomyCategory {
    id: string;
    name: string;
    description?: string;
    parentId?: string;
    children?: TaxonomyCategory[];
  }
  
  export interface TaxonomyTerm {
    id: string;
    name: string;
    categoryId: string;
    parentId?: string;
    children?: TaxonomyTerm[];
    synonyms?: string[];
  }