import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  School, 
  Clock, 
  User, 
  ChevronRight, 
  Church, 
  Flag, 
  Target, 
  Users as UsersIcon, 
  Info,
  MapPin,
  Calendar,
  ChevronDown,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Schools() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('*')
          .order('name', { ascending: true });
        
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
    <div className="min-h-screen bg-[#FAFAFA] pb-20">
      {/* Premium Header */}
      <div className="bg-white px-6 pt-12 pb-10 rounded-b-[3.5rem] shadow-sm border-b border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full -ml-24 -mb-24 blur-3xl" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <School className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Outreach</p>
              <h1 className="text-2xl font-display font-black text-gray-900">Schools Ministry</h1>
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-xs">
            Nurturing young minds and hearts through spiritual guidance and community support.
          </p>
        </div>
      </div>

      <div className="px-6 mt-8 space-y-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-40 bg-white rounded-[2.5rem] animate-pulse border border-gray-50" />
          ))
        ) : schools.length > 0 ? (
          schools.map((school) => (
            <motion.div
              layout
              key={school.id}
              className={cn(
                "bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden transition-all",
                expandedId === school.id ? "ring-2 ring-primary/10 shadow-xl shadow-gray-200/50" : "hover:border-primary/20"
              )}
            >
              <div 
                className="p-6 cursor-pointer"
                onClick={() => setExpandedId(expandedId === school.id ? null : school.id)}
              >
                <div className="flex gap-5">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-lavender flex-shrink-0 border border-gray-50 relative">
                    {school.photo_url ? (
                      <img src={school.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary/20">
                        <School className="w-8 h-8" />
                      </div>
                    )}
                    {school.is_church_school && (
                      <div className="absolute top-1 right-1 w-6 h-6 bg-primary text-white rounded-lg flex items-center justify-center shadow-md">
                        <Church className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-display font-black text-gray-900 text-lg leading-tight mb-1">{school.name}</h3>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">{school.type || 'School'}</p>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedId === school.id ? 180 : 0 }}
                        className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                        <Clock className="w-3 h-3 text-primary/40" />
                        {school.chapel_day || 'TBA'}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                        <User className="w-3 h-3 text-primary/40" />
                        {school.patron_name || 'No Patron'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {expandedId === school.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-50"
                  >
                    <div className="p-8 space-y-8 bg-gray-50/30">
                      {/* Motto & Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {school.motto && (
                          <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                            <Flag className="absolute -right-2 -bottom-2 w-12 h-12 text-primary/5 -rotate-12" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">School Motto</p>
                            <p className="text-sm font-bold text-gray-800 italic leading-relaxed">"{school.motto}"</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Students</p>
                            <div className="flex items-center gap-2">
                              <UsersIcon className="w-4 h-4 text-primary" />
                              <span className="text-lg font-display font-black text-gray-900">{school.student_count || '—'}</span>
                            </div>
                          </div>
                          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Chapel Time</p>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-accent" />
                              <span className="text-xs font-bold text-gray-900">{school.chapel_time || 'TBA'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Vision & Mission */}
                      {(school.vision || school.mission) && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                            <Target className="w-3 h-3" /> Vision & Mission
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {school.vision && (
                              <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm">
                                <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-2">Vision</p>
                                <p className="text-xs font-medium text-gray-600 leading-relaxed">{school.vision}</p>
                              </div>
                            )}
                            {school.mission && (
                              <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm">
                                <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-2">Mission</p>
                                <p className="text-xs font-medium text-gray-600 leading-relaxed">{school.mission}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Activities */}
                      {school.activities && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                            <BookOpen className="w-3 h-3" /> Ministry Activities
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {school.activities.split(',').map((activity: string, i: number) => (
                              <span key={i} className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-700 shadow-sm">
                                {activity.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Contact & Minister */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-lavender rounded-xl flex items-center justify-center text-primary">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Church Minister</p>
                            <p className="text-sm font-bold text-gray-900">{school.minister_name || 'Rev. Assigned'}</p>
                          </div>
                        </div>
                        {school.contact_person && (
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                              <Info className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Person</p>
                              <p className="text-sm font-bold text-gray-900">{school.contact_person}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <School className="w-16 h-16 text-gray-100 mx-auto mb-4" />
            <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No schools registered</p>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="pt-12 text-center">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">
          Building the Future in Christ
        </p>
      </div>
    </div>
  );
}
