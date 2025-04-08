
// src/api/notifications.ts
import apiClient from './client/apiClient';

export const notificationsApi = {
  // Get user notifications
  getNotifications: async (
    page = 1,
    limit = 20,
    unreadOnly = false
  ) => {
    const response = await apiClient.get('/notifications', {
      params: {
        page,
        limit,
        unreadOnly,
      },
    });
    return response.data;
  },
  
  // Get notification count
  getNotificationCount: async () => {
    const response = await apiClient.get('/notifications/count');
    return response.data;
  },
  
  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },
  
  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await apiClient.patch('/notifications/read-all');
    return response.data;
  },
  
  // Delete a notification
  deleteNotification: async (notificationId: string) => {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  },
  
  // Delete all notifications
  deleteAllNotifications: async () => {
    const response = await apiClient.delete('/notifications');
    return response.data;
  },
  
  // Get notification settings
  getNotificationSettings: async () => {
    const response = await apiClient.get('/notifications/settings');
    return response.data;
  },
  
  // Update notification settings
  updateNotificationSettings: async (settings: any) => {
    const response = await apiClient.put('/notifications/settings', settings);
    return response.data;
  },
  
  // Test notification channel (email, push, etc.)
  testNotificationChannel: async (channelType: string, destination: string) => {
    const response = await apiClient.post('/notifications/test', {
      channelType,
      destination,
    });
    return response.data;
  },
};
