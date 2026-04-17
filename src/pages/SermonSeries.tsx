import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Library, ChevronRight, Calendar, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useDataStore } from '../store/dataStore';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { PullToRefresh } from '../components/PullToRefresh';

export default function SermonSeries() {
  const { sermonSeries, setSermonSeries } = useDataStore();
  const [loading, setLoading] = useState(false);

  const fetchSeries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sermon_series')
        .select('*, sermons(count)')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setSermonSeries(data || []);
    } catch (err) {
      console.error('Error fetching series:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  return (
    <div className="pb-20">
      <div className="bg-primary text-white p-6 rounded-b-[3rem] shadow-lg mb-6">
        <h1 className="text-2xl font-black font-display flex items-center gap-2">
          <Library className="w-6 h-6" />
          Sermon Series
        </h1>
        <p className="text-white/80 text-sm mt-1">Deep dives into God's word</p>
      </div>

      <PullToRefresh onRefresh={fetchSeries}>
        <div className="px-4 space-y-4">
          {sermonSeries.map((series) => (
            <Link 
              key={series.id} 
              to={`/sermons/series/${series.id}`}
              className="block"
            >
              <motion.div
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex h-32"
              >
                <div className="w-32 h-full relative flex-shrink-0">
                  <img 
                    src={series.cover_image_url || 'https://picsum.photos/seed/bible/300/300'} 
                    alt={series.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/10" />
                </div>
                
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 line-clamp-1">{series.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{series.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3 text-[10px] font-bold text-primary uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {series.sermons?.[0]?.count || 0} Sermons
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {series.start_date ? format(new Date(series.start_date), 'MMM yyyy') : 'Recent'}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}

          {sermonSeries.length === 0 && !loading && (
            <div className="text-center py-12">
              <Library className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">No sermon series found.</p>
            </div>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}
