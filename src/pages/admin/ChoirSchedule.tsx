import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Music, 
  Plus, 
  Trash2, 
  Edit2,
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function AdminChoirSchedule() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    practice_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '17:00',
    end_time: '19:00',
    venue: 'Church Main Hall',
    preparation: '',
    notes: ''
  });

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('choir_schedule')
        .select('*')
        .order('practice_date', { ascending: true });
      if (error) throw error;
      setSchedules(data || []);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      toast.error('Failed to load choir schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        const { error } = await supabase
          .from('choir_schedule')
          .update(formData)
          .eq('id', editingSchedule.id);
        if (error) throw error;
        toast.success('Schedule updated!');
      } else {
        const { error } = await supabase.from('choir_schedule').insert([formData]);
        if (error) throw error;
        toast.success('Practice session added!');
      }
      setShowAddModal(false);
      setEditingSchedule(null);
      setFormData({
        title: '',
        description: '',
        practice_date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '17:00',
        end_time: '19:00',
        venue: 'Church Main Hall',
        preparation: '',
        notes: ''
      });
      fetchSchedules();
    } catch (err: any) {
      console.error('Error saving schedule:', err);
      toast.error(err.message || 'Failed to save schedule');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('choir_schedule').delete().eq('id', id);
      if (error) throw error;
      toast.success('Session deleted');
      setShowDeleteConfirm(null);
      fetchSchedules();
    } catch (err) {
      toast.error('Failed to delete session');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Choir Schedule</h1>
            <p className="text-gray-500 text-sm">Manage choir practice sessions and rehearsals.</p>
          </div>
        </div>
        <motion.button 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05, backgroundColor: 'var(--color-primary-dark)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingSchedule(null);
            setFormData({
              title: '',
              description: '',
              practice_date: format(new Date(), 'yyyy-MM-dd'),
              start_time: '17:00',
              end_time: '19:00',
              venue: 'Church Main Hall',
              preparation: '',
              notes: ''
            });
            setShowAddModal(true);
          }}
          className="bg-primary text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Session
        </motion.button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : schedules.length > 0 ? (
        <div className="space-y-4">
          {schedules.map((s) => (
            <div 
              key={s.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 group"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-primary/5 rounded-2xl flex flex-col items-center justify-center text-primary border border-primary/10">
                  <span className="text-[10px] font-black uppercase tracking-tighter">{format(new Date(s.practice_date), 'MMM')}</span>
                  <span className="text-xl font-black">{format(new Date(s.practice_date), 'dd')}</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{s.title || s.venue}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                      <Clock className="w-3.5 h-3.5" /> {s.start_time.slice(0, 5)} {s.end_time ? `- ${s.end_time.slice(0, 5)}` : ''}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                      <MapPin className="w-3.5 h-3.5" /> {s.venue}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    setEditingSchedule(s);
                    setFormData({
                      title: s.title || '',
                      description: s.description || '',
                      practice_date: s.practice_date,
                      start_time: s.start_time.slice(0, 5),
                      end_time: s.end_time ? s.end_time.slice(0, 5) : '19:00',
                      venue: s.venue,
                      preparation: s.preparation || '',
                      notes: s.notes || ''
                    });
                    setShowAddModal(true);
                  }}
                  className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(s.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <Music className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No sessions scheduled</h3>
          <p className="text-gray-500">Schedule the next choir practice session.</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center space-y-6"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-600">
                <Trash2 className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">Delete Session?</h2>
                <p className="text-gray-500 text-sm mt-2">This action cannot be undone. Are you sure you want to remove this practice session?</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                  {editingSchedule ? 'Edit Session' : 'New Practice Session'}
                </h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Session Title</label>
                  <input 
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-all font-bold"
                    placeholder="e.g., Sunday Service Rehearsal"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description (Optional)</label>
                  <input 
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-all font-bold"
                    placeholder="e.g., Preparing for the Easter service"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date</label>
                    <input 
                      required
                      type="date"
                      value={formData.practice_date}
                      onChange={(e) => setFormData({ ...formData, practice_date: e.target.value })}
                      className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Start Time</label>
                    <input 
                      required
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">End Time</label>
                    <input 
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Venue</label>
                    <input 
                      required
                      type="text"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-all font-bold"
                      placeholder="e.g., Church Main Hall"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Preparation</label>
                  <textarea 
                    value={formData.preparation}
                    onChange={(e) => setFormData({ ...formData, preparation: e.target.value })}
                    className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-all font-bold min-h-[80px]"
                    placeholder="e.g., Songs to rehearse..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Notes</label>
                  <input 
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-all font-bold"
                    placeholder="e.g., Bring your hymn books"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 uppercase tracking-widest text-xs mt-4"
                >
                  {editingSchedule ? 'Update Session' : 'Add Session'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
