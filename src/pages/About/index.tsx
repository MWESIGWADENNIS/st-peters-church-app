import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  History, 
  Phone, 
  Clock, 
  ChevronRight,
  MapPin,
  Mail,
  Globe
} from 'lucide-react';

import { useDataStore } from '../../store/dataStore';

export default function About() {
  const { churchSettings: settings, setChurchSettings } = useDataStore();

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('church_settings').select('*').single();
      if (data) setChurchSettings(data);
    };
    if (!settings) fetchSettings();
  }, [settings, setChurchSettings]);

  const subPages = [
    { icon: Users, label: 'Our Leadership', path: '/about/leadership', color: 'bg-blue-50 text-blue-600' },
    { icon: History, label: 'Church History', path: '/about/history', color: 'bg-amber-50 text-amber-600' },
    { icon: Phone, label: 'Contact Us', path: '/about/contact', color: 'bg-green-50 text-green-600' },
    { icon: Clock, label: 'Service Times', path: '/about/service-times', color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="p-4 space-y-8">
      <div className="text-center space-y-4 py-8">
        <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto shadow-xl border-4 border-white overflow-hidden">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-4xl font-black">SP</span>
          )}
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-display font-black text-primary">
            {settings?.church_name || "St. Peter's Church of Uganda"}
          </h1>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
            {settings?.parish || "Nkoma Parish"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {subPages.map((page) => (
          <Link
            key={page.label}
            to={page.path}
            className="flex items-center gap-4 p-5 bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-primary/20 transition-all group"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${page.color}`}>
              <page.icon className="w-6 h-6" />
            </div>
            <span className="flex-1 font-bold text-gray-800 text-lg">{page.label}</span>
            <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>

      <div className="bg-lavender rounded-3xl p-6 space-y-4">
        <h3 className="font-black text-primary uppercase text-xs tracking-widest">Our Location</h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm font-medium text-gray-700">
              {settings?.address || "Nambozo Road, Nkoma, Mbale City, Uganda"}
            </p>
          </div>
          <div className="flex gap-3">
            <Phone className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm font-medium text-gray-700">{settings?.phone || "+256 700 000 000"}</p>
          </div>
          <div className="flex gap-3">
            <Mail className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm font-medium text-gray-700">{settings?.email || "info@stpeters.app"}</p>
          </div>
        </div>
      </div>

      <div className="pt-4 text-center">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Mbale Diocese</p>
      </div>
    </div>
  );
}
