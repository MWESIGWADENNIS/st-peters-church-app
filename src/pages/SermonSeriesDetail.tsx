import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, Play, Calendar, User, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export default function SermonSeriesDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [series, setSeries] = useState<any | null>(null);
  const [sermons, setSermons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: seriesData } = await supabase
          .from('sermon_series')
          .select('*')
          .eq('id', id)
          .single();
        
        setSeries(seriesData);

        const { data: sermonsData } = await supabase
          .from('sermons')
          .select('*')
          .eq('series_id', id)
          .order('sermon_date', { ascending: true });
        
        setSermons(sermonsData || []);
      } catch (err) {
        console.error('Error fetching series detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!series) return (
    <div className="p-8 text-center">
      <p>Series not found</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-primary font-bold">Go Back</button>
    </div>
  );

  return (
    <div className="pb-20">
      <div className="relative h-72">
        <img 
          src={series.cover_image_url || 'https://picsum.photos/seed/bible/800/600'} 
          alt={series.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 p-2 bg-white/20 backdrop-blur-md rounded-full text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="absolute bottom-8 left-8 right-8 text-white">
          <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-widest mb-2">
            <BookOpen className="w-4 h-4" />
            Sermon Series
          </div>
          <h1 className="text-3xl font-black font-display leading-tight">{series.title}</h1>
          <p className="text-white/70 text-sm mt-2 line-clamp-2">{series.description}</p>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-gray-900">Sermons in this series</h2>
          <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
            {sermons.length} Parts
          </span>
        </div>

        <div className="space-y-4">
          {sermons.map((sermon, index) => (
            <Link 
              key={sermon.id} 
              to={`/sermons/${sermon.id}`}
              className="block"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-black flex-shrink-0">
                  {index + 1}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 line-clamp-1">{sermon.title}</h3>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-1 font-medium">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {sermon.preacher}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(sermon.sermon_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>

                <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-primary">
                  <Play className="w-4 h-4 fill-current" />
                </div>
              </motion.div>
            </Link>
          ))}

          {sermons.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">No sermons added to this series yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
