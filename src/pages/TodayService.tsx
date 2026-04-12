import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Clock, Calendar, Info, Star, ListChecks, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { getSundayTheme } from '../lib/churchSchedule';

import { useDataStore } from '../store/dataStore';

export default function TodayService() {
  const navigate = useNavigate();
  const { churchSettings } = useDataStore();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const sundayTheme = getSundayTheme(today);

  useEffect(() => {
    const fetchTodayServices = async () => {
      const dayName = format(today, 'EEEE');
      setLoading(true);
      try {
        const fetchPromise = supabase
          .from('services')
          .select('*')
          .eq('day_of_week', dayName)
          .order('start_time', { ascending: true });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 60000)
        );

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
        
        if (error) {
          console.error('Error fetching today services:', error);
        } else if (data) {
          setServices(data);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTodayServices();
  }, []);

  return (
    <div className="min-h-screen bg-white pb-12">
      {/* Header */}
      <div className="p-4 flex items-center gap-4 sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-black text-primary">Today's Programme</h1>
      </div>

      <div className="p-6 space-y-8">
        {/* Date & Theme Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-accent font-bold text-sm uppercase tracking-widest">
            <Calendar className="w-4 h-4" />
            {format(today, 'EEEE, MMMM do')}
          </div>
          
          {sundayTheme && (
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-sm">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Sunday Theme</p>
                <h2 className="text-xl font-display font-black text-gray-900">{sundayTheme}</h2>
              </div>
            </div>
          )}

          <h2 className="text-3xl font-display font-black text-gray-900 leading-tight">
            Service Schedule
          </h2>
          <p className="text-gray-500 font-medium leading-relaxed">
            Join us for today's services and fellowships. We look forward to worshipping with you!
          </p>
        </div>

        {/* Services List */}
        <div className="space-y-6">
          {loading ? (
            Array(3).fill(0).map((_, i) => <div key={i} className="h-32 bg-gray-50 rounded-3xl animate-pulse" />)
          ) : services.length > 0 ? (
            services.map((service) => (
              <div 
                key={service.id}
                className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4 hover:border-primary/20 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-lavender rounded-2xl flex items-center justify-center text-primary">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{service.name}</h3>
                      <p className="text-primary font-bold text-sm">
                        {service.start_time.slice(0, 5)} - {service.end_time?.slice(0, 5) || 'TBA'}
                      </p>
                    </div>
                  </div>
                </div>

                {service.description && (
                  <div className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                    <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">
                      {service.description}
                    </p>
                  </div>
                )}

                {/* Service Content Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {(service.preacher || service.leader || service.theme) && (
                    <div className="space-y-3">
                      {service.theme && (
                        <div className="p-3 bg-accent/5 border border-accent/10 rounded-xl">
                          <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">Theme</p>
                          <p className="text-sm font-bold text-gray-900">{service.theme}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        {service.preacher && (
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Preacher</p>
                            <p className="text-xs font-bold text-gray-800">{service.preacher}</p>
                          </div>
                        )}
                        {service.leader && (
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Leader</p>
                            <p className="text-xs font-bold text-gray-800">{service.leader}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(service.psalms_reading || service.first_reading || service.second_reading) && (
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-3">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                        <BookOpen className="w-3 h-3" /> Bible Readings
                      </p>
                      <div className="space-y-2">
                        {service.psalms_reading && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-medium">Psalms</span>
                            <span className="font-bold text-gray-900">{service.psalms_reading}</span>
                          </div>
                        )}
                        {service.first_reading && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-medium">
                              {service.name.toLowerCase().includes('eng') || service.name.toLowerCase().includes('local language') 
                                ? '1st Reading' 
                                : 'Reading'}
                            </span>
                            <span className="font-bold text-gray-900">{service.first_reading}</span>
                          </div>
                        )}
                        {service.second_reading && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-medium">2nd Reading</span>
                            <span className="font-bold text-gray-900">{service.second_reading}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {service.programme && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <ListChecks className="w-3 h-3" /> Service Programme
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-medium">
                        {service.programme}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-medium italic">No services scheduled for today.</p>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="pt-8 text-center">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
            {churchSettings?.church_name || "St. Peter's Church of Uganda"}
          </p>
        </div>
      </div>
    </div>
  );
}
