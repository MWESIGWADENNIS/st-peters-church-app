import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { StickyNote, Calendar, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useDataStore } from '../store/dataStore';
import { format } from 'date-fns';
import { PullToRefresh } from '../components/PullToRefresh';

export default function Notices() {
  const { notices, setNotices } = useDataStore();
  const [loading, setLoading] = useState(false);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (err) {
      console.error('Error fetching notices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const getColourClass = (colour: string) => {
    switch (colour) {
      case 'red': return 'bg-red-50 border-red-100 text-red-800';
      case 'green': return 'bg-emerald-50 border-emerald-100 text-emerald-800';
      case 'blue': return 'bg-blue-50 border-blue-100 text-blue-800';
      case 'yellow': 
      default: return 'bg-amber-50 border-amber-100 text-amber-800';
    }
  };

  const getTagColour = (colour: string) => {
    switch (colour) {
      case 'red': return 'bg-red-500';
      case 'green': return 'bg-emerald-500';
      case 'blue': return 'bg-blue-500';
      case 'yellow': 
      default: return 'bg-amber-500';
    }
  };

  return (
    <div className="pb-20">
      <div className="bg-primary text-white p-6 rounded-b-[3rem] shadow-lg mb-6">
        <h1 className="text-2xl font-black font-display flex items-center gap-2">
          <StickyNote className="w-6 h-6" />
          Notice Board
        </h1>
        <p className="text-white/80 text-sm mt-1">Quick updates and reminders</p>
      </div>

      <PullToRefresh onRefresh={fetchNotices}>
        <div className="px-4 grid grid-cols-1 gap-4">
          {notices.map((notice, index) => (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-5 rounded-2xl border-2 shadow-sm relative overflow-hidden ${getColourClass(notice.colour)}`}
            >
              <div className={`absolute top-0 left-0 w-1.5 h-full ${getTagColour(notice.colour)}`} />
              
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-black font-display text-lg uppercase tracking-tight">
                  {notice.title}
                </h3>
                <AlertCircle className="w-5 h-5 opacity-30" />
              </div>

              <p className="text-sm leading-relaxed mb-4 font-medium">
                {notice.body}
              </p>

              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest opacity-60">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(notice.created_at), 'MMM d, yyyy')}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Expires: {format(new Date(notice.expires_at), 'MMM d')}
                </div>
              </div>
            </motion.div>
          ))}

          {notices.length === 0 && !loading && (
            <div className="text-center py-12">
              <StickyNote className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">No active notices at the moment.</p>
            </div>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}
