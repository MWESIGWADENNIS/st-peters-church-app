import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Upload, Church, Phone, Mail, MapPin, Youtube, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AdminSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    church_name: '',
    parish: '',
    archdeaconry: '',
    diocese: '',
    address: '',
    phone: '',
    email: '',
    history: '',
    youtube_channel_url: '',
    logo_url: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('church_settings').select('*').single();
      if (data) setSettings(data);
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('church_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', (settings as any).id);

      if (error) throw error;
      toast.success('Settings updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Math.random()}.${fileExt}`;
      const filePath = `church/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('church-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('church-assets')
        .getPublicUrl(filePath);

      setSettings(prev => ({ ...prev, logo_url: publicUrl }));
      toast.success('Logo uploaded! Don\'t forget to save changes.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload logo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center animate-pulse">Loading settings...</div>;

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
          <h1 className="text-2xl font-black text-primary">Church Settings</h1>
          <p className="text-sm text-gray-500 font-medium">Manage your church's public information and branding.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Branding */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Branding</h3>
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 bg-lavender rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
              {settings.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Church className="w-10 h-10 text-primary/30" />
              )}
            </div>
            <label className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-2">
              <Upload className="w-4 h-4" /> Change Logo
              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
            </label>
          </div>
        </div>

        {/* General Info */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">General Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Church Name</label>
              <input
                type="text"
                value={settings.church_name}
                onChange={e => setSettings({ ...settings, church_name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Parish</label>
                <input
                  type="text"
                  value={settings.parish}
                  onChange={e => setSettings({ ...settings, parish: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Diocese</label>
                <input
                  type="text"
                  value={settings.diocese}
                  onChange={e => setSettings({ ...settings, diocese: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Contact Details</h3>
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                <MapPin className="w-3 h-3" /> Address
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={e => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                  <Phone className="w-3 h-3" /> Phone
                </label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={e => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                  <Mail className="w-3 h-3" /> Email
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={e => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                <Youtube className="w-3 h-3" /> YouTube Channel URL
              </label>
              <input
                type="url"
                value={settings.youtube_channel_url}
                onChange={e => setSettings({ ...settings, youtube_channel_url: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                placeholder="https://youtube.com/@..."
              />
            </div>
          </div>
        </div>

        {/* History */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Church History</h3>
          <textarea
            value={settings.history}
            onChange={e => setSettings({ ...settings, history: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none min-h-[200px] text-sm leading-relaxed"
            placeholder="Write the church history here..."
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 sticky bottom-4 z-10"
        >
          {saving ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5" /> Save All Settings
            </>
          )}
        </button>
      </form>
    </div>
  );
}
