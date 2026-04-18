import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Calendar, 
  Megaphone, 
  MessageSquare, 
  Info, 
  Users, 
  School, 
  BookOpen, 
  Book,
  Bell, 
  User, 
  LogOut,
  ChevronRight,
  Shield,
  Video,
  Image as ImageIcon,
  StickyNote,
  Music,
  Layers
} from 'lucide-react';

import { useDataStore } from '../store/dataStore';

export default function More() {
  const { profile, signOut } = useAuthStore();
  const { churchSettings } = useDataStore();
  const navigate = useNavigate();

  const menuGroups = [
    {
      title: 'Church Life',
      items: [
        { icon: Book, label: 'Holy Bible', path: '/bible', color: 'text-primary bg-primary/10' },
        { icon: Calendar, label: 'Events & Calendar', path: '/events', color: 'text-orange-600 bg-orange-50' },
        { icon: Megaphone, label: 'Announcements', path: '/announcements', color: 'text-purple-600 bg-purple-50' },
        { icon: MessageSquare, label: 'Prayer Requests', path: '/prayer', color: 'text-blue-600 bg-blue-50' },
        { icon: BookOpen, label: 'Daily Bread', path: '/daily-bread', color: 'text-green-600 bg-green-50' },
        { icon: MessageSquare, label: 'Testimony Wall', path: '/testimonies', color: 'text-amber-600 bg-amber-50' },
        { icon: StickyNote, label: 'Notice Board', path: '/notices', color: 'text-yellow-600 bg-yellow-50' },
        { icon: ImageIcon, label: 'Media Gallery', path: '/gallery', color: 'text-emerald-600 bg-emerald-50' },
      ]
    },
    {
      title: 'Ministries & Media',
      items: [
        { icon: Music, label: 'Choir Schedule', path: '/ministries/choir/schedule', color: 'text-indigo-600 bg-indigo-50' },
        { icon: Users, label: 'Ministries', path: '/ministries', color: 'text-teal-600 bg-teal-50' },
        { icon: School, label: 'Schools Ministry', path: '/schools', color: 'text-sky-600 bg-sky-50' },
      ]
    },
    {
      title: 'About Us',
      items: [
        { icon: Info, label: `About ${churchSettings?.church_name || "St. Peter's"}`, path: '/about', color: 'text-gray-600 bg-gray-50' },
      ]
    },
    {
      title: 'Account',
      items: [
        { icon: User, label: 'My Profile', path: '/profile', color: 'text-primary bg-lavender' },
        { icon: Bell, label: 'Notifications', path: '/notifications', color: 'text-red-600 bg-red-50' },
      ]
    }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const adminGroup = profile?.role === 'admin' ? {
    title: 'Admin Tools',
    items: [
      { icon: Shield, label: 'Admin Dashboard', path: '/admin', color: 'text-white bg-primary' },
    ]
  } : null;

  const allGroups = adminGroup ? [adminGroup, ...menuGroups] : menuGroups;

  return (
    <div className="p-4 space-y-8 pb-12">
      <div className="flex items-center gap-4 p-4 bg-white rounded-3xl shadow-sm border border-gray-100">
        <div className="w-16 h-16 rounded-2xl bg-lavender flex items-center justify-center overflow-hidden border border-primary/10">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-primary font-black text-2xl">{profile?.full_name?.charAt(0) || 'U'}</span>
          )}
        </div>
        <div className="flex-1">
          <h2 className="font-black text-gray-900 text-lg">{profile?.full_name || 'Member'}</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">@{profile?.username || 'username'}</p>
          <div className="mt-1 inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold uppercase tracking-widest">
            {profile?.role || 'Member'}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {allGroups.map((group) => (
          <div key={group.title} className="space-y-3">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
              {group.title}
            </h3>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              {group.items.map((item, idx) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                    idx !== group.items.length - 1 ? 'border-b border-gray-50' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="flex-1 font-bold text-gray-700">{item.label}</span>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-3 p-4 bg-red-50 text-red-600 font-black rounded-2xl hover:bg-red-100 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </button>

      <div className="text-center space-y-1">
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
          {churchSettings?.church_name || "St. Peter's Church"} App
        </p>
        <p className="text-[10px] text-gray-300">Version 1.0.0</p>
      </div>
    </div>
  );
}
