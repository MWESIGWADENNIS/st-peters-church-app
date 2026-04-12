import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { School, Clock, User, ChevronRight, Church } from 'lucide-react';

export default function Schools() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const fetchPromise = supabase.from('schools').select('*');
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 60000)
        );

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
        
        if (error) throw error;
        if (data) setSchools(data);
      } catch (err) {
        console.error('Error fetching schools:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchools();
  }, []);

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-primary">Schools Ministry</h1>
        <p className="text-sm text-gray-500 font-medium">Supporting education and spiritual growth in our community schools.</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-gray-50 rounded-3xl animate-pulse" />
          ))
        ) : schools.length > 0 ? (
          schools.map((school) => (
            <div
              key={school.id}
              className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-lavender rounded-2xl flex items-center justify-center text-primary flex-shrink-0">
                    <School className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{school.name}</h3>
                      {school.is_church_school && (
                        <Church className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {school.type || 'Educational Institution'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock className="w-4 h-4 text-primary/40" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-tighter opacity-60">Chapel Time</p>
                    <p className="text-xs font-bold text-gray-700 truncate">{school.chapel_day || 'TBA'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <User className="w-4 h-4 text-primary/40" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-tighter opacity-60">Minister</p>
                    <p className="text-xs font-bold text-gray-700 truncate">{school.minister_name || 'Church Minister'}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <School className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">School list will be updated soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
