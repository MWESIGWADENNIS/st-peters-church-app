import React, { useEffect } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Megaphone, Calendar, MessageSquare, PlayCircle, CheckCircle2 } from 'lucide-react';

export const NotificationOverlay: React.FC = () => {
  const { activeNotifications, removeNotification } = useNotificationStore();

  return (
    <div className="fixed top-4 left-4 right-4 z-[9999] pointer-events-none flex flex-col items-center gap-3">
      <AnimatePresence>
        {activeNotifications.map((notif) => (
          <NotificationItem 
            key={notif.id} 
            notification={notif} 
            onClose={() => removeNotification(notif.id)} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

const NotificationItem: React.FC<{ 
  notification: any; 
  onClose: () => void;
}> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'announcement': return <Megaphone className="w-5 h-5" />;
      case 'event': return <Calendar className="w-5 h-5" />;
      case 'sermon': return <MessageSquare className="w-5 h-5" />;
      case 'live': return <PlayCircle className="w-5 h-5" />;
      case 'ministry': return <CheckCircle2 className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="w-full max-w-md bg-white/95 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[2rem] pointer-events-auto flex items-center p-4 border border-white/20 ring-1 ring-black/5 group"
    >
      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-110 transition-transform shadow-inner">
        {getIcon(notification.type)}
      </div>
      <div className="ml-4 flex-1 min-w-0">
        <h4 className="text-sm font-black text-gray-900 truncate tracking-tight">{notification.title}</h4>
        <p className="text-[10px] font-medium text-gray-500 line-clamp-2 leading-tight mt-0.5 opacity-80">{notification.body}</p>
      </div>
      <button 
        onClick={onClose}
        className="ml-2 p-2 text-gray-300 hover:text-gray-900 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};
