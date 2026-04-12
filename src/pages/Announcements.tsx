import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Megaphone, ChevronRight, Pin, Search } from 'lucide-react';
import { format } from 'date-fns';

import { useDataStore } from '../store/dataStore';

export default function Announcements() {
  const { announcements: cachedAnnouncements, setAnnouncements, isCacheValid, churchSettings } = useDataStore();
  const [announcements, setLocalAnnouncements] = useState<any[]>(cachedAnnouncements);
  const [loading, setLoading] = useState(!isCacheValid('announcements'));
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const cacheValid = isCacheValid('announcements');
      if (!cacheValid) setLoading(true);

      try {
        const fetchPromise = supabase
          .from('announcements')
          .select('*')
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 60000)
        );

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
        
        if (error) throw error;
        
        if (data) {
          setAnnouncements(data);
          setLocalAnnouncements(data);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const filteredAnnouncements = announcements.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) || 
    a.body.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-primary">Announcements</h1>
        <p className="text-sm text-gray-500 font-medium">
          Stay updated with the latest news from {churchSettings?.church_name || "St. Peter's"}.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search news..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 focus:ring-2 focus:ring-primary outline-none font-bold"
        />
      </div>

      <div className="space-y-4 pb-8">
        {loading ? (
          Array(5).fill(0).map((_, i) => <div key={i} className="h-32 bg-gray-50 rounded-2xl animate-pulse" />)
        ) : filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((ann) => (
            <Link
              key={ann.id}
              to={`/announcements/${ann.id}`}
              className={`block rounded-3xl border transition-all relative group overflow-hidden ${
                ann.is_pinned 
                  ? 'bg-lavender border-primary/10 shadow-sm' 
                  : 'bg-white border-gray-100'
              }`}
            >
              {ann.image_url && (
                <div className="h-40 w-full relative">
                  <img 
                    src={ann.image_url} 
                    alt="" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              )}
              {ann.is_pinned && (
                <div className="absolute top-4 right-4 text-accent z-10">
                  <Pin className="w-4 h-4 fill-accent" />
                </div>
              )}
              <div className={`p-5 space-y-3 ${ann.image_url ? '-mt-12 relative z-10' : ''}`}>
                <div className="space-y-1 pr-6">
                  <h3 className={`text-lg font-display font-black leading-tight group-hover:text-primary transition-colors ${ann.image_url ? 'text-white drop-shadow-md' : 'text-gray-900'}`}>
                    {ann.title}
                  </h3>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${ann.image_url ? 'text-white/80' : 'text-gray-400'}`}>
                    {format(new Date(ann.created_at), 'MMMM dd, yyyy')}
                  </p>
                </div>
                <p className={`text-sm line-clamp-2 leading-relaxed font-medium ${ann.image_url && !ann.is_pinned ? 'text-gray-600' : ann.is_pinned ? 'text-gray-700' : 'text-gray-600'}`}>
                  {ann.body}
                </p>
                <div className="pt-2 flex items-center gap-2 text-primary font-bold text-xs">
                  Read More <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium italic">No announcements found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
