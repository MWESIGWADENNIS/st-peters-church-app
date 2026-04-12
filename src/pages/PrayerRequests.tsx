import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { MessageSquare, Send, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export default function PrayerRequests() {
  const { user, profile } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    isAnonymous: false,
  });

  useEffect(() => {
    if (!user) return;
    const fetchRequests = async () => {
      try {
        const fetchPromise = supabase
          .from('prayer_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 60000)
        );

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
        
        if (error) throw error;
        if (data) setRequests(data);
      } catch (err) {
        console.error('Error fetching prayer requests:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase.from('prayer_requests').insert({
        user_id: user.id,
        title: formData.title,
        body: formData.body,
        is_anonymous: formData.isAnonymous,
      });

      if (error) throw error;

      toast.success('Your prayer request has been received.');
      setFormData({ title: '', body: '', isAnonymous: false });
      setShowForm(false);
      
      // Refresh list
      const { data } = await supabase
        .from('prayer_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setRequests(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-primary">Prayer Requests</h1>
        <p className="text-sm text-gray-500 font-medium">Share your needs. Our intercessory team prays for you daily.</p>
      </div>

      <div className="bg-lavender rounded-3xl p-6 text-center space-y-4 border border-primary/5">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
          <MessageSquare className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-primary text-lg">Need Prayer?</h3>
          <p className="text-xs text-primary/70 font-medium px-4">"Cast all your anxiety on him because he cares for you." — 1 Peter 5:7</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg hover:bg-opacity-90 transition-all"
        >
          {showForm ? 'Cancel Request' : 'Submit Prayer Request'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Request Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                placeholder="e.g. Healing for my mother"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Prayer Details</label>
              <textarea
                value={formData.body}
                onChange={e => setFormData({ ...formData, body: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none min-h-[120px]"
                placeholder="Share as much as you're comfortable with..."
                required
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-bold text-gray-600">Submit Anonymously</span>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isAnonymous: !formData.isAnonymous })}
                className={`w-10 h-5 rounded-full transition-colors relative ${formData.isAnonymous ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.isAnonymous ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-primary text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" /> Send Request
              </>
            )}
          </button>
        </form>
      )}

      <section className="space-y-4 pb-8">
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">My Requests</h2>
        <div className="space-y-3">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-gray-50 rounded-2xl animate-pulse" />
            ))
          ) : requests.length > 0 ? (
            requests.map((req) => (
              <div key={req.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold text-gray-900">{req.title}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                      {format(new Date(req.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  {req.is_answered ? (
                    <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-lg text-[10px] font-black uppercase">
                      <CheckCircle2 className="w-3 h-3" /> Answered
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-[10px] font-black uppercase">
                      <Clock className="w-3 h-3" /> Praying
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{req.body}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 italic text-sm">You haven't submitted any prayer requests yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
