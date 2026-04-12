import React, { useEffect, useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Home, Music, Radio, BookOpen, Menu, Bell, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

import { useDataStore } from '../store/dataStore';

export const Layout: React.FC = () => {
  const location = useLocation();
  const { profile } = useAuthStore();
  const { churchSettings, unreadCount } = useDataStore();
  const [isLive, setIsLive] = useState(false);

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
    <div className="min-h-screen bg-white pb-20">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
            {churchSettings?.logo_url ? (
              <img src={churchSettings.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              'SP'
            )}
          </div>
          <div>
            <h1 className="text-sm font-bold text-primary leading-tight">
              {churchSettings?.church_name || "St. Peter's Church"}
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              {churchSettings?.parish || 'Nkoma Parish'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {profile?.role === 'admin' && (
            <Link to="/admin" className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors">
              <Shield className="w-5 h-5" />
            </Link>
          )}
          <Link to="/notifications" className="relative group">
            <Bell className={cn(
              "w-6 h-6 text-gray-600 transition-all duration-300",
              unreadCount > 0 && "animate-bell-swing text-primary"
            )} />
            {unreadCount > 0 && (
              <>
                <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white z-10 shadow-sm">
                  {unreadCount}
                </span>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full animate-ping opacity-75" />
              </>
            )}
          </Link>
          <Link to="/profile">
            <div className="w-8 h-8 rounded-full bg-lavender flex items-center justify-center overflow-hidden border border-primary/10">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary font-bold text-xs">
                  {profile?.full_name?.charAt(0) || 'U'}
                </span>
              )}
            </div>
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 z-50">
        <div className="max-w-md mx-auto flex items-end justify-between">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            if (item.isLive) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center -mt-6 relative"
                >
                  <div className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
                    isLive ? "bg-red-600 animate-pulse-red" : "bg-gray-400",
                    isActive && "ring-4 ring-primary/20"
                  )}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className={cn(
                    "text-[10px] mt-1 font-bold uppercase tracking-tighter",
                    isActive ? "text-primary" : "text-gray-400"
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
                className="flex flex-col items-center py-1 px-3"
              >
                <Icon className={cn(
                  "w-6 h-6 transition-colors",
                  isActive ? "text-primary" : "text-gray-400"
                )} />
                <span className={cn(
                  "text-[10px] mt-1 font-medium",
                  isActive ? "text-primary font-bold" : "text-gray-400"
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
