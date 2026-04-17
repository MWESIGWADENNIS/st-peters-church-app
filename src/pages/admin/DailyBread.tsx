import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Calendar, BookOpen, Save, X, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AdminDailyBread() {
  const navigate = useNavigate();
  const [devotions, setDevotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    bible_verse: '',
    verse_text: '',
    devotion_body: '',
    prayer: '',
    devotion_date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchDevotions();
  }, []);

  const fetchDevotions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('daily_bread')
      .select('*')
      .order('devotion_date', { ascending: false });
    if (data) setDevotions(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('daily_bread')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Devotion updated!');
      } else {
        const { error } = await supabase
          .from('daily_bread')
          .insert(formData);
        if (error) {
          if (error.code === '23505') {
            throw new Error('A devotion already exists for this date. Please choose a different date or edit the existing one.');
          }
          throw error;
        }

        // Notify all users
        await supabase.rpc('notify_all_users', {
          notif_title: 'New Daily Bread!',
          notif_body: `Today's devotion: ${formData.title}`,
          notif_type: 'daily_bread'
        });

        toast.success('Devotion posted!');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        title: '',
        bible_verse: '',
        verse_text: '',
        devotion_body: '',
        prayer: '',
        devotion_date: format(new Date(), 'yyyy-MM-dd')
      });
      fetchDevotions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save devotion.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (dev: any) => {
    setFormData({
      title: dev.title || '',
      bible_verse: dev.bible_verse || '',
      verse_text: dev.verse_text || '',
      devotion_body: dev.devotion_body || '',
      prayer: dev.prayer || '',
      devotion_date: dev.devotion_date || format(new Date(), 'yyyy-MM-dd')
    });
    setEditingId(dev.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this devotion?')) return;
    try {
      const { error } = await supabase.from('daily_bread').delete().eq('id', id);
      if (error) throw error;
      toast.success('Devotion deleted.');
      fetchDevotions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete.');
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
          <h1 className="text-2xl font-black text-primary">Daily Bread</h1>
          <p className="text-xs text-gray-500 font-medium">Manage daily devotions.</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
          }}
          className="ml-auto w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">
              {editingId ? 'Edit Devotion' : 'New Devotion'}
            </h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Date</label>
              <input
                type="date"
                value={formData.devotion_date}
                onChange={e => setFormData({ ...formData, devotion_date: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                placeholder="e.g. Walking in Faith"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Bible Verse Reference</label>
              <input
                type="text"
                value={formData.bible_verse}
                onChange={e => setFormData({ ...formData, bible_verse: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                placeholder="e.g. John 3:16"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Verse Text</label>
              <textarea
                value={formData.verse_text}
                onChange={e => setFormData({ ...formData, verse_text: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none min-h-[80px]"
                placeholder="The actual text of the verse..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Devotion Body</label>
              <textarea
                value={formData.devotion_body}
                onChange={e => setFormData({ ...formData, devotion_body: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none min-h-[200px]"
                placeholder="Write the devotion content here..."
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Closing Prayer</label>
              <textarea
                value={formData.prayer}
                onChange={e => setFormData({ ...formData, prayer: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none min-h-[80px]"
                placeholder="A short prayer to end the devotion..."
              />
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
                <Save className="w-5 h-5" /> {editingId ? 'Update Devotion' : 'Post Devotion'}
              </>
            )}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse" />
          ))
        ) : devotions.map((dev) => (
          <div key={dev.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex flex-col items-center justify-center text-gray-400">
              <span className="text-[10px] font-black uppercase">{format(new Date(dev.devotion_date), 'MMM')}</span>
              <span className="text-lg font-black text-gray-600 leading-none">{format(new Date(dev.devotion_date), 'dd')}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-800 truncate">{dev.title}</h4>
              <p className="text-xs text-gray-500 truncate">{dev.bible_verse}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(dev)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(dev.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
