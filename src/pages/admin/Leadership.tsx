import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, User, Save, X, Upload, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AdminLeadership() {
  const navigate = useNavigate();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    role: '',
    bio: '',
    photo_url: '',
    order_index: 0,
    is_active: true
  });

  useEffect(() => {
    fetchLeaders();
  }, []);

  const fetchLeaders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('leadership')
      .select('*')
      .order('order_index', { ascending: true });
    if (data) setLeaders(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase.from('leadership').update(formData).eq('id', editingId);
        if (error) throw error;
        toast.success('Leader updated!');
      } else {
        const { error } = await supabase.from('leadership').insert(formData);
        if (error) throw error;
        toast.success('Leader added!');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ full_name: '', role: '', bio: '', photo_url: '', order_index: 0, is_active: true });
      fetchLeaders();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save leader.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `ldr-${Math.random()}.${fileExt}`;
      const filePath = `leadership/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('church-assets').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('church-assets').getPublicUrl(filePath);
      setFormData({ ...formData, photo_url: publicUrl });
      toast.success('Photo uploaded!');
    } catch (error: any) {
      toast.error(error.message || 'Upload failed.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this leader?')) return;
    try {
      const { error } = await supabase.from('leadership').delete().eq('id', id);
      if (error) throw error;
      toast.success('Deleted.');
      fetchLeaders();
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
          <h1 className="text-2xl font-black text-primary">Leadership</h1>
          <p className="text-xs text-gray-500 font-medium">Manage church leaders and staff.</p>
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
              {editingId ? 'Edit Leader' : 'New Leader'}
            </h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-lavender flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                  {formData.photo_url ? (
                    <img src={formData.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-primary/20" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer border-2 border-white">
                  <Upload className="w-4 h-4" />
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Role / Title</label>
              <input
                type="text"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                placeholder="e.g. Parish Priest"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Bio (Optional)</label>
              <textarea
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Display Order</label>
                <input
                  type="number"
                  value={isNaN(formData.order_index) ? '' : formData.order_index}
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    setFormData({ ...formData, order_index: isNaN(val) ? 0 : val });
                  }}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                  required
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mt-5">
                <span className="text-xs font-bold text-gray-600">Active</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`w-10 h-5 rounded-full transition-colors relative ${formData.is_active ? 'bg-primary' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.is_active ? 'right-1' : 'left-1'}`} />
                </button>
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
                <Save className="w-5 h-5" /> {editingId ? 'Update Leader' : 'Add Leader'}
              </>
            )}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {loading ? (
          Array(5).fill(0).map((_, i) => <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse" />)
        ) : leaders.map((leader) => (
          <div key={leader.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-lavender flex-shrink-0">
              {leader.photo_url ? (
                <img src={leader.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary/30">
                  <User className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-800 truncate">{leader.full_name}</h4>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{leader.role}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditingId(leader.id); setFormData(leader); setShowForm(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(leader.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
