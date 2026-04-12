import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, User } from 'lucide-react';

export default function Leadership() {
  const navigate = useNavigate();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      const { data } = await supabase
        .from('leadership')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      
      if (data) setLeaders(data);
      setLoading(false);
    };
    fetchLeaders();
  }, []);

  return (
    <div className="min-h-screen bg-white pb-12">
      <div className="p-4 flex items-center gap-4 sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-black text-primary">Our Leadership</h1>
      </div>

      <div className="p-6 space-y-8">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-20 h-20 bg-gray-100 rounded-full" />
              <div className="flex-1 space-y-2 py-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : leaders.length > 0 ? (
          leaders.map((leader) => (
            <div key={leader.id} className="flex gap-6 items-start">
              <div className="w-24 h-24 rounded-full bg-lavender flex-shrink-0 overflow-hidden border-4 border-white shadow-md">
                {leader.photo_url ? (
                  <img src={leader.photo_url} alt={leader.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-10 h-10 text-primary/30" />
                  </div>
                )}
              </div>
              <div className="flex-1 pt-2 space-y-1">
                <h3 className="font-display font-black text-xl text-gray-900 leading-tight">
                  {leader.full_name}
                </h3>
                <p className="text-xs font-bold text-primary uppercase tracking-widest">
                  {leader.role}
                </p>
                {leader.bio && (
                  <p className="text-sm text-gray-500 leading-relaxed mt-2 line-clamp-3">
                    {leader.bio}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-400 italic">
            Leadership information will be updated soon.
          </div>
        )}
      </div>
    </div>
  );
}
