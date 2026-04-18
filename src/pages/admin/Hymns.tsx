import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Music, Save, X, Search, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AdminHymns() {
  const navigate = useNavigate();
  const [hymns, setHymns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    number: '',
    title: '',
    lyrics: '',
    category: 'General'
  });

  useEffect(() => {
    fetchHymns();
  }, []);

  const fetchHymns = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('hymns')
      .select('*')
      .order('number', { ascending: true });
    if (data) setHymns(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const hymnNumber = parseInt(formData.number as string);
    const dataToSave = {
      ...formData,
      number: isNaN(hymnNumber) ? 0 : hymnNumber
    };

    const loadingToast = toast.loading(editingId ? 'Updating hymn...' : 'Adding hymn...');

    try {
      console.log('Attempting to save hymn:', dataToSave);
      
      // Pre-check for duplicate number if adding new
      if (!editingId) {
        const { data: existing } = await supabase
          .from('hymns')
          .select('id')
          .eq('number', dataToSave.number)
          .maybeSingle();
        
        if (existing) {
          toast.dismiss(loadingToast);
          throw new Error(`Hymn number ${dataToSave.number} already exists.`);
        }
      }

      if (editingId) {
        const { error } = await supabase.from('hymns').update(dataToSave).eq('id', editingId);
        if (error) throw error;
        toast.success('Hymn updated!', { id: loadingToast });
      } else {
        const { error } = await supabase.from('hymns').insert(dataToSave);
        if (error) {
          console.error('Supabase Insert Error:', error);
          if (error.code === '23505') throw new Error('Hymn number already exists.');
          throw error;
        }
        toast.success('Hymn added!', { id: loadingToast });
      }
      
      setShowForm(false);
      setEditingId(null);
      setFormData({ number: '', title: '', lyrics: '', category: 'General' });
      fetchHymns();
    } catch (error: any) {
      console.error('Hymn Save Error:', error);
      toast.error(error.message || 'Failed to save hymn.', { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('hymns').delete().eq('id', id);
      if (error) throw error;
      toast.success('Deleted.');
      setDeleteConfirmId(null);
      fetchHymns();
    } catch (error: any) {
      toast.error(error.message || 'Delete failed.');
    }
  };

  const filteredHymns = hymns.filter(h => 
    h.title.toLowerCase().includes(search.toLowerCase()) || 
    h.number.toString().includes(search)
  );

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
          <h1 className="text-2xl font-black text-primary">Hymns</h1>
          <p className="text-xs text-gray-500 font-medium">Manage church hymn book.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="ml-auto w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by number or title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 focus:ring-2 focus:ring-primary outline-none font-bold"
        />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">
              {editingId ? 'Edit Hymn' : 'New Hymn'}
            </h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Number</label>
                <input
                  type="number"
                  value={formData.number}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData({ ...formData, number: val === '' ? '' : val });
                  }}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. Praise"
                  required
                />
              </div>
            </div>
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
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Lyrics</label>
              <textarea
                value={formData.lyrics}
                onChange={e => setFormData({ ...formData, lyrics: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none min-h-[200px] font-mono text-sm"
                required
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
                <Save className="w-5 h-5" /> {editingId ? 'Update Hymn' : 'Add Hymn'}
              </>
            )}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {loading ? (
          Array(5).fill(0).map((_, i) => <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse" />)
        ) : filteredHymns.map((hymn) => (
          <div key={hymn.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-lavender rounded-xl flex items-center justify-center text-primary font-black">
              {hymn.number}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-800 truncate">{hymn.title}</h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{hymn.category}</p>
            </div>
            {deleteConfirmId === hymn.id ? (
              <div className="flex items-center gap-1 animate-in zoom-in-95 duration-200">
                <button onClick={() => setDeleteConfirmId(null)} className="p-2 text-gray-400 bg-gray-50 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(hymn.id)} className="px-3 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg">
                  Delete
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => { setEditingId(hymn.id); setFormData(hymn); setShowForm(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteConfirmId(hymn.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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
