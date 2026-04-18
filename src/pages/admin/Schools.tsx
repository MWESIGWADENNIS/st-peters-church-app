import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  School, 
  Save, 
  X, 
  Upload, 
  ArrowLeft,
  Clock,
  Calendar,
  User,
  Info,
  Globe,
  Phone,
  BookOpen,
  Users as UsersIcon,
  Target,
  Flag
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AdminSchools() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    photo_url: '',
    chapel_day: '',
    chapel_time: '',
    patron_name: '',
    minister_name: '',
    motto: '',
    vision: '',
    mission: '',
    contact_person: '',
    contact_phone: '',
    activities: '',
    website_url: '',
    student_count: 0 as number | string,
    is_church_school: false
  });

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      if (data) setSchools(data);
    } catch (err) {
      console.error('Error fetching schools:', err);
      toast.error('Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        student_count: parseInt(formData.student_count as string) || 0
      };
      if (editingId) {
        const { error } = await supabase.from('schools').update(dataToSave).eq('id', editingId);
        if (error) throw error;
        toast.success('School updated!');
      } else {
        const { error } = await supabase.from('schools').insert(dataToSave);
        if (error) throw error;
        toast.success('School added!');
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchSchools();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save school.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      description: '',
      photo_url: '',
      chapel_day: '',
      chapel_time: '',
      patron_name: '',
      minister_name: '',
      motto: '',
      vision: '',
      mission: '',
      contact_person: '',
      contact_phone: '',
      activities: '',
      website_url: '',
      student_count: '',
      is_church_school: false
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `sch-${Math.random()}.${fileExt}`;
      const filePath = `schools/${fileName}`;
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
    try {
      const { error } = await supabase.from('schools').delete().eq('id', id);
      if (error) throw error;
      toast.success('Deleted.');
      setDeleteConfirmId(null);
      fetchSchools();
    } catch (error: any) {
      toast.error(error.message || 'Delete failed.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-gray-50 rounded-full text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-primary">Schools Ministry</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Manage Outreach Schools</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); resetForm(); }}
            className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
                {editingId ? <Edit2 className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
                {editingId ? 'Edit School' : 'New School Ministry'}
              </h3>
              <button type="button" onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-50 rounded-full text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Photo Upload */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-[2rem] bg-lavender flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                    {formData.photo_url ? (
                      <img src={formData.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <School className="w-12 h-12 text-primary/20" />
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg cursor-pointer border-4 border-white">
                    <Upload className="w-5 h-5" />
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">School Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none font-bold"
                    placeholder="e.g. Nkoma SS"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">School Type</label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none font-bold"
                    placeholder="e.g. Secondary School"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">School Patron</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.patron_name}
                      onChange={e => setFormData({ ...formData, patron_name: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none font-bold"
                      placeholder="Patron's Name"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Church Minister</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.minister_name}
                      onChange={e => setFormData({ ...formData, minister_name: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none font-bold"
                      placeholder="Assigned Minister"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Chapel Day</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={formData.chapel_day}
                      onChange={e => setFormData({ ...formData, chapel_day: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none font-bold appearance-none"
                    >
                      <option value="">Select Day</option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                      <option value="Every Weekday">Every Weekday</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Chapel Time</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="time"
                      value={formData.chapel_time}
                      onChange={e => setFormData({ ...formData, chapel_time: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">School Motto</label>
                <div className="relative">
                  <Flag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.motto}
                    onChange={e => setFormData({ ...formData, motto: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none font-bold italic"
                    placeholder="School Motto"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vision</label>
                  <textarea
                    value={formData.vision}
                    onChange={e => setFormData({ ...formData, vision: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none font-medium min-h-[80px]"
                    placeholder="School Vision"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mission</label>
                  <textarea
                    value={formData.mission}
                    onChange={e => setFormData({ ...formData, mission: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none font-medium min-h-[80px]"
                    placeholder="School Mission"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ministry Activities</label>
                <textarea
                  value={formData.activities}
                  onChange={e => setFormData({ ...formData, activities: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none font-medium min-h-[100px]"
                  placeholder="e.g. Bible Study, Counseling, Praise & Worship, Scripture Union..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Student Population</label>
                  <div className="relative">
                    <UsersIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={formData.student_count}
                      onChange={e => setFormData({ ...formData, student_count: e.target.value === '' ? '' : parseInt(e.target.value) })}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none font-bold"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mt-5 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Church School</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_church_school: !formData.is_church_school })}
                    className={`w-12 h-6 rounded-full transition-all relative ${formData.is_church_school ? 'bg-primary shadow-inner' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${formData.is_church_school ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={saving}
                className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {saving ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" /> {editingId ? 'Update School' : 'Register School'}
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {loading ? (
            Array(3).fill(0).map((_, i) => <div key={i} className="h-32 bg-white rounded-3xl animate-pulse border border-gray-100" />)
          ) : schools.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
              <School className="w-16 h-16 text-gray-100 mx-auto mb-4" />
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No schools registered</p>
            </div>
          ) : (
            schools.map((school) => (
              <div key={school.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-5 group hover:border-primary/20 transition-all">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-lavender flex-shrink-0 border border-gray-50">
                  {school.photo_url ? (
                    <img src={school.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary/20">
                      <School className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-black text-gray-900 truncate">{school.name}</h4>
                    {school.is_church_school && <Target className="w-3 h-3 text-primary" />}
                  </div>
                  <p className="text-[10px] text-primary font-black uppercase tracking-widest">{school.type}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                      <User className="w-3 h-3" /> {school.patron_name || 'No Patron'}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                      <Clock className="w-3 h-3" /> {school.chapel_day || 'TBA'}
                    </div>
                  </div>
                </div>
                {deleteConfirmId === school.id ? (
                  <div className="flex flex-col items-center gap-2 animate-in zoom-in-95 duration-200">
                    <button onClick={() => setDeleteConfirmId(null)} className="p-2 text-gray-400 bg-gray-50 rounded-xl w-full flex justify-center">
                      <X className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(school.id)} className="px-3 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-xl">
                      Delete
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => { setEditingId(school.id); setFormData(school); setShowForm(true); }} 
                      className="p-3 bg-gray-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmId(school.id)} 
                      className="p-3 bg-gray-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
