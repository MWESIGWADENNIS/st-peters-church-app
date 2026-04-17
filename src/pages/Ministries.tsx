import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Users, ChevronRight, Clock, MapPin, User, School } from 'lucide-react';

import { useDataStore } from '../store/dataStore';

export default function Ministries() {
  const { ministries: cachedMinistries, setMinistries, isCacheValid } = useDataStore();
  const [ministries, setLocalMinistries] = useState<any[]>(cachedMinistries);
  const [loading, setLoading] = useState(!isCacheValid('ministries'));

  useEffect(() => {
    const fetchMinistries = async () => {
      const cacheValid = isCacheValid('ministries');
      if (!cacheValid) setLoading(true);

      try {
        const fetchPromise = supabase
          .from('ministries')
          .select('*')
          .eq('is_active', true);
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 60000)
        );

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
        
        if (error) throw error;
        
        if (data) {
          setMinistries(data);
          setLocalMinistries(data);
        }
      } catch (error) {
        console.error('Error fetching ministries:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMinistries();
  }, []);

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-primary">Our Ministries</h1>
        <p className="text-sm text-gray-500 font-medium">Find a place to serve and grow in your faith.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Schools Ministry Featured Card */}
        <Link
          to="/schools"
          className="group relative h-56 rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 mb-2"
        >
          <div className="absolute inset-0 bg-primary">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full -ml-24 -mb-24 blur-3xl" />
          </div>
          <div className="absolute inset-0 p-8 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
                <School className="w-8 h-8" />
              </div>
              <div className="px-4 py-1.5 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                Featured Outreach
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-display font-black text-white leading-tight mb-2">Schools Ministry</h3>
              <p className="text-white/70 text-sm font-medium leading-relaxed max-w-[240px]">
                Impacting the next generation in our community schools.
              </p>
            </div>
          </div>
          <div className="absolute bottom-6 right-6 w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary shadow-xl group-hover:scale-110 transition-transform">
            <ChevronRight className="w-6 h-6" />
          </div>
        </Link>

        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-48 bg-gray-50 rounded-3xl animate-pulse" />
          ))
        ) : ministries.map((ministry) => (
          <Link
            key={ministry.id}
            to={`/ministries/${ministry.id}`}
            className="group relative h-48 rounded-3xl overflow-hidden shadow-sm border border-gray-100"
          >
            {ministry.photo_url ? (
              <img src={ministry.photo_url} alt={ministry.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            ) : (
              <div className="w-full h-full bg-lavender flex items-center justify-center">
                <Users className="w-12 h-12 text-primary/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
              <h3 className="text-xl font-display font-black text-white leading-tight mb-1">{ministry.name}</h3>
              <div className="flex items-center gap-3 text-white/80 text-xs font-medium">
                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {ministry.leader_name || 'Ministry Leader'}</span>
                <span className="w-1 h-1 bg-white/40 rounded-full" />
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ministry.practice_day || 'Weekly'}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
