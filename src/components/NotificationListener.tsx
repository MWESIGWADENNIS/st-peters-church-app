import React, { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import { toast } from 'react-hot-toast';
import { Bell, Megaphone, Calendar, MessageSquare, PlayCircle, CheckCircle2 } from 'lucide-react';

const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export const NotificationListener: React.FC = () => {
  const { user } = useAuthStore();
  const { setUnreadCount } = useDataStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Audio play blocked by browser. Interaction required.'));
    }
  };

  const showNotificationToast = (notification: any) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-2xl rounded-3xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden border-2 border-primary/10 transition-all duration-300 hover:scale-[1.02]`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <div className="w-10 h-10 bg-lavender rounded-xl flex items-center justify-center text-primary shadow-inner">
                {getIcon(notification.type)}
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-black text-gray-900">
                {notification.title}
              </p>
              <p className="mt-1 text-xs font-medium text-gray-500 line-clamp-2 leading-relaxed">
                {notification.body}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-100">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-xs font-black text-primary hover:bg-gray-50 focus:outline-none transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    ), { duration: 6000 });
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
    if (!user) return;

    // Initialize audio
    audioRef.current = new Audio(NOTIFICATION_SOUND);
    audioRef.current.volume = 0.5;

    // Initial fetch
    fetchUnreadCount();
    catchUpNotifications();

    // Polling fallback (every 30 seconds)
    const pollInterval = setInterval(() => {
      fetchUnreadCount();
      catchUpNotifications();
    }, 30000);

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all changes (INSERT for new, UPDATE for read status)
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const notification = payload.new;
            playNotificationSound();
            showNotificationToast(notification);
          }
          // Always refresh count on any change
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [user]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'announcement': return <Megaphone className="w-5 h-5" />;
      case 'event': return <Calendar className="w-5 h-5" />;
      case 'sermon': return <MessageSquare className="w-5 h-5" />;
      case 'live': return <PlayCircle className="w-5 h-5" />;
      case 'ministry': return <CheckCircle2 className="w-5 h-5" />;
      case 'video': return <PlayCircle className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  return null;
};
