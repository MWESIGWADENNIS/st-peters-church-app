import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Clock, Save, X, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AdminServices() {
  const navigate = useNavigate();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    day_of_week: 'Sunday',
    start_time: '08:00',
    end_time: '10:00',
    description: '',
    programme: '',
    psalms_reading: '',
    first_reading: '',
    second_reading: '',
    preacher: '',
    leader: '',
    theme: ''
  });

  const daysOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('services')
      .select('*')
      .order('start_time');
    
    if (data) {
      // Sort by day order defined in 'daysOrder' array
      const sorted = [...data].sort((a, b) => {
        const dayA = daysOrder.indexOf(a.day_of_week);
        const dayB = daysOrder.indexOf(b.day_of_week);
        if (dayA !== dayB) return dayA - dayB;
        return a.start_time.localeCompare(b.start_time);
      });
      setServices(sorted);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase.from('services').update(formData).eq('id', editingId);
        if (error) throw error;
        toast.success('Service updated!');
      } else {
        const { error } = await supabase.from('services').insert(formData);
        if (error) throw error;
        toast.success('Service added!');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ 
        name: '', 
        day_of_week: 'Sunday', 
        start_time: '08:00', 
        end_time: '10:00', 
        description: '', 
        programme: '',
        psalms_reading: '',
        first_reading: '',
        second_reading: '',
        preacher: '',
        leader: '',
        theme: ''
      });
      fetchServices();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save service.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      toast.success('Deleted.');
      setDeleteConfirmId(null);
      fetchServices();
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
          <h1 className="text-2xl font-black text-primary">Church Services</h1>
          <p className="text-xs text-gray-500 font-medium">Manage weekly service schedule.</p>
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
              {editingId ? 'Edit Service' : 'New Service'}
            </h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="pb-4 border-b border-gray-50">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Quick Select Service</label>
            <select
              value={editingId || 'new'}
              onChange={(e) => {
                const id = e.target.value;
                if (id === 'new') {
                  setEditingId(null);
                  setFormData({ 
                    name: '', 
                    day_of_week: 'Sunday', 
                    start_time: '08:00', 
                    end_time: '10:00', 
                    description: '', 
                    programme: '',
                    psalms_reading: '',
                    first_reading: '',
                    second_reading: '',
                    preacher: '',
                    leader: '',
                    theme: ''
                  });
                } else {
                  const service = services.find(s => s.id === id);
                  if (service) {
                    setEditingId(service.id);
                    setFormData({
                      name: service.name || '',
                      day_of_week: service.day_of_week || 'Sunday',
                      start_time: service.start_time || '08:00',
                      end_time: service.end_time || '10:00',
                      description: service.description || '',
                      programme: service.programme || '',
                      psalms_reading: service.psalms_reading || '',
                      first_reading: service.first_reading || '',
                      second_reading: service.second_reading || '',
                      preacher: service.preacher || '',
                      leader: service.leader || '',
                      theme: service.theme || ''
                    });
                  }
                }
              }}
              className="w-full px-4 py-3 bg-primary/5 rounded-xl border border-primary/10 focus:ring-2 focus:ring-primary outline-none font-bold text-primary"
            >
              <option value="new">+ Create New Service</option>
              {daysOrder.map(day => {
                const dayServices = services.filter(s => s.day_of_week === day);
                if (dayServices.length === 0) return null;
                return (
                  <optgroup key={day} label={day}>
                    {dayServices.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.start_time.slice(0, 5)})
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>
          
          <div className="space-y-4">
            {!editingId && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Service Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="e.g. Sunday Main Service"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Day of Week</label>
                  <select
                    value={formData.day_of_week}
                    onChange={e => setFormData({ ...formData, day_of_week: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                    required
                  >
                    {daysOrder.map(day => <option key={day} value={day}>{day}</option>)}
                  </select>
                </div>
              </div>
            )}

            {editingId && (
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <h4 className="text-primary font-black text-sm uppercase tracking-widest">{formData.name}</h4>
                <p className="text-xs text-gray-500 font-bold">{formData.day_of_week} • {formData.start_time.slice(0, 5)}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Start Time</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">End Time</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                  required
                />
              </div>
            </div>

            {/* Dynamic Fields based on Service Type */}
            <div className="space-y-4 pt-4 border-t border-gray-50">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Service Content</h4>
              
              {(() => {
                const nameLower = formData.name.toLowerCase();
                const isMainSunday = nameLower.includes('eng') || nameLower.includes('local language');
                const isFellowship = nameLower.includes('fellowship');
                const isMorningGlory = nameLower.includes('morning glory');

                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Preacher</label>
                        <input
                          type="text"
                          value={formData.preacher}
                          onChange={e => setFormData({ ...formData, preacher: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                          placeholder="Name of Preacher"
                        />
                      </div>
                      {(isMainSunday || isFellowship) && (
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Leader</label>
                          <input
                            type="text"
                            value={formData.leader}
                            onChange={e => setFormData({ ...formData, leader: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                            placeholder="Name of Leader"
                          />
                        </div>
                      )}
                    </div>

                    {(isMorningGlory || isFellowship) && (
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Theme</label>
                        <input
                          type="text"
                          value={formData.theme}
                          onChange={e => setFormData({ ...formData, theme: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                          placeholder="Service Theme"
                        />
                      </div>
                    )}

                    {/* Readings */}
                    <div className="space-y-3">
                      {isMainSunday ? (
                        <>
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Psalms Reading</label>
                            <input
                              type="text"
                              value={formData.psalms_reading}
                              onChange={e => setFormData({ ...formData, psalms_reading: e.target.value })}
                              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                              placeholder="e.g. Psalm 23"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">1st Reading</label>
                              <input
                                type="text"
                                value={formData.first_reading}
                                onChange={e => setFormData({ ...formData, first_reading: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                                placeholder="Old Testament"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">2nd Reading</label>
                              <input
                                type="text"
                                value={formData.second_reading}
                                onChange={e => setFormData({ ...formData, second_reading: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                                placeholder="New Testament"
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Bible Reading(s)</label>
                          <input
                            type="text"
                            value={formData.first_reading}
                            onChange={e => setFormData({ ...formData, first_reading: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                            placeholder="e.g. John 3:16"
                          />
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                {formData.name.toLowerCase().includes('fellowship') ? 'More Information' : 'Service Programme (Optional)'}
              </label>
              <textarea
                value={formData.programme}
                onChange={e => setFormData({ ...formData, programme: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none min-h-[120px]"
                placeholder={formData.name.toLowerCase().includes('fellowship') ? 'Any additional details for the fellowship...' : 'List the programme items here...'}
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
                <Save className="w-5 h-5" /> {editingId ? 'Update Service' : 'Add Service'}
              </>
            )}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {loading ? (
          Array(5).fill(0).map((_, i) => <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse" />)
        ) : services.map((service) => (
          <div key={service.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-lavender rounded-xl flex items-center justify-center text-primary">
              <Clock className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-800 truncate">{service.name}</h4>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest">
                {service.day_of_week} • {service.start_time.slice(0, 5)} - {service.end_time.slice(0, 5)}
              </p>
            </div>
            {deleteConfirmId === service.id ? (
              <div className="flex items-center gap-1 animate-in zoom-in-95 duration-200">
                <button onClick={() => setDeleteConfirmId(null)} className="p-2 text-gray-400 bg-gray-50 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(service.id)} className="px-3 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg">
                  Delete
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => { 
                    setEditingId(service.id); 
                    setFormData({
                      name: service.name || '',
                      day_of_week: service.day_of_week || 'Sunday',
                      start_time: service.start_time || '08:00',
                      end_time: service.end_time || '10:00',
                      description: service.description || '',
                      programme: service.programme || '',
                      psalms_reading: service.psalms_reading || '',
                      first_reading: service.first_reading || '',
                      second_reading: service.second_reading || '',
                      preacher: service.preacher || '',
                      leader: service.leader || '',
                      theme: service.theme || ''
                    }); 
                    setShowForm(true); 
                  }} 
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteConfirmId(service.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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
