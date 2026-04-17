import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  StickyNote, 
  Plus, 
  Trash2, 
  Calendar,
  Clock,
  AlertCircle,
  X,
  ArrowLeft
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function AdminNotices() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newNotice, setNewNotice] = useState({
    title: '',
    body: '',
    colour: 'yellow',
    expires_at: format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm")
  });

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNotices(data || []);
    } catch (err) {
      console.error('Error fetching notices:', err);
      toast.error('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('notices').insert([newNotice]);
      if (error) throw error;

      // Notify all users
      await supabase.rpc('notify_all_users', {
        notif_title: 'New Notice Posted!',
        notif_body: newNotice.title,
        notif_type: 'notice'
      });

      toast.success('Notice posted!');
      setShowAddModal(false);
      setNewNotice({
        title: '',
        body: '',
        colour: 'yellow',
        expires_at: format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm")
      });
      fetchNotices();
    } catch (err) {
      toast.error('Failed to post notice');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('notices').delete().eq('id', deleteId);
      if (error) throw error;
      toast.success('Notice removed');
      setDeleteId(null);
      fetchNotices();
    } catch (err) {
      toast.error('Failed to delete notice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin')}
            className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Notice Board</h1>
            <p className="text-gray-500 text-sm">Post quick updates and sticky notes.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> New Notice
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : notices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {notices.map((notice) => (
            <motion.div
              key={notice.id}
              layout
              className={cn(
                "p-6 rounded-2xl border-2 shadow-sm relative group overflow-hidden",
                notice.colour === 'red' ? 'bg-red-50 border-red-100' :
                notice.colour === 'green' ? 'bg-emerald-50 border-emerald-100' :
                notice.colour === 'blue' ? 'bg-blue-50 border-blue-100' :
                'bg-amber-50 border-amber-100'
              )}
            >
              <button 
                onClick={() => setDeleteId(notice.id)}
                className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-600 transition-all bg-white/80 backdrop-blur-sm rounded-lg shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <h3 className="font-black font-display text-lg uppercase mb-2 pr-6">{notice.title}</h3>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">{notice.body}</p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                <Clock className="w-3 h-3" /> Expires: {format(new Date(notice.expires_at), 'MMM dd, HH:mm')}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <StickyNote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No active notices</h3>
          <p className="text-gray-500">Post a notice to keep the congregation informed.</p>
        </div>
      )}

      {/* Add Modal */}
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
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Post New Notice</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Title</label>
                  <input 
                    required
                    type="text"
                    value={newNotice.title}
                    onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                    className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-all font-bold"
                    placeholder="e.g., Choir Practice Cancelled"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message</label>
                  <textarea 
                    required
                    rows={3}
                    value={newNotice.body}
                    onChange={(e) => setNewNotice({ ...newNotice, body: e.target.value })}
                    className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-all font-medium"
                    placeholder="Brief details..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Color</label>
                    <select 
                      value={newNotice.colour}
                      onChange={(e) => setNewNotice({ ...newNotice, colour: e.target.value })}
                      className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-all font-bold"
                    >
                      <option value="yellow">Yellow (General)</option>
                      <option value="red">Red (Urgent)</option>
                      <option value="green">Green (Success)</option>
                      <option value="blue">Blue (Info)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Expires At</label>
                    <input 
                      required
                      type="datetime-local"
                      value={newNotice.expires_at}
                      onChange={(e) => setNewNotice({ ...newNotice, expires_at: e.target.value })}
                      className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 uppercase tracking-widest text-xs mt-4"
                >
                  Post Notice
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl space-y-6 text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto text-red-600">
                <Trash2 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Delete Notice?</h2>
                <p className="text-gray-500 text-sm mt-2">This action cannot be undone. Are you sure you want to remove this notice from the board?</p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-4 bg-gray-50 text-gray-600 font-black rounded-2xl uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-200 uppercase tracking-widest text-[10px]"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
