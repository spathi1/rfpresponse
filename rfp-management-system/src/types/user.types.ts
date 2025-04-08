// src/types/user.types.ts
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    permissions: Permission[];
    settings: UserSettings;
    createdAt: string;
    lastLoginAt?: string;
    avatar?: string;
    department?: string;
    title?: string;
  }
  
  export type UserRole = 
    | 'admin'
    | 'manager'
    | 'editor'
    | 'viewer';
  
  export interface Permission {
    resource: string;
    action: 'create' | 'read' | 'update' | 'delete' | 'approve';
  }
  
  export interface UserSettings {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: {
      email: boolean;
      browser: boolean;
    };
    defaultView: 'list' | 'grid';
    itemsPerPage: number;
  }