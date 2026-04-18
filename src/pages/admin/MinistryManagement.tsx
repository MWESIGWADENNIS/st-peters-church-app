import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  ChevronLeft,
  Loader2,
  Save,
  X,
  Check,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AdminMinistryManagement() {
  const navigate = useNavigate();
  const [ministries, setMinistries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    fetchMinistries();
  }, []);

  const fetchMinistries = async () => {
    setLoading(true);
    try {
      // Fetch ministries
      const { data: mData, error: mError } = await supabase
        .from('ministries')
        .select('*')
        .order('name', { ascending: true });

      if (mError) throw mError;

      // Fetch approved memberships to count
      const { data: umData, error: umError } = await supabase
        .from('user_ministries')
        .select('ministry_id')
        .eq('status', 'approved');

      if (umError) throw umError;

      // Map counts to ministries
      const ministriesWithCounts = (mData || []).map(m => ({
        ...m,
        memberCount: (umData || []).filter(um => um.ministry_id === m.id).length
      }));

      setMinistries(ministriesWithCounts);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch ministries');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMinistry = async () => {
    if (!formData.name.trim()) return;
    try {
      const { data, error } = await supabase
        .from('ministries')
        .insert({ 
          name: formData.name.trim(),
          description: formData.description.trim(),
          is_active: formData.is_active
        })
        .select()
        .single();

      if (error) throw error;

      setMinistries(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setFormData({ name: '', description: '', is_active: true });
      setIsAdding(false);
      toast.success('Ministry added successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add ministry');
    }
  };

  const handleUpdateMinistry = async (id: string) => {
    if (!formData.name.trim()) return;
    try {
      const { error } = await supabase
        .from('ministries')
        .update({ 
          name: formData.name.trim(),
          description: formData.description.trim(),
          is_active: formData.is_active
        })
        .eq('id', id);

      if (error) throw error;

      setMinistries(prev => prev.map(m => m.id === id ? { ...m, ...formData } : m).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingId(null);
      setFormData({ name: '', description: '', is_active: true });
      toast.success('Ministry updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update ministry');
    }
  };

  const toggleMinistryStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('ministries')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setMinistries(prev => prev.map(m => m.id === id ? { ...m, is_active: !currentStatus } : m));
      toast.success(`Ministry ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle status');
    }
  };

  const handleDeleteMinistry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ministries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMinistries(prev => prev.filter(m => m.id !== id));
      setDeleteConfirmId(null);
      toast.success('Ministry deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete ministry');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-50">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-black text-primary">Church Ministries</h1>
          </div>
          <button 
            onClick={() => {
              setIsAdding(true);
              setEditingId(null);
              setFormData({ name: '', description: '', is_active: true });
            }}
            className="p-2 bg-primary text-white rounded-xl shadow-lg"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {(isAdding || editingId) && (
          <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-primary/20 space-y-4 animate-in slide-in-from-top duration-300">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">
                {editingId ? 'Edit Ministry' : 'Add New Ministry'}
              </h3>
              <button 
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                }} 
                className="text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Youth Ministry"
                  className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Briefly describe the ministry..."
                  className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none font-bold min-h-[100px]"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <span className="text-sm font-bold text-gray-700">Active Status</span>
                <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className="text-primary"
                >
                  {formData.is_active ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => editingId ? handleUpdateMinistry(editingId) : handleAddMinistry()}
              className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" /> {editingId ? 'Update' : 'Save'} Ministry
            </button>
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading ministries...</p>
            </div>
          ) : ministries.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-bold">No ministries added yet</p>
            </div>
          ) : (
            ministries.map((m) => (
              <div 
                key={m.id}
                className={`bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3 transition-all ${!m.is_active ? 'opacity-60 grayscale' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${m.is_active ? 'bg-lavender text-primary' : 'bg-gray-100 text-gray-400'}`}>
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900">{m.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${m.is_active ? 'text-green-500' : 'text-gray-400'}`}>
                          {m.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                          {m.memberCount || 0} {m.memberCount === 1 ? 'Member' : 'Members'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => {
                        setEditingId(m.id);
                        setFormData({ name: m.name, description: m.description || '', is_active: m.is_active });
                        setIsAdding(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => toggleMinistryStatus(m.id, m.is_active)}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {m.is_active ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    {deleteConfirmId === m.id ? (
                      <div className="flex items-center gap-1 animate-in zoom-in-95 duration-200">
                        <button onClick={() => setDeleteConfirmId(null)} className="p-2 text-gray-400 bg-gray-50 rounded-lg">
                          <X className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteMinistry(m.id)} className="px-3 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg">
                          Confirm
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setDeleteConfirmId(m.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                {m.description && (
                  <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-2">
                    {m.description}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
