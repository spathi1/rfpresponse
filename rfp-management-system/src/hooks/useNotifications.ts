// src/hooks/useNotifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notification';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { setUnreadNotifications } from '../store/slices/uiSlice';

interface NotificationCount {
  unread: number;
}

export const useNotifications = (
  page = 1,
  limit = 20,
  unreadOnly = false
) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications', page, limit, unreadOnly],
    queryFn: () => notificationsApi.getNotifications(page, limit, unreadOnly),
    placeholderData: (oldData) => oldData,
  });
  
  // Get notification count with proper typing
  const countQuery = useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: () => notificationsApi.getNotificationCount() as Promise<NotificationCount>,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
  
  // Handle unread notifications in a separate effect
  if (countQuery.data) {
    dispatch(setUnreadNotifications(countQuery.data.unread));
  }
  
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationsApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['notifications']});
    },
  });
  
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['notifications']});
      toast.success('All notifications marked as read');
    },
    onError: (error: any) => {
      toast.error(`Failed to mark all as read: ${error.message}`);
    },
  });
  
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => notificationsApi.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['notifications']});
    },
  });
  
  const deleteAllNotificationsMutation = useMutation({
    mutationFn: () => notificationsApi.deleteAllNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications deleted');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete all notifications: ${error.message}`);
    },
  });
  
  return {
    notifications: data?.notifications || [],
    totalCount: data?.totalCount || 0,
    unreadCount: countQuery.data?.unread || 0,
    isLoading,
    error,
    refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    deleteAllNotifications: deleteAllNotificationsMutation.mutate,
  };
};

export const useNotificationSettings = () => {
  const queryClient = useQueryClient();
  
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications', 'settings'],
    queryFn: () => notificationsApi.getNotificationSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const updateSettingsMutation = useMutation({
    mutationFn: (updatedSettings: any) => notificationsApi.updateNotificationSettings(updatedSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'settings'] });
      toast.success('Notification settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update notification settings: ${error.message}`);
    },
  });
  
  const testChannelMutation = useMutation({
    mutationFn: (params: { channelType: string; destination: string }) =>
      notificationsApi.testNotificationChannel(params.channelType, params.destination),
    onSuccess: () => {
      toast.success('Test notification sent successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to send test notification: ${error.message}`);
    }
  });
  
  return {
    settings,
    isLoading,
    error,
    refetch,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
    testChannel: testChannelMutation.mutate,
    isTesting: testChannelMutation.isPending,
  };
};