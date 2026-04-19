import React, { useEffect, useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Home, Music, Radio, BookOpen, Menu, Bell, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

import { useDataStore } from '../store/dataStore';

export const Layout: React.FC = () => {
  const location = useLocation();
  const { profile } = useAuthStore();
  const { churchSettings, unreadCount } = useDataStore();
  const [isLive, setIsLive] = useState(false);
  const isSunday = new Date().getDay() === 0;

  useEffect(() => {
    // Listen for live status
    const fetchLiveStatus = async () => {
      const { data } = await supabase.from('livestream').select('is_live').single();
      if (data) setIsLive(data.is_live);
    };

    fetchLiveStatus();

    const livestreamSubscription = supabase
      .channel('livestream_changes')
      .on('postgres_changes' as any, { event: 'UPDATE', schema: 'public', table: 'livestream' }, (payload: any) => {
        setIsLive(payload.new.is_live);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(livestreamSubscription);
    };
  }, []);

  const navItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: Music, label: 'Hymns', path: '/hymns' },
    { icon: Radio, label: 'LIVE', path: '/livestream', isLive: true },
    { icon: BookOpen, label: 'Sermons', path: '/sermons' },
    { icon: Menu, label: 'More', path: '/more' },
  ];

  return (
    <div className={cn(
      "min-h-screen pb-20 transition-colors duration-1000",
      isSunday ? "bg-church-pattern" : "bg-white"
    )}>
      {/* Top Bar */}
      <header className={cn(
        "sticky top-0 z-50 px-4 py-3 flex items-center justify-between shadow-lg overflow-hidden transition-all duration-1000",
        isSunday 
          ? "bg-gradient-to-r from-red-900 via-red-800 to-orange-800 border-b border-amber-500/30" 
          : "bg-gradient-to-r from-primary via-primary/95 to-indigo-900"
      )}>
        {/* Animated background element */}
        <div className={cn(
          "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse",
          isSunday ? "bg-amber-400/20" : "bg-accent/10"
        )} />
        
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5 relative z-10"
        >
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="relative"
          >
            <div className={cn(
              "absolute inset-0 rounded-full blur-md animate-pulse",
              isSunday ? "bg-amber-500/40" : "bg-accent/30"
            )} />
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary font-bold overflow-hidden relative z-10 border-2 border-accent/20 shadow-inner">
              {churchSettings?.logo_url ? (
                <img src={churchSettings.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-display">SP</span>
              )}
            </div>
          </motion.div>
          
          <div className="flex flex-col relative">
            <h1 className="text-base font-display font-bold text-white leading-none tracking-tight drop-shadow-sm relative overflow-hidden group">
              {churchSettings?.church_name || "St. Peter's Church"}
              <div className="absolute inset-0 animate-shimmer pointer-events-none" />
            </h1>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1 h-1 bg-accent rounded-full animate-ping" />
              <p className="text-[9px] text-accent/90 font-black uppercase tracking-[0.15em]">
                {churchSettings?.parish || 'Nkoma Parish'}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="flex items-center gap-2 relative z-10">
          {profile?.role === 'admin' && (
            <Link to="/admin" className="p-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm border border-white/10">
              <Shield className="w-4.5 h-4.5" />
            </Link>
          )}
          <Link to="/notifications" className="relative group p-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm border border-white/10">
            <Bell className={cn(
              "w-4.5 h-4.5 transition-all duration-300",
              unreadCount > 0 && "animate-bell-swing text-accent"
            )} />
            {unreadCount > 0 && (
              <>
                <span className="absolute -top-1 -right-1 bg-accent text-white text-[9px] font-black px-1 py-0.5 rounded-full border-2 border-primary z-10 shadow-sm">
                  {unreadCount}
                </span>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-ping opacity-75" />
              </>
            )}
          </Link>
          <Link to="/profile">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-9 h-9 rounded-xl bg-white/10 p-0.5 backdrop-blur-sm border border-white/20 overflow-hidden"
            >
              <div className="w-full h-full rounded-[10px] bg-lavender flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary font-black text-xs">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
            </motion.div>
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-3">
        <div className="max-w-md mx-auto bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border border-white/20 px-1.5 py-1.5 flex items-end justify-between relative overflow-hidden">
          {/* Active Indicator Background (Animated) */}
          <div className="absolute inset-0 pointer-events-none">
            {navItems.map((item, idx) => {
              const isActive = location.pathname === item.path;
              if (!isActive || item.isLive) return null;
              return (
                <motion.div
                  key={`bg-${item.path}`}
                  layoutId="nav-bg"
                  className="absolute top-1.5 bottom-1.5 rounded-xl bg-primary/5 border border-primary/10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  style={{
                    left: `${(idx * 20) + 2}%`,
                    width: '16%'
                  }}
                />
              );
            })}
          </div>

          {navItems.map((item, idx) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            if (item.isLive) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center -mt-6 relative z-20 group"
                >
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 relative",
                      isLive 
                        ? "bg-gradient-to-br from-red-600 via-rose-500 to-orange-500" 
                        : "bg-gradient-to-br from-gray-400 to-gray-500",
                      isActive && "ring-4 ring-red-500/20"
                    )}
                  >
                    {isLive && (
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-red-500 blur-md -z-10"
                      />
                    )}
                    <Icon className={cn(
                      "w-7 h-7 text-white transition-transform group-hover:scale-110",
                      isLive && "animate-pulse"
                    )} />
                    
                    {isLive && (
                      <div className="absolute -top-1 -right-1 bg-white px-1 py-0.5 rounded-full shadow-sm border border-red-100 flex items-center gap-0.5">
                        <span className="w-1 h-1 bg-red-600 rounded-full animate-ping" />
                        <span className="text-[6px] font-black text-red-600 uppercase tracking-tighter">Live</span>
                      </div>
                    )}
                  </motion.div>
                  <span className={cn(
                    "text-[8px] mt-1 font-black uppercase tracking-[0.1em] transition-colors",
                    isActive ? "text-red-600" : "text-gray-400"
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center py-1.5 px-2 relative z-10 flex-1 group"
              >
                <motion.div
                  whileTap={{ scale: 0.8 }}
                  className="relative"
                >
                  <Icon className={cn(
                    "w-5.5 h-5.5 transition-all duration-300",
                    isActive ? "text-primary scale-110" : "text-gray-400 group-hover:text-primary/60"
                  )} />
                  {isActive && (
                    <motion.div 
                      layoutId="nav-dot"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                    />
                  )}
                </motion.div>
                <span className={cn(
                  "text-[8px] mt-1 font-black uppercase tracking-widest transition-all duration-300",
                  isActive ? "text-primary opacity-100 translate-y-0" : "text-gray-400 opacity-60 group-hover:opacity-80"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
