import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Clock, Calendar, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { persistenceService } from '../../services/persistenceService';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export default function ServiceTimes() {
  const navigate = useNavigate();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = useNetworkStatus();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    const fetchServices = async () => {
      // Check cache first
      const cached = await persistenceService.get('schedule');
      if (cached?.length) {
        setServices(cached);
        setLoading(false);
      }

      if (!isOnline) return;

      try {
        const { data } = await supabase
          .from('services')
          .select('*')
          .order('day_of_week', { ascending: true })
          .order('start_time', { ascending: true });
        
        if (data) {
          setServices(data);
          await persistenceService.set('schedule', data);
        }
      } catch (err) {
        console.error('Error fetching service times:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [isOnline]);

  return (
    <div className="min-h-screen bg-white pb-12">
      <div className="p-4 flex items-center gap-4 sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-black text-primary">Service Times</h1>
      </div>

      <div className="p-6 space-y-8">
        <div className="space-y-4">
          <h2 className="text-3xl font-display font-black text-gray-900 leading-tight">
            Join Us in Worship
          </h2>
          <p className="text-gray-500 font-medium">
            Our weekly schedule of services and fellowships. All are welcome!
          </p>
        </div>

        <div className="space-y-8">
          {loading ? (
            Array(5).fill(0).map((_, i) => <div key={i} className="h-24 bg-gray-50 rounded-3xl animate-pulse" />)
          ) : days.map((day) => {
            const dayServices = services.filter(s => s.day_of_week === day);
            if (dayServices.length === 0) return null;

            return (
              <div key={day} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-gray-100" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] px-4">
                    {day}
                  </span>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>
                
                <div className="space-y-3">
                  {dayServices.map((service, idx) => (
                    <div 
                      key={idx}
                      className="flex items-start gap-4 p-5 bg-gray-50 rounded-3xl border border-transparent"
                    >
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">{service.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-primary">
                            {service.start_time.slice(0, 5)} - {service.end_time?.slice(0, 5) || 'TBA'}
                          </span>
                        </div>
                        {service.description && (
                          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                            {service.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
