import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Calendar, Save, X, MapPin, Clock, Upload, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AdminEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '10:00',
    location: '',
    image_url: '',
    category: 'General'
  });

  useEffect(() => {
    const init = async () => {
      await cleanupOldEvents();
      await fetchEvents();
    };
    init();
  }, []);

  const cleanupOldEvents = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      // Delete events that happened before today
      const { error } = await supabase
        .from('events')
        .delete()
        .lt('event_date', today);
      if (error) throw error;
    } catch (error) {
      console.error('Error cleaning up old events:', error);
    }
  };

  const fetchEvents = async () => {
    const { isSupabaseConfigured } = await import('../../lib/supabase');
    if (!isSupabaseConfigured) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_rsvp (count)
        `)
        .order('event_date', { ascending: true });
      
      if (error) throw error;
      if (data) setEvents(data);
    } catch (err: any) {
      console.error('Error fetching events:', err);
      let message = 'Failed to load events';
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
        const { error } = await supabase.from('events').update(formData).eq('id', editingId);
        if (error) throw error;
        toast.success('Event updated!');
      } else {
        const { error } = await supabase.from('events').insert(formData);
        if (error) throw error;

        // Notify all users
        const { error: notifError } = await supabase.rpc('notify_all_users', {
          notif_title: 'New Event!',
          notif_body: `${formData.title} on ${format(new Date(formData.event_date), 'MMM dd')}`,
          notif_type: 'event'
        });
        if (notifError) console.error('Notification error:', notifError);

        toast.success('Event added!');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        event_date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '10:00',
        location: '',
        image_url: '',
        category: 'General'
      });
      fetchEvents();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save event.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `evt-${Math.random()}.${fileExt}`;
      const filePath = `events/${fileName}`;
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
    if (!confirm('Delete this event?')) return;
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      toast.success('Deleted.');
      fetchEvents();
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
          <h1 className="text-2xl font-black text-primary">Events</h1>
          <p className="text-xs text-gray-500 font-medium">Manage church calendar and events.</p>
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
              {editingId ? 'Edit Event' : 'New Event'}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Date</label>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                  required
                />
              </div>
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
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                placeholder="e.g. Church Main Hall"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none min-h-[100px]"
                required
              />
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
                <Save className="w-5 h-5" /> {editingId ? 'Update Event' : 'Add Event'}
              </>
            )}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {loading ? (
          Array(5).fill(0).map((_, i) => <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse" />)
        ) : events.map((event) => (
          <div key={event.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-lavender rounded-xl flex flex-col items-center justify-center text-primary">
              <span className="text-[10px] font-black uppercase">{format(new Date(event.event_date), 'MMM')}</span>
              <span className="text-lg font-black leading-none">{format(new Date(event.event_date), 'dd')}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-gray-800 truncate">{event.title}</h4>
                {event.event_rsvp?.[0]?.count > 0 && (
                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded uppercase">
                    {event.event_rsvp[0].count} Joined
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                <Clock className="w-3 h-3" /> {event.start_time.slice(0, 5)}
                <span className="w-1 h-1 bg-gray-200 rounded-full" />
                <MapPin className="w-3 h-3" /> {event.location}
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => { 
                  setEditingId(event.id); 
                  setFormData({
                    title: event.title || '',
                    description: event.description || '',
                    event_date: event.event_date || format(new Date(), 'yyyy-MM-dd'),
                    start_time: event.start_time || '10:00',
                    location: event.location || '',
                    image_url: event.image_url || '',
                    category: event.category || 'General'
                  }); 
                  setShowForm(true); 
                }} 
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(event.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
