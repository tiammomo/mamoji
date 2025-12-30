import { create } from 'zustand';
import { NOTIFICATION_TYPE, type NotificationType } from '@/lib/constants';

// 通知
export interface Notification {
  notificationId: number;
  userId: number;
  type: NotificationType;
  title: string;
  content: string;
  data?: Record<string, unknown>;
  isRead: number;
  createdAt: string;
}

// 通知状态
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: number) => void;
  markAllAsRead: () => void;
  setUnreadCount: (count: number) => void;
  removeNotification: (notificationId: number) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  setNotifications: (notifications: Notification[]) => {
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    set({ notifications, unreadCount });
  },

  addNotification: (notification: Notification) => {
    const notifications = [notification, ...get().notifications];
    const unreadCount = get().unreadCount + (notification.isRead ? 0 : 1);
    set({ notifications, unreadCount });
  },

  markAsRead: (notificationId: number) => {
    const notifications = get().notifications.map((n) =>
      n.notificationId === notificationId ? { ...n, isRead: 1 } : n
    );
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    set({ notifications, unreadCount });
  },

  markAllAsRead: () => {
    const notifications = get().notifications.map((n) => ({ ...n, isRead: 1 }));
    set({ notifications, unreadCount: 0 });
  },

  setUnreadCount: (count: number) => {
    set({ unreadCount: count });
  },

  removeNotification: (notificationId: number) => {
    const notifications = get().notifications.filter(
      (n) => n.notificationId !== notificationId
    );
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    set({ notifications, unreadCount });
  },
}));

// 选择器
export const useNotifications = () =>
  useNotificationStore((state) => state.notifications);
export const useUnreadCount = () =>
  useNotificationStore((state) => state.unreadCount);
