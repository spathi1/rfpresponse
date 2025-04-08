// src/store/slices/documentsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { Document, DocumentCollection } from '../../types/document.types';

interface DocumentsState {
  recentDocuments: Document[];
  selectedDocument: Document | null;
  documentView: 'grid' | 'list';
  collections: DocumentCollection[];
  loading: boolean;
  errors: { [key: string]: string | null };
}

const initialState: DocumentsState = {
  recentDocuments: [],
  selectedDocument: null,
  documentView: 'grid',
  collections: [],
  loading: false,
  errors: {},
};

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    setRecentDocuments: (state, action: PayloadAction<Document[]>) => {
      state.recentDocuments = action.payload;
    },
    addRecentDocument: (state, action: PayloadAction<Document>) => {
      // Avoid duplicates and keep only the 10 most recent
      state.recentDocuments = [
        action.payload,
        ...state.recentDocuments.filter(doc => doc.id !== action.payload.id)
      ].slice(0, 10);
    },
    selectDocument: (state, action: PayloadAction<Document | null>) => {
      state.selectedDocument = action.payload;
    },
    setDocumentView: (state, action: PayloadAction<'grid' | 'list'>) => {
      state.documentView = action.payload;
    },
    setCollections: (state, action: PayloadAction<DocumentCollection[]>) => {
      state.collections = action.payload;
    },
    addCollection: (state, action: PayloadAction<DocumentCollection>) => {
      state.collections.push(action.payload);
    },
    updateCollection: (state, action: PayloadAction<{ id: string; updates: Partial<DocumentCollection> }>) => {
      const { id, updates } = action.payload;
      const index = state.collections.findIndex(c => c.id === id);
      if (index !== -1) {
        state.collections[index] = { ...state.collections[index], ...updates };
      }
    },
    removeCollection: (state, action: PayloadAction<string>) => {
      state.collections = state.collections.filter(c => c.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<{ key: string; error: string | null }>) => {
      state.errors[action.payload.key] = action.payload.error;
    },
  },
});

export const {
  setRecentDocuments,
  addRecentDocument,
  selectDocument,
  setDocumentView,
  setCollections,
  addCollection,
  updateCollection,
  removeCollection,
  setLoading,
  setError,
} = documentsSlice.actions;

export const selectDocuments = (state: RootState) => state.documents;

export default documentsSlice.reducer;