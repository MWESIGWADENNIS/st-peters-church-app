import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, Music, ChevronRight, ChevronLeft, Hash, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

import { useDataStore } from '../store/dataStore';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export default function Hymns() {
  const navigate = useNavigate();
  const { hymns: cachedHymns, setHymns, isCacheValid } = useDataStore();
  const [hymns, setLocalHymns] = useState<any[]>(cachedHymns);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(!isCacheValid('hymns'));

  const categories = ['All', 'Praise', 'Worship', 'Communion', 'Thanksgiving'];

  useEffect(() => {
    const fetchHymns = async () => {
      const cacheValid = isCacheValid('hymns');
      if (!cacheValid) setLoading(true);

      try {
        const { data, error } = await supabase
          .from('hymns')
          .select('*')
          .order('number', { ascending: true });
        
        if (error) throw error;
        
        if (data) {
          setHymns(data);
          setLocalHymns(data);
        }
      } catch (error) {
        console.error('Error fetching hymns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHymns();
  }, []);

  const filteredHymns = hymns.filter(h => {
    const matchesSearch = h.title.toLowerCase().includes(search.toLowerCase()) || 
                         h.number.toString().includes(search);
    const matchesCategory = category === 'All' || h.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-20">
      {/* Modern Header */}
      <div className="bg-white px-6 pt-12 pb-8 rounded-b-[3rem] shadow-sm border-b border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="relative z-10 flex items-center justify-between mb-8">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)} 
            className="p-3 bg-gray-50 rounded-2xl text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
          <div className="text-right">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Sacred Songs</p>
            <h1 className="text-2xl font-display font-black text-gray-900">Hymn Book</h1>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/5 rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search by number or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-gray-50 rounded-[2rem] border border-gray-100 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-400 relative z-10"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border shadow-sm",
                  category === cat 
                    ? "bg-primary text-white border-primary scale-105 shadow-primary/20" 
                    : "bg-white text-gray-400 border-gray-100 hover:border-primary/20"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Filter className="w-3 h-3" /> {filteredHymns.length} Hymns Found
          </h2>
        </div>

        {/* Hymn List */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {loading ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-[2rem] animate-pulse border border-gray-50" />
            ))
          ) : filteredHymns.length > 0 ? (
            filteredHymns.map((hymn) => (
              <motion.div key={hymn.id} variants={item}>
                <Link
                  to={`/hymns/${hymn.id}`}
                  className="group flex items-center gap-5 bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 hover:border-primary/20 hover:shadow-xl hover:shadow-gray-200/50 transition-all active:scale-[0.98]"
                >
                  <div className="w-16 h-16 bg-lavender rounded-2xl flex flex-col items-center justify-center text-primary relative overflow-hidden group-hover:bg-primary group-hover:text-white transition-colors">
                    <Hash className="w-3 h-3 opacity-30 absolute top-2 left-2" />
                    <span className="font-display font-black text-xl relative z-10">{hymn.number}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-black text-gray-900 text-lg truncate group-hover:text-primary transition-colors">
                      {hymn.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-widest rounded-md border border-gray-100">
                        {hymn.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="w-10 h-10 text-gray-200" />
              </div>
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No hymns found</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Footer Note */}
      <div className="pt-12 pb-8 text-center">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">
          Praise the Lord with Songs
        </p>
      </div>
    </div>
  );
}
