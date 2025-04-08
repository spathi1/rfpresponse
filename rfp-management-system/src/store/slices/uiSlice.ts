// src/store/slices/uiSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

interface UiState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  notifications: {
    unread: number;
  };
  modalState: {
    [key: string]: boolean;
  };
  isMobile: boolean;
}

const initialState: UiState = {
  theme: 'system',
  sidebarOpen: true,
  notifications: {
    unread: 0,
  },
  modalState: {},
  isMobile: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setUnreadNotifications: (state, action: PayloadAction<number>) => {
      state.notifications.unread = action.payload;
    },
    decrementUnreadNotifications: (state) => {
      if (state.notifications.unread > 0) {
        state.notifications.unread -= 1;
      }
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.modalState[action.payload] = true;
    },
    closeModal: (state, action: PayloadAction<string>) => {
      state.modalState[action.payload] = false;
    },
    setIsMobile: (state, action: PayloadAction<boolean>) => {
      state.isMobile = action.payload;
      if (action.payload) {
        state.sidebarOpen = false;
      }
    },
  },
});

export const {
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  setUnreadNotifications,
  decrementUnreadNotifications,
  openModal,
  closeModal,
  setIsMobile,
} = uiSlice.actions;

export const selectUI = (state: RootState) => state.ui;

export default uiSlice.reducer;