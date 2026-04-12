import React, { useEffect, useState } from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  LayoutDashboard, 
  BookOpen, 
  Megaphone, 
  Calendar, 
  Users, 
  Radio, 
  Video,
  Settings, 
  ChevronRight,
  Plus,
  ArrowLeft,
  MessageSquare,
  Music,
  School,
  Clock,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    members: 0,
    prayers: 0,
    events: 0,
    isLive: false
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { count: members } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: prayers } = await supabase.from('prayer_requests').select('*', { count: 'exact', head: true });
      const { count: events } = await supabase.from('events').select('*', { count: 'exact', head: true });
      const { data: live } = await supabase.from('livestream').select('is_live').single();

      setStats({
        members: members || 0,
        prayers: prayers || 0,
        events: events || 0,
        isLive: live?.is_live || false
      });
    };
    fetchStats();
  }, []);

  const adminModules = [
    { icon: BookOpen, label: 'Daily Bread', path: 'daily-bread', color: 'bg-green-50 text-green-600' },
    { icon: Megaphone, label: 'Announcements', path: 'announcements', color: 'bg-purple-50 text-purple-600' },
    { icon: Calendar, label: 'Events', path: 'events', color: 'bg-orange-50 text-orange-600' },
    { icon: Users, label: 'Leadership', path: 'leadership', color: 'bg-blue-50 text-blue-600' },
    { icon: Users, label: 'Ministry Requests', path: 'ministries', color: 'bg-amber-50 text-amber-600' },
    { icon: Users, label: 'Manage Ministries', path: 'ministry-management', color: 'bg-teal-50 text-teal-600' },
    { icon: MapPin, label: 'Zones', path: 'zones', color: 'bg-lime-50 text-lime-600' },
    { icon: Radio, label: 'Livestream', path: 'livestream', color: 'bg-red-50 text-red-600' },
    { icon: Music, label: 'Hymns', path: 'hymns', color: 'bg-indigo-50 text-indigo-600' },
    { icon: MessageSquare, label: 'Prayer Requests', path: 'prayer-requests', color: 'bg-sky-50 text-sky-600' },
    { icon: Video, label: 'Sermons', path: 'sermons', color: 'bg-rose-50 text-rose-600' },
    { icon: Video, label: 'Church Videos', path: 'videos', color: 'bg-indigo-50 text-indigo-600' },
    { icon: Clock, label: 'Services', path: 'services', color: 'bg-emerald-50 text-emerald-600' },
    { icon: Settings, label: 'Settings', path: 'settings', color: 'bg-gray-50 text-gray-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-50">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/home')} className="p-2 hover:bg-gray-50 rounded-full">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-black text-primary">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2">
            {stats.isLive && (
              <span className="flex items-center gap-1 bg-red-50 text-red-600 text-[10px] font-black px-2 py-1 rounded-full uppercase animate-pulse">
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full" /> Live
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Total Members', value: stats.members, color: 'bg-blue-600' },
            { label: 'Prayer Requests', value: stats.prayers, color: 'bg-primary' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.color} p-5 rounded-3xl text-white shadow-lg`}>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{stat.label}</p>
              <p className="text-3xl font-black mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Modules Grid */}
        <div className="space-y-4">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Management</h2>
          <div className="grid grid-cols-2 gap-4">
            {adminModules.map((module) => (
              <Link
                key={module.label}
                to={module.path}
                className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 text-center group hover:border-primary/20 transition-all"
              >
                <div className={`w-12 h-12 ${module.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <module.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-gray-700">{module.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-gray-700">Post Daily Bread</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-gray-700">Add Announcement</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
