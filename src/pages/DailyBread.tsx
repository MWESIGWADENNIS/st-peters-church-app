import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BookOpen, Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export default function DailyBread() {
  const [devotions, setDevotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDevotions = async () => {
      try {
        const fetchPromise = supabase
          .from('daily_bread')
          .select('*')
          .order('devotion_date', { ascending: false });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 60000)
        );

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
        
        if (error) throw error;
        if (data) setDevotions(data);
      } catch (err) {
        console.error('Error fetching devotions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDevotions();
  }, []);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayDevotion = devotions.find(d => d.devotion_date === today);
  const pastDevotions = devotions.filter(d => d.devotion_date !== today);

  return (
    <div className="p-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-primary">Daily Bread</h1>
        <p className="text-sm text-gray-500 font-medium">Daily spiritual nourishment for your soul.</p>
      </div>

      {/* Today's Devotion */}
      <section>
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-2">Today's Word</h2>
        {loading ? (
          <div className="h-64 bg-gray-50 rounded-3xl animate-pulse" />
        ) : todayDevotion ? (
          <Link 
            to={`/daily-bread/${todayDevotion.id}`}
            className="block bg-lavender p-6 rounded-3xl shadow-sm border border-primary/5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                {format(new Date(todayDevotion.devotion_date), 'EEEE, MMM dd')}
              </span>
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-display font-black text-gray-900 leading-tight">
                {todayDevotion.title}
              </h3>
              <p className="text-primary font-bold italic text-sm">{todayDevotion.bible_verse}</p>
              <p className="text-gray-600 text-sm line-clamp-4 leading-relaxed">
                {todayDevotion.devotion_body}
              </p>
            </div>
            <div className="pt-2 flex items-center gap-2 text-primary font-bold text-sm">
              Read Full Devotion <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
        ) : (
          <div className="p-8 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 italic">No devotion posted for today yet.</p>
          </div>
        )}
      </section>

      {/* Archive */}
      <section className="pb-8">
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-2">Past Devotions</h2>
        <div className="space-y-3">
          {pastDevotions.map((dev) => (
            <Link
              key={dev.id}
              to={`/daily-bread/${dev.id}`}
              className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100"
            >
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex flex-col items-center justify-center text-gray-400">
                <span className="text-[10px] font-black uppercase">{format(new Date(dev.devotion_date), 'MMM')}</span>
                <span className="text-lg font-black text-gray-600 leading-none">{format(new Date(dev.devotion_date), 'dd')}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 truncate">{dev.title}</h4>
                <p className="text-xs text-gray-500 truncate">{dev.bible_verse}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
