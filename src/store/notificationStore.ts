import { create } from 'zustand';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  created_at: string;
}

interface NotificationStore {
  activeNotifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  activeNotifications: [],
  addNotification: (notification) => set((state) => ({
    activeNotifications: [notification, ...state.activeNotifications].slice(0, 3)
  })),
  removeNotification: (id) => set((state) => ({
    activeNotifications: state.activeNotifications.filter(n => n.id !== id)
  })),
}));
