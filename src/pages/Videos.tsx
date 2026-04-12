import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Video, Play, Calendar, Tag, Search, Filter, ChevronLeft, Youtube, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

const CATEGORIES = ['All', 'Choir', 'Testimony', 'Message', 'General'];

export default function Videos() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('church_videos')
      .select('*')
      .order('recorded_date', { ascending: false });
    if (data) setVideos(data);
    setLoading(false);
  };

  const filteredVideos = videos.filter(v => {
    const matchesSearch = v.title.toLowerCase().includes(search.toLowerCase()) || 
                         (v.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || v.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white pb-20"
    >
      {/* Header */}
      <div className="p-4 flex items-center gap-4 sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-black text-primary">Church Gallery</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Search & Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos, testimonies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none font-medium"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border whitespace-nowrap",
                  activeCategory === cat 
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                    : "bg-white text-gray-400 border-gray-100 hover:border-primary/30"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="space-y-3 animate-pulse">
                <div className="aspect-video bg-gray-100 rounded-3xl" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-20">
              <Video className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-bold">No videos found matching your search.</p>
            </div>
          ) : (
            filteredVideos.map((video) => (
              <div key={video.id} className="group space-y-3">
                <button 
                  onClick={() => navigate(`/gallery/${video.id}`)}
                  className="w-full block relative aspect-video bg-gray-900 rounded-3xl overflow-hidden shadow-xl group-hover:shadow-2xl transition-all duration-500 text-left"
                >
                  {video.thumbnail_url ? (
                    <img 
                      src={video.thumbnail_url} 
                      alt={video.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
                  )}

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors duration-500">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-white/30">
                      <Play className="w-8 h-8 text-white fill-white ml-1" />
                    </div>
                  </div>
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-primary text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
                      {video.category}
                    </span>
                  </div>

                  {/* Date Badge */}
                  <div className="absolute bottom-4 right-4">
                    <span className="px-3 py-1 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold rounded-full border border-white/20">
                      {format(new Date(video.recorded_date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </button>

                <div className="px-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold">
                      <Eye className="w-3 h-3" />
                      {video.views || 0}
                    </div>
                  </div>
                  {video.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 font-medium leading-relaxed">
                      {video.description}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
