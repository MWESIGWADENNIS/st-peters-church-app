import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Bell, ChevronLeft, CheckCircle2, Trash2, Clock, Megaphone, Calendar, MessageSquare, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications_list_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
      }, (payload: any) => {
        console.log('[NotificationsPage] Change detected:', payload);
        if ((payload.new && payload.new.user_id === user.id) || (payload.old && payload.old.user_id === user.id)) {
          fetchNotifications();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) {
        setNotifications(data);
        setLastChecked(new Date());
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user?.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All marked as read');
    } catch (error) {
      toast.error('Failed to update notifications');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await supabase.from('notifications').delete().eq('id', id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'announcement': return Megaphone;
      case 'event': return Calendar;
      case 'sermon': return MessageSquare;
      case 'live': return PlayCircle;
      case 'ministry': return CheckCircle2;
      case 'video': return PlayCircle;
      default: return Bell;
    }
  };

  return (
    <div className="min-h-screen bg-white pb-12">
      <div className="p-4 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-gray-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-black text-primary leading-none">Notifications</h1>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              Refreshed: {format(lastChecked, 'HH:mm:ss')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'admin' && (
            <button 
              onClick={async () => {
                const { error } = await supabase.rpc('notify_user', {
                  target_user_id: user.id,
                  notif_title: '🔔 Manual Test',
                  notif_body: 'Testing from the notifications page.',
                  notif_type: 'general'
                });
                if (!error) {
                  window.dispatchEvent(new CustomEvent('check-notifications'));
                  toast.success('Test sent!');
                }
              }}
              className="p-2 text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
              title="Send Test"
            >
              <Bell className="w-5 h-5" />
            </button>
          )}
          <button 
            onClick={() => {
              sessionStorage.removeItem('toasted_notifications');
              fetchNotifications();
              toast.success('Refreshing...');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95"
          >
            <Clock className="w-4 h-4" />
            Refresh
          </button>
          {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            <button 
              onClick={markAllAsRead}
              className="text-[10px] font-black text-primary px-3 py-1.5 bg-lavender rounded-full uppercase tracking-widest"
            >
              Mark all read
            </button>
            <button 
              onClick={async () => {
                if (!confirm('Delete all notifications?')) return;
                try {
                  await supabase.from('notifications').delete().eq('user_id', user?.id);
                  setNotifications([]);
                  toast.success('Cleared all');
                } catch (error) {
                  toast.error('Failed to clear');
                }
              }}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>

    <div className="p-4 space-y-3">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-24 bg-gray-50 rounded-2xl animate-pulse" />
          ))
        ) : notifications.length > 0 ? (
          notifications.map((notif) => {
            const Icon = getIcon(notif.type);
            return (
              <div 
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`p-4 rounded-3xl border transition-all flex gap-4 relative group ${
                  notif.is_read 
                    ? 'bg-white border-gray-100 opacity-60' 
                    : 'bg-lavender border-primary/10 shadow-sm'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  notif.is_read ? 'bg-gray-100 text-gray-400' : 'bg-white text-primary shadow-sm'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-bold truncate ${notif.is_read ? 'text-gray-600' : 'text-gray-900'}`}>
                      {notif.title}
                    </h4>
                    {!notif.is_read && <div className="w-2 h-2 bg-primary rounded-full" />}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{notif.body}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    {format(new Date(notif.created_at), 'MMM dd, HH:mm')}
                  </p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notif.id);
                  }}
                  className="absolute top-2 right-2 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 space-y-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
              <Bell className="w-10 h-10 text-gray-200" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-gray-400">All caught up!</p>
              <p className="text-xs text-gray-300">No new notifications for you.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
