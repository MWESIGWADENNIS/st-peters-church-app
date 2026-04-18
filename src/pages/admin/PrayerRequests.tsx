import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageSquare, CheckCircle2, Trash2, Clock, Filter, User, ArrowLeft, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AdminPrayerRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unanswered' | 'answered'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    let query = supabase
      .from('prayer_requests')
      .select('*, users(full_name, username)')
      .order('created_at', { ascending: false });
    
    if (filter === 'unanswered') query = query.eq('is_answered', false);
    if (filter === 'answered') query = query.eq('is_answered', true);

    const { data } = await query;
    if (data) setRequests(data);
    setLoading(false);
  };

  const toggleAnswered = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from('prayer_requests')
        .update({ is_answered: !current })
        .eq('id', id);
      if (error) throw error;
      toast.success(current ? 'Marked as unanswered' : 'Marked as answered!');
      fetchRequests();
    } catch (error: any) {
      toast.error(error.message || 'Update failed.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('prayer_requests').delete().eq('id', id);
      if (error) throw error;
      toast.success('Deleted.');
      setDeleteConfirmId(null);
      fetchRequests();
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
          <h1 className="text-2xl font-black text-primary">Prayer Requests</h1>
          <p className="text-xs text-gray-500 font-medium">Intercede for your members.</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'all', label: 'All' },
          { id: 'unanswered', label: 'Unanswered' },
          { id: 'answered', label: 'Answered' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filter === f.id ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          Array(5).fill(0).map((_, i) => <div key={i} className="h-32 bg-gray-50 rounded-3xl animate-pulse" />)
        ) : requests.length > 0 ? (
          requests.map((req) => (
            <div key={req.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-lavender rounded-xl flex items-center justify-center text-primary">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{req.is_anonymous ? 'Anonymous Member' : req.users?.full_name}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {format(new Date(req.created_at), 'MMM dd, yyyy • HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleAnswered(req.id, req.is_answered)}
                    className={`p-2 rounded-lg transition-colors ${req.is_answered ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-50'}`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                  {deleteConfirmId === req.id ? (
                    <div className="flex items-center gap-1 animate-in zoom-in-95 duration-200">
                      <button onClick={() => setDeleteConfirmId(null)} className="p-2 text-gray-400 bg-gray-50 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(req.id)} className="px-3 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg">
                        Delete
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirmId(req.id)} className="p-2 text-red-600 bg-red-50 rounded-lg">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-black text-primary text-sm uppercase tracking-tight">{req.title}</h5>
                <p className="text-sm text-gray-600 leading-relaxed">{req.body}</p>
              </div>

              {!req.is_answered && (
                <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full w-fit">
                  <Clock className="w-3 h-3" /> Awaiting Intercession
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No prayer requests found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
