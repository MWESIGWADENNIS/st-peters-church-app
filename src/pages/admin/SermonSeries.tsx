import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Edit2,
  X,
  ImageIcon,
  BookOpen,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function AdminSermonSeries() {
  const navigate = useNavigate();
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSeries, setEditingSeries] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cover_image_url: ''
  });

  const fetchSeries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sermon_series')
        .select(`
          *,
          sermons (count)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSeries(data || []);
    } catch (err) {
      console.error('Error fetching series:', err);
      toast.error('Failed to load sermon series');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSeries) {
        const { error } = await supabase
          .from('sermon_series')
          .update(formData)
          .eq('id', editingSeries.id);
        if (error) throw error;
        toast.success('Series updated!');
      } else {
        const { error } = await supabase.from('sermon_series').insert([formData]);
        if (error) throw error;
        toast.success('Series created!');
      }
      setShowAddModal(false);
      setEditingSeries(null);
      setFormData({ title: '', description: '', cover_image_url: '' });
      fetchSeries();
    } catch (err) {
      toast.error('Failed to save series');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('sermon_series').delete().eq('id', id);
      if (error) throw error;
      toast.success('Series deleted');
      setDeleteConfirmId(null);
      fetchSeries();
    } catch (err) {
      toast.error('Failed to delete series');
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
            <h1 className="text-2xl font-black text-gray-900">Sermon Series</h1>
            <p className="text-gray-500 text-sm">Group sermons into thematic series.</p>
          </div>
        </div>
        <button 
          onClick={() => {
            setEditingSeries(null);
            setFormData({ title: '', description: '', cover_image_url: '' });
            setShowAddModal(true);
          }}
          className="bg-primary text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> New Series
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : series.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {series.map((s) => (
            <div 
              key={s.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group"
            >
              <div className="aspect-video bg-gray-100 relative">
                {s.cover_image_url ? (
                  <img 
                    src={s.cover_image_url} 
                    alt={s.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Layers className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  {deleteConfirmId === s.id ? (
                    <div className="flex items-center gap-1 animate-in zoom-in-95 duration-200">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }} 
                        className="p-2 bg-white rounded-full text-gray-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} 
                        className="px-3 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg"
                      >
                        Confirm
                      </button>
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={() => {
                          setEditingSeries(s);
                          setFormData({ title: s.title, description: s.description || '', cover_image_url: s.cover_image_url || '' });
                          setShowAddModal(true);
                        }}
                        className="p-3 bg-white rounded-full text-primary hover:scale-110 transition-transform"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(s.id)}
                        className="p-3 bg-white rounded-full text-red-600 hover:scale-110 transition-transform"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900">{s.title}</h3>
                  <span className="text-[10px] font-black bg-primary/10 px-2 py-1 rounded text-primary uppercase">
                    {s.sermons?.[0]?.count || 0} Sermons
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No series created</h3>
          <p className="text-gray-500">Organize your sermons by creating a series.</p>
        </div>
      )}

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
                  {editingSeries ? 'Edit Series' : 'New Sermon Series'}
                </h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Series Title</label>
                  <input 
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-all font-bold"
                    placeholder="e.g., The Parables of Jesus"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                  <textarea 
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-all font-medium"
                    placeholder="What is this series about?"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cover Image URL</label>
                  <input 
                    type="url"
                    value={formData.cover_image_url}
                    onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                    className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-all font-bold"
                    placeholder="https://..."
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 uppercase tracking-widest text-xs mt-4"
                >
                  {editingSeries ? 'Update Series' : 'Create Series'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
