import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, Phone, Mail, MapPin, Youtube, Facebook, Twitter } from 'lucide-react';

import { useDataStore } from '../../store/dataStore';

export default function Contact() {
  const navigate = useNavigate();
  const { churchSettings: settings, setChurchSettings } = useDataStore();

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('church_settings').select('*').single();
      if (data) setChurchSettings(data);
    };
    if (!settings) fetchSettings();
  }, [settings, setChurchSettings]);

  const contactItems = [
    { icon: Phone, label: 'Call Us', value: settings?.phone || '+256 700 000 000', action: `tel:${settings?.phone}` },
    { icon: Mail, label: 'Email Us', value: settings?.email || 'info@stpeters.app', action: `mailto:${settings?.email}` },
    { icon: MapPin, label: 'Visit Us', value: settings?.address || 'Nambozo Road, Nkoma, Mbale City', action: '#' },
  ];

  return (
    <div className="min-h-screen bg-white pb-12">
      <div className="p-4 flex items-center gap-4 sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-black text-primary">Contact Us</h1>
      </div>

      <div className="p-6 space-y-8">
        <div className="space-y-4">
          <h2 className="text-3xl font-display font-black text-gray-900 leading-tight">
            Get in Touch
          </h2>
          <p className="text-gray-500 font-medium">
            We'd love to hear from you. Reach out for prayers, inquiries, or to join our community.
          </p>
        </div>

        <div className="space-y-4">
          {contactItems.map((item) => (
            <a
              key={item.label}
              href={item.action}
              className="flex items-center gap-4 p-5 bg-gray-50 rounded-3xl border border-transparent hover:border-primary/10 transition-all"
            >
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                <item.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                <p className="font-bold text-gray-800">{item.value}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Follow Us</h3>
          <div className="flex gap-4">
            {[
              { icon: Youtube, color: 'text-red-600 bg-red-50', url: settings?.youtube_channel_url },
              { icon: Facebook, color: 'text-blue-600 bg-blue-50', url: '#' },
              { icon: Twitter, color: 'text-sky-500 bg-sky-50', url: '#' },
            ].map((social, i) => (
              <a
                key={i}
                href={social.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${social.color} shadow-sm`}
              >
                <social.icon className="w-6 h-6" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
