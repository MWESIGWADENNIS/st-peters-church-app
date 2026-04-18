import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit2, 
  ChevronLeft,
  Loader2,
  Save,
  X,
  Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AdminZones() {
  const navigate = useNavigate();
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newZoneName, setNewZoneName] = useState('');
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    setLoading(true);
    try {
      // Fetch zones
      const { data: zData, error: zError } = await supabase
        .from('zones')
        .select('*')
        .order('name', { ascending: true });

      if (zError) throw zError;

      // Fetch users to count per zone
      const { data: uData, error: uError } = await supabase
        .from('users')
        .select('zone_id');

      if (uError) throw uError;

      // Map counts to zones
      const zonesWithCounts = (zData || []).map(z => ({
        ...z,
        memberCount: (uData || []).filter(u => u.zone_id === z.id).length
      }));

      setZones(zonesWithCounts);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch zones');
    } finally {
      setLoading(false);
    }
  };

  const handleAddZone = async () => {
    if (!newZoneName.trim()) return;
    try {
      const { data, error } = await supabase
        .from('zones')
        .insert({ name: newZoneName.trim() })
        .select()
        .single();

      if (error) throw error;

      setZones(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewZoneName('');
      setIsAdding(false);
      toast.success('Zone added successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add zone');
    }
  };

  const handleUpdateZone = async (id: string) => {
    if (!editName.trim()) return;
    try {
      const { error } = await supabase
        .from('zones')
        .update({ name: editName.trim() })
        .eq('id', id);

      if (error) throw error;

      setZones(prev => prev.map(z => z.id === id ? { ...z, name: editName.trim() } : z).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingId(null);
      toast.success('Zone updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update zone');
    }
  };

  const handleDeleteZone = async (id: string) => {
    try {
      const { error } = await supabase
        .from('zones')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setZones(prev => prev.filter(z => z.id !== id));
      setDeleteConfirmId(null);
      toast.success('Zone deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete zone');
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
            <h1 className="text-lg font-black text-primary">Manage Zones</h1>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="p-2 bg-primary text-white rounded-xl shadow-lg"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {isAdding && (
          <div className="bg-white rounded-3xl p-5 shadow-lg border-2 border-primary/20 space-y-4 animate-in slide-in-from-top duration-300">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Add New Zone</h3>
              <button onClick={() => setIsAdding(false)} className="text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              value={newZoneName}
              onChange={e => setNewZoneName(e.target.value)}
              placeholder="Enter zone name (e.g. Bujoloto)"
              className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none font-bold"
              autoFocus
            />
            <button
              onClick={handleAddZone}
              className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" /> Save Zone
            </button>
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading zones...</p>
            </div>
          ) : zones.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
              <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-bold">No zones added yet</p>
            </div>
          ) : (
            zones.map((zone) => (
              <div 
                key={zone.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between group"
              >
                {editingId === zone.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none font-bold"
                      autoFocus
                    />
                    <button 
                      onClick={() => handleUpdateZone(zone.id)}
                      className="p-2 bg-green-500 text-white rounded-lg"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setEditingId(null)}
                      className="p-2 bg-gray-100 text-gray-400 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-lavender rounded-xl flex items-center justify-center text-primary">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-800 block">{zone.name}</span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                          {zone.memberCount || 0} {zone.memberCount === 1 ? 'Person' : 'People'}
                        </span>
                      </div>
                    </div>
                    {deleteConfirmId === zone.id ? (
                      <div className="flex items-center gap-1 animate-in zoom-in-95 duration-200">
                        <button onClick={() => setDeleteConfirmId(null)} className="p-2 text-gray-400 bg-gray-50 rounded-lg">
                          <X className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteZone(zone.id)} className="px-3 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg">
                          Delete
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingId(zone.id);
                            setEditName(zone.name || '');
                          }}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(zone.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
