import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Check, 
  X, 
  User, 
  Phone, 
  MapPin,
  Loader2,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AdminMinistries() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_ministries')
        .select(`
          user_id,
          ministry_id,
          status,
          requested_at,
          users (
            full_name,
            phone,
            username,
            avatar_url,
            zones (name)
          ),
          ministries (
            name
          )
        `)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, ministryId: string, status: 'approved' | 'rejected') => {
    setActionLoading(`${userId}-${ministryId}`);
    try {
      const { error } = await supabase
        .from('user_ministries')
        .update({ status })
        .eq('user_id', userId)
        .eq('ministry_id', ministryId);

      if (error) throw error;

      // Send notification to user
      const request = requests.find(r => r.user_id === userId && r.ministry_id === ministryId);
      if (request) {
        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: userId,
          title: status === 'approved' ? 'Ministry Approved!' : 'Ministry Request Update',
          body: status === 'approved' 
            ? `You have been approved to join the ${request.ministries.name}. Welcome!` 
            : `Your request to join the ${request.ministries.name} was not approved at this time.`,
          type: 'ministry'
        });
        if (notifError) {
          console.error('Notification error:', notifError);
          toast.error('Action succeeded but notification failed to send.');
        }
      }

      toast.success(`Request ${status} successfully`);
      setRequests(prev => prev.filter(r => !(r.user_id === userId && r.ministry_id === ministryId)));
    } catch (error: any) {
      toast.error(error.message || 'Failed to update request');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-50">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-black text-primary">Ministry Requests</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
          <Users className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900">Pending Approvals</p>
            <p className="text-xs text-amber-700 font-medium">Review and approve members who want to join church ministries.</p>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-bold">No pending requests</p>
            </div>
          ) : (
            requests.map((request) => (
              <div 
                key={`${request.user_id}-${request.ministry_id}`}
                className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-lavender flex items-center justify-center overflow-hidden">
                    {request.users.avatar_url ? (
                      <img src={request.users.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-gray-900">{request.users.full_name}</h3>
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">
                      Wants to join: {request.ministries.name}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-50">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Phone className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">{request.users.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">{request.users.zones?.name || 'No Zone'}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction(request.user_id, request.ministry_id, 'approved')}
                    disabled={actionLoading === `${request.user_id}-${request.ministry_id}`}
                    className="flex-1 py-3 bg-primary text-white text-xs font-black rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading === `${request.user_id}-${request.ministry_id}` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleAction(request.user_id, request.ministry_id, 'rejected')}
                    disabled={actionLoading === `${request.user_id}-${request.ministry_id}`}
                    className="flex-1 py-3 bg-white text-red-600 text-xs font-black rounded-xl border border-red-100 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
