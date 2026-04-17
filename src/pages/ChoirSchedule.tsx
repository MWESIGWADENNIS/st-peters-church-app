import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Music, Calendar, Clock, MapPin, BookOpen, Info, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useDataStore } from '../store/dataStore';
import { format, isPast, isToday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { PullToRefresh } from '../components/PullToRefresh';

export default function ChoirSchedule() {
  const navigate = useNavigate();
  const { choirSchedule, setChoirSchedule } = useDataStore();
  const [loading, setLoading] = useState(false);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('choir_schedule')
        .select('*')
        .order('practice_date', { ascending: true });

      if (error) throw error;
      setChoirSchedule(data || []);
    } catch (err) {
      console.error('Error fetching choir schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  return (
    <div className="pb-20">
      <div className="bg-primary text-white p-6 rounded-b-[3rem] shadow-lg mb-6">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => navigate(-1)} className="bg-white/20 p-2 rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-black font-display flex items-center gap-2">
            <Music className="w-6 h-6" />
            Choir Schedule
          </h1>
        </div>
        <p className="text-white/80 text-sm ml-11">Practice times and preparations</p>
      </div>

      <PullToRefresh onRefresh={fetchSchedule}>
        <div className="px-6 space-y-8 relative">
          {/* Timeline Line */}
          <div className="absolute left-9 top-4 bottom-4 w-0.5 bg-gray-100" />

          {choirSchedule.map((practice, index) => {
            const isPastPractice = isPast(new Date(practice.practice_date)) && !isToday(new Date(practice.practice_date));
            
            return (
              <motion.div
                key={practice.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative pl-10 ${isPastPractice ? 'opacity-50' : ''}`}
              >
                {/* Timeline Dot */}
                <div className={`absolute left-[30px] top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 ${
                  isToday(new Date(practice.practice_date)) ? 'bg-accent animate-pulse' : 
                  isPastPractice ? 'bg-gray-300' : 'bg-primary'
                }`} />

                <div className={`bg-white rounded-3xl p-5 shadow-sm border ${isToday(new Date(practice.practice_date)) ? 'border-accent' : 'border-gray-100'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 text-primary font-bold text-sm mb-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(practice.practice_date), 'EEEE, MMM d')}
                        {isToday(new Date(practice.practice_date)) && (
                          <span className="bg-accent text-white text-[10px] px-2 py-0.5 rounded-full uppercase">Today</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <Clock className="w-4 h-4" />
                        {practice.start_time} {practice.end_time ? `- ${practice.end_time}` : ''}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl">
                      <MapPin className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-1.5 bg-blue-50 rounded-lg">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Venue</p>
                        <p className="text-sm font-semibold text-gray-700">{practice.venue || 'Church Hall'}</p>
                      </div>
                    </div>

                    {practice.preparation && (
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-1.5 bg-amber-50 rounded-lg">
                          <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Preparation</p>
                          <p className="text-sm text-gray-700">{practice.preparation}</p>
                        </div>
                      </div>
                    )}

                    {practice.notes && (
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-1.5 bg-gray-50 rounded-lg">
                          <Info className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Special Notes</p>
                          <p className="text-sm text-gray-500 italic">{practice.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {choirSchedule.length === 0 && !loading && (
            <div className="text-center py-12">
              <Music className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">No practice schedule found.</p>
            </div>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}
