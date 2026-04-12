import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, Play, Mic, ChevronRight, User, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

import { useDataStore } from '../store/dataStore';

export default function Sermons() {
  const { sermons: cachedSermons, setSermons, isCacheValid } = useDataStore();
  const [sermons, setLocalSermons] = useState<any[]>(cachedSermons);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');
  const [loading, setLoading] = useState(!isCacheValid('sermons'));

  useEffect(() => {
    const fetchSermons = async () => {
      const cacheValid = isCacheValid('sermons');
      if (!cacheValid) setLoading(true);

      try {
        const { data } = await supabase
          .from('sermons')
          .select('*')
          .order('sermon_date', { ascending: false });
        
        if (data) {
          setSermons(data);
          setLocalSermons(data);
        }
      } catch (error) {
        console.error('Error fetching sermons:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSermons();
  }, []);

  const filteredSermons = sermons.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) || 
                         (s.preacher || '').toLowerCase().includes(search.toLowerCase()) ||
                         s.bible_reference?.toLowerCase().includes(search.toLowerCase());
    const matchesType = type === 'All' || 
                       (type === 'Video' && s.youtube_url) || 
                       (type === 'Audio' && s.audio_url);
    return matchesSearch && matchesType;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-6"
    >
      <div className="space-y-4">
        <h1 className="text-2xl font-black text-primary">Sermon Archive</h1>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, preacher, verse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none transition-all"
          />
        </div>

        <div className="flex gap-2">
          {['All', 'Video', 'Audio'].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                "flex-1 py-2 rounded-xl text-xs font-bold transition-all border",
                type === t 
                  ? "bg-primary text-white border-primary shadow-md" 
                  : "bg-white text-gray-500 border-gray-100"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-48 bg-gray-50 rounded-2xl animate-pulse" />
          ))
        ) : filteredSermons.length > 0 ? (
          filteredSermons.map((sermon) => (
            <Link
              key={sermon.id}
              to={`/sermons/${sermon.id}`}
              className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:border-primary/20 transition-all"
            >
              <div className="relative h-40 bg-gray-100">
                {sermon.thumbnail_url ? (
                  <img 
                    src={sermon.thumbnail_url} 
                    alt={sermon.title} 
                    className="w-full h-full object-cover" 
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5">
                    {sermon.youtube_url ? <Play className="w-12 h-12 text-primary/20" /> : <Mic className="w-12 h-12 text-primary/20" />}
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1">
                  {sermon.youtube_url ? <Play className="w-3 h-3 text-red-600 fill-red-600" /> : <Mic className="w-3 h-3 text-blue-600" />}
                  <span className="text-[10px] font-bold text-gray-700 uppercase">{sermon.youtube_url ? 'Video' : 'Audio'}</span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(sermon.sermon_date), 'MMM dd, yyyy')}
                  {sermon.bible_reference && (
                    <>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span className="text-primary">{sermon.bible_reference}</span>
                    </>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 leading-tight line-clamp-2">{sermon.title}</h3>
                <div className="flex items-center gap-2 pt-1">
                  <div className="w-6 h-6 rounded-full bg-lavender flex items-center justify-center overflow-hidden border border-primary/10">
                    <User className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">{sermon.preacher || 'Church Minister'}</span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-12">
            <Mic className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No sermons found matching your search.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
