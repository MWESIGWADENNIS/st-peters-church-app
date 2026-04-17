import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Clock, 
  Calendar, 
  Info, 
  Star, 
  ListChecks, 
  BookOpen, 
  User, 
  Mic2, 
  Hash,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { getSundayTheme } from '../lib/churchSchedule';
import { cn } from '../lib/utils';
import { useDataStore } from '../store/dataStore';

export default function TodayService() {
  const navigate = useNavigate();
  const { churchSettings } = useDataStore();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const today = new Date();
  const sundayTheme = getSundayTheme(today);

  useEffect(() => {
    const fetchTodayServices = async () => {
      const dayName = format(today, 'EEEE');
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('day_of_week', dayName)
          .order('start_time', { ascending: true });
        
        if (error) throw error;
        if (data) {
          setServices(data);
          if (data.length > 0) setActiveTab(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTodayServices();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-20">
      {/* Modern Header */}
      <div className="bg-white px-6 pt-12 pb-8 rounded-b-[3rem] shadow-sm border-b border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="relative z-10 flex items-center justify-between mb-8">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)} 
            className="p-3 bg-gray-50 rounded-2xl text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
          <div className="text-right">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Service Program</p>
            <h1 className="text-2xl font-display font-black text-gray-900">Today's Flow</h1>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-accent font-black text-xs uppercase tracking-widest mb-2">
              <Calendar className="w-4 h-4" />
              {format(today, 'EEEE, MMMM do')}
            </div>
            {sundayTheme && (
              <h2 className="text-xl font-display font-black text-gray-900 leading-tight">
                {sundayTheme}
              </h2>
            )}
          </div>
          <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
            <Star className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="px-6 -mt-6">
        {/* Service Tabs */}
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {loading ? (
            Array(3).fill(0).map((_, i) => <div key={i} className="h-12 w-32 bg-gray-200 rounded-2xl animate-pulse flex-shrink-0" />)
          ) : services.map((service) => (
            <button
              key={service.id}
              onClick={() => setActiveTab(service.id)}
              className={cn(
                "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all flex-shrink-0 border shadow-sm",
                activeTab === service.id 
                  ? "bg-primary text-white border-primary scale-105 shadow-primary/20" 
                  : "bg-white text-gray-400 border-gray-100"
              )}
            >
              {service.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Active Service Detail */}
        <div className="mt-4">
          {loading ? (
            <div className="h-96 bg-white rounded-[2.5rem] animate-pulse" />
          ) : services.length > 0 ? (
            <AnimatePresence mode="wait">
              {services.filter(s => s.id === activeTab).map((service) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Service Card */}
                  <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Clock className="w-24 h-24 text-primary" />
                    </div>

                    <div className="relative z-10 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-lavender rounded-2xl flex items-center justify-center text-primary shadow-inner">
                          <Clock className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-display font-black text-gray-900">{service.name}</h3>
                          <p className="text-primary font-black text-sm uppercase tracking-widest">
                            {service.start_time.slice(0, 5)} — {service.end_time?.slice(0, 5) || 'TBA'}
                          </p>
                        </div>
                      </div>

                      {service.theme && (
                        <div className="p-5 bg-accent/5 border border-accent/10 rounded-3xl">
                          <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Hash className="w-3 h-3" /> Service Theme
                          </p>
                          <p className="text-lg font-bold text-gray-900 leading-tight">{service.theme}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        {service.preacher && (
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                              <Mic2 className="w-3 h-3" /> Preacher
                            </p>
                            <p className="text-sm font-bold text-gray-900">{service.preacher}</p>
                          </div>
                        )}
                        {service.leader && (
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                              <User className="w-3 h-3" /> Leader
                            </p>
                            <p className="text-sm font-bold text-gray-900">{service.leader}</p>
                          </div>
                        )}
                      </div>

                      {/* Timeline Program Flow */}
                      {service.programme && (
                        <div className="space-y-4 pt-4">
                          <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                            <ListChecks className="w-4 h-4" /> Program Flow
                          </div>
                          <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                            {service.programme.split('\n').filter((line: string) => line.trim()).map((step: string, idx: number) => (
                              <div key={idx} className="relative pl-10 group">
                                <div className="absolute left-0 top-1.5 w-6 h-6 bg-white border-2 border-primary rounded-full flex items-center justify-center z-10 group-hover:scale-110 transition-transform">
                                  <div className="w-2 h-2 bg-primary rounded-full" />
                                </div>
                                <p className="text-sm font-bold text-gray-700 leading-relaxed group-hover:text-primary transition-colors">
                                  {step}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bible Readings Card */}
                  {(service.psalms_reading || service.first_reading || service.second_reading) && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-primary text-white rounded-[2.5rem] p-8 shadow-xl shadow-primary/10 relative overflow-hidden"
                    >
                      <div className="absolute -right-8 -bottom-8 opacity-10">
                        <BookOpen size={160} />
                      </div>
                      
                      <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <h4 className="text-lg font-display font-black">Bible Readings</h4>
                        </div>

                        <div className="space-y-4">
                          {service.psalms_reading && (
                            <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                              <span className="text-xs font-black uppercase tracking-widest opacity-70">Psalms</span>
                              <span className="font-bold text-sm">{service.psalms_reading}</span>
                            </div>
                          )}
                          {service.first_reading && (
                            <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                              <span className="text-xs font-black uppercase tracking-widest opacity-70">1st Reading</span>
                              <span className="font-bold text-sm">{service.first_reading}</span>
                            </div>
                          )}
                          {service.second_reading && (
                            <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                              <span className="text-xs font-black uppercase tracking-widest opacity-70">2nd Reading</span>
                              <span className="font-bold text-sm">{service.second_reading}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {service.description && (
                    <div className="p-6 bg-white rounded-3xl border border-gray-100 flex gap-4">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 flex-shrink-0">
                        <Info className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed italic">
                        {service.description}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-gray-200" />
              </div>
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No services today</p>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="pt-12 text-center">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">
            {churchSettings?.church_name || "St. Peter's Church of Uganda"}
          </p>
        </div>
      </div>
    </div>
  );
}
