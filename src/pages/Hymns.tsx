import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, Music, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

import { useDataStore } from '../store/dataStore';

export default function Hymns() {
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
        const fetchPromise = supabase
          .from('hymns')
          .select('*')
          .order('number', { ascending: true });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 60000)
        );

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
        
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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-6"
    >
      <div className="space-y-4">
        <h1 className="text-2xl font-black text-primary">Hymn Book</h1>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by number or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none transition-all"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                category === cat 
                  ? "bg-primary text-white border-primary shadow-md" 
                  : "bg-white text-gray-500 border-gray-100"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Hymn List */}
      <div className="space-y-3">
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
          ))
        ) : filteredHymns.length > 0 ? (
          filteredHymns.map((hymn) => (
            <Link
              key={hymn.id}
              to={`/hymns/${hymn.id}`}
              className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-primary/20 transition-all"
            >
              <div className="w-12 h-12 bg-lavender rounded-lg flex items-center justify-center text-primary font-black text-lg">
                {hymn.number}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800 truncate">{hymn.title}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                  {hymn.category}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </Link>
          ))
        ) : (
          <div className="text-center py-12">
            <Music className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No hymns found matching your search.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
