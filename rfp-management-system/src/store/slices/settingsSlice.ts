// src/store/slices/settingsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

interface SettingsState {
  general: {
    language: string;
    dateFormat: string;
    itemsPerPage: number;
  };
  notifications: {
    email: boolean;
    browser: boolean;
    desktop: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
  };
  display: {
    defaultView: 'grid' | 'list';
    compactMode: boolean;
    showThumbnails: boolean;
  };
}

const initialState: SettingsState = {
  general: {
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    itemsPerPage: 25,
  },
  notifications: {
    email: true,
    browser: true,
    desktop: false,
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 30, // minutes
  },
  display: {
    defaultView: 'grid',
    compactMode: false,
    showThumbnails: true,
  },
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateGeneralSettings: (state, action: PayloadAction<Partial<SettingsState['general']>>) => {
      state.general = { ...state.general, ...action.payload };
    },
    updateNotificationSettings: (state, action: PayloadAction<Partial<SettingsState['notifications']>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    updateSecuritySettings: (state, action: PayloadAction<Partial<SettingsState['security']>>) => {
      state.security = { ...state.security, ...action.payload };
    },
    updateDisplaySettings: (state, action: PayloadAction<Partial<SettingsState['display']>>) => {
      state.display = { ...state.display, ...action.payload };
    },
    resetSettings: () => initialState,
  },
});

export const {
  updateGeneralSettings,
  updateNotificationSettings,
  updateSecuritySettings,
  updateDisplaySettings,
  resetSettings,
} = settingsSlice.actions;

export const selectSettings = (state: RootState) => state.settings;

export default settingsSlice.reducer;