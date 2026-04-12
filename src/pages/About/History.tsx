import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, ScrollText } from 'lucide-react';

import { useDataStore } from '../../store/dataStore';

export default function History() {
  const navigate = useNavigate();
  const { churchSettings: settings, setChurchSettings } = useDataStore();
  const [loading, setLoading] = useState(!settings);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase.from('church_settings').select('*').single();
      if (data) setChurchSettings(data);
      setLoading(false);
    };
    if (!settings) fetchHistory();
  }, [settings, setChurchSettings]);

  const history = settings?.history;

  return (
    <div className="min-h-screen bg-white pb-12">
      <div className="p-4 flex items-center gap-4 sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-black text-primary">Church History</h1>
      </div>

      <div className="p-6 space-y-6">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-4">
          <ScrollText className="w-8 h-8" />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-3xl font-display font-black text-gray-900 leading-tight">
            Our Journey of Faith
          </h2>
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
            </div>
          ) : history ? (
            <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">
              {history}
            </div>
          ) : (
            <p className="text-gray-400 italic">
              The history of St. Peter's Church is being compiled. Please check back later.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
