import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Megaphone, Save, X, Pin, Upload, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AdminAnnouncements() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    image_url: '',
    is_pinned: false,
    target: 'all'
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const { isSupabaseConfigured } = await import('../../lib/supabase');
    if (!isSupabaseConfigured) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setAnnouncements(data);
    } catch (err: any) {
      console.error('Error fetching announcements:', err);
      let message = 'Failed to load announcements';
      if (err.message?.includes('Failed to fetch')) {
        message = 'Connection error. Please check your internet or Supabase configuration.';
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('announcements')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Announcement updated!');
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert(formData);
        if (error) throw error;

        // Notify all users
        const { error: notifError } = await supabase.rpc('notify_all_users', {
          notif_title: 'New Announcement!',
          notif_body: formData.title,
          notif_type: 'announcement'
        });
        if (notifError) {
          console.error('Notification error:', notifError);
          toast.error('Announcement posted but notification failed.');
        }

        toast.success('Announcement posted!');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ title: '', body: '', image_url: '', is_pinned: false, target: 'all' });
      fetchAnnouncements();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save announcement.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `ann-${Math.random()}.${fileExt}`;
      const filePath = `announcements/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('church-assets').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('church-assets').getPublicUrl(filePath);
      setFormData({ ...formData, image_url: publicUrl });
      toast.success('Image uploaded!');
    } catch (error: any) {
      toast.error(error.message || 'Upload failed.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      toast.success('Deleted.');
      setDeleteConfirmId(null);
      fetchAnnouncements();
    } catch (error: any) {
      toast.error(error.message || 'Delete failed.');
    }
  };

  return (
    <div className="p-4 space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/admin')}
          className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-primary">Announcements</h1>
          <p className="text-xs text-gray-500 font-medium">Manage church news and updates.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="ml-auto w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">
              {editingId ? 'Edit Announcement' : 'New Announcement'}
            </h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Body</label>
              <textarea
                value={formData.body}
                onChange={e => setFormData({ ...formData, body: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none min-h-[120px]"
                required
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-bold text-gray-600">Pin to Top</span>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_pinned: !formData.is_pinned })}
                className={`w-10 h-5 rounded-full transition-colors relative ${formData.is_pinned ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.is_pinned ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Image (Optional)</label>
              <div className="flex items-center gap-4">
                {formData.image_url && (
                  <img src={formData.image_url} alt="Preview" className="w-16 h-16 rounded-xl object-cover" />
                )}
                <label className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center gap-2 cursor-pointer text-xs font-bold text-gray-500">
                  <Upload className="w-4 h-4" /> {formData.image_url ? 'Change Image' : 'Upload Image'}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full py-4 bg-primary text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" /> {editingId ? 'Update' : 'Post'}
              </>
            )}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {loading ? (
          Array(5).fill(0).map((_, i) => <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse" />)
        ) : announcements.map((ann) => (
          <div key={ann.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            {ann.image_url ? (
              <img src={ann.image_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
            ) : (
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300">
                <Megaphone className="w-6 h-6" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {ann.is_pinned && <Pin className="w-3 h-3 text-accent fill-accent" />}
                <h4 className="font-bold text-gray-800 truncate">{ann.title}</h4>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">{format(new Date(ann.created_at), 'MMM dd, yyyy')}</p>
            </div>
            {deleteConfirmId === ann.id ? (
              <div className="flex items-center gap-1 animate-in zoom-in-95 duration-200">
                <button onClick={() => setDeleteConfirmId(null)} className="p-2 text-gray-400 bg-gray-50 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(ann.id)} className="px-3 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg">
                  Delete
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => { 
                    setEditingId(ann.id); 
                    setFormData({
                      title: ann.title || '',
                      body: ann.body || '',
                      image_url: ann.image_url || '',
                      is_pinned: ann.is_pinned || false,
                      target: ann.target || 'all'
                    }); 
                    setShowForm(true); 
                  }} 
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteConfirmId(ann.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
