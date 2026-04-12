import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Radio, Save, Youtube, ExternalLink, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AdminLivestream() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [liveData, setLiveData] = useState({
    id: '',
    youtube_url: '',
    is_live: false,
    title: ''
  });

  useEffect(() => {
    const fetchLiveStatus = async () => {
      const { data } = await supabase.from('livestream').select('*').single();
      if (data) {
        setLiveData({
          id: data.id,
          youtube_url: data.youtube_url || '',
          is_live: data.is_live || false,
          title: data.title || ''
        });
      }
      setLoading(false);
    };
    fetchLiveStatus();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('livestream')
        .update({
          youtube_url: liveData.youtube_url,
          is_live: liveData.is_live,
          title: liveData.title,
          updated_at: new Date().toISOString()
        })
        .eq('id', liveData.id);

      if (error) throw error;

      // Notify all users if going live
      if (liveData.is_live) {
        await supabase.rpc('notify_all_users', {
          notif_title: 'We are LIVE!',
          notif_body: `Join our live session: ${liveData.title || 'Church Service'}`,
          notif_type: 'live'
        });
      }

      toast.success('Livestream status updated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update livestream.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center animate-pulse">Loading livestream settings...</div>;

  return (
    <div className="p-4 space-y-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/admin')}
          className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-primary">Livestream Control</h1>
          <p className="text-sm text-gray-500 font-medium">Go live and manage your online service broadcast.</p>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${liveData.is_live ? 'bg-red-600 animate-pulse' : 'bg-gray-300'}`}>
                <Radio className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{liveData.is_live ? 'Currently Live' : 'Offline'}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLiveData({ ...liveData, is_live: !liveData.is_live })}
              className={`w-14 h-7 rounded-full transition-all relative ${liveData.is_live ? 'bg-red-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${liveData.is_live ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Service Title</label>
              <input
                type="text"
                value={liveData.title}
                onChange={e => setLiveData({ ...liveData, title: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                placeholder="e.g. Sunday Main Service"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">YouTube URL</label>
              <div className="relative">
                <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-600" />
                <input
                  type="url"
                  value={liveData.youtube_url}
                  onChange={e => setLiveData({ ...liveData, youtube_url: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="https://youtube.com/live/..."
                />
              </div>
            </div>
          </div>

          {liveData.is_live && !liveData.youtube_url && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold">
              <AlertCircle className="w-4 h-4" />
              Please provide a YouTube URL to go live.
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5" /> Update Livestream
            </>
          )}
        </button>
      </form>

      <div className="p-6 bg-lavender rounded-3xl space-y-4">
        <h3 className="font-black text-primary uppercase text-xs tracking-widest">Instructions</h3>
        <ul className="space-y-2 text-xs text-primary/80 font-medium leading-relaxed list-disc pl-4">
          <li>Start your stream on YouTube Studio first.</li>
          <li>Copy the "Live" or "Video" URL and paste it above.</li>
          <li>Toggle the "Live" switch to notify all members.</li>
          <li>The "LIVE" button on the member app will glow red instantly.</li>
        </ul>
      </div>
    </div>
  );
}
