import React, { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import { useNotificationStore } from '../store/notificationStore';
import { toast } from 'react-hot-toast';
import { Bell, Megaphone, Calendar, MessageSquare, PlayCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export const NotificationListener: React.FC = () => {
  const { user } = useAuthStore();
  const { setUnreadCount } = useDataStore();
  const { addNotification } = useNotificationStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Silently fail if audio is blocked by browser
        console.log('[Notifications] Audio playback blocked by browser - showing visual only');
      });
    }
  };

  const showNotificationToast = (notification: any) => {
    console.log('[Notifications] Showing notification:', notification.title);
    
    // Custom overlay store (Matches app theme)
    addNotification({
      id: notification.id || Math.random().toString(),
      title: notification.title,
      body: notification.body,
      type: notification.type,
      created_at: notification.created_at || new Date().toISOString()
    });
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      if (error) throw error;
      if (count !== null) {
        setUnreadCount(count);
        console.log(`[Notifications] Unread count for ${user.id}: ${count}`);
      }
    } catch (error) {
      console.error('[Notifications] Error fetching unread count:', error);
    }
  };

  const catchUpNotifications = async () => {
    if (!user) return;
    console.log('[Notifications] Checking for missed notifications...');
    
    // Fetch unread notifications that haven't been "toasted" yet
    // We'll use a session storage flag to avoid re-toasting on every refresh if they are still unread
    const toastedIds = JSON.parse(sessionStorage.getItem('toasted_notifications') || '[]');
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_read', false)
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      const newToasts = data.filter(n => !toastedIds.includes(n.id));
      
      if (newToasts.length > 0) {
        // Play sound once for the batch
        playNotificationSound();
        
        // Show toasts with a slight delay between them
        newToasts.forEach((n, index) => {
          setTimeout(() => {
            showNotificationToast(n);
          }, index * 1000);
        });

        // Update session storage
        const updatedToastedIds = [...toastedIds, ...newToasts.map(n => n.id)];
        sessionStorage.setItem('toasted_notifications', JSON.stringify(updatedToastedIds));
      }
    }
  };

  useEffect(() => {
    console.log('[Notifications] Listener mounted. User:', user?.id);
    if (!user) {
      console.log('[Notifications] No user found, skipping subscription.');
      return;
    }

    // Initialize audio
    audioRef.current = new Audio(NOTIFICATION_SOUND);
    audioRef.current.volume = 0.5;

    // Initial fetch
    console.log('[Notifications] Performing initial fetch...');
    fetchUnreadCount();
    catchUpNotifications();

    // Polling fallback (every 30 seconds)
    const pollInterval = setInterval(() => {
      console.log('[Notifications] Polling fallback check...');
      fetchUnreadCount();
      catchUpNotifications();
    }, 30000);

    // Listen for manual check requests
    const handleManualCheck = () => {
      console.log('[Notifications] Manual check triggered');
      fetchUnreadCount();
      catchUpNotifications();
    };
    window.addEventListener('check-notifications', handleManualCheck);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('[Notifications] App visible, re-syncing...');
        fetchUnreadCount();
        catchUpNotifications();
      }
    });

    console.log(`[Notifications] Subscribing to all notification channels...`);
    
    // 1. Database Changes Channel
    const dbChannel = supabase
      .channel('db-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          if (payload.new.user_id === user.id) {
            console.log('[Notifications] DB Insert received:', payload.new.title);
            playNotificationSound();
            showNotificationToast(payload.new);
            fetchUnreadCount();
          }
        }
      )
      .subscribe();

    // 2. Direct Broadcast Channel (Faster, bypasses DB)
    const broadcastChannel = supabase
      .channel('notification-system')
      .on(
        'broadcast',
        { event: 'new-notification' },
        (payload) => {
          if (payload.payload.user_id === user.id) {
            console.log('[Notifications] Broadcast received:', payload.payload.title);
            playNotificationSound();
            showNotificationToast(payload.payload);
            fetchUnreadCount();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dbChannel);
      supabase.removeChannel(broadcastChannel);
      clearInterval(pollInterval);
      window.removeEventListener('check-notifications', handleManualCheck);
    };
  }, [user]);

  if (!user) return null;

  return null;
};
