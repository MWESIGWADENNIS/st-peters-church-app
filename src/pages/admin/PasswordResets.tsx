import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Mail, 
  User, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Terminal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export default function PasswordResets() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [manualUsername, setManualUsername] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('password_reset_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err: any) {
      console.error('Error fetching reset requests:', err);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: 'resolved' | 'pending') => {
    try {
      const { error } = await supabase
        .from('password_reset_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
      toast.success(`Request marked as ${newStatus}`);
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
    }
  };

  const copyResetSQL = (username: string) => {
    const tempPass = 'Welcome' + Math.floor(1000 + Math.random() * 9000) + '!';
    const email = `${username.toLowerCase()}@stpeters.app`;
    const sql = `-- DEEP PASSWORD RESET for ${username}
-- This script wipes the old password and sets a fresh temporary one

-- 1. Ensure encryption extension exists (check both schemas)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Deep Update: Wipes old hash, sets new one, and resets metadata
UPDATE auth.users 
SET 
  encrypted_password = extensions.crypt('${tempPass}', extensions.gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  confirmed_at = COALESCE(confirmed_at, now()),
  last_sign_in_at = NULL, 
  updated_at = now(),
  raw_app_meta_data = '{"provider":"email","providers":["email"]}',
  aud = 'authenticated',
  role = 'authenticated'
WHERE email = '${email}';

-- 3. Double Check Update (Standard crypt if extensions failed)
UPDATE auth.users 
SET encrypted_password = crypt('${tempPass}', gen_salt('bf'))
WHERE email = '${email}' AND encrypted_password IS NULL;

-- 4. Final Verification
SELECT id, email, confirmed_at, updated_at 
FROM auth.users 
WHERE email = '${email}';`;
    
    navigator.clipboard.writeText(sql);
    toast.success(`Reset SQL Copied!`, { 
      duration: 10000,
      icon: '🔥'
    });
    // Also show the password in a separate persistent toast so they don't miss it
    toast(`TEMP PASSWORD: ${tempPass}`, {
      duration: 15000,
      icon: '🔑',
      style: {
        background: '#1e293b',
        color: '#fff',
        fontWeight: '900',
        fontSize: '1.1rem'
      }
    });
  };

  const copyEmailMessage = (username: string) => {
    const tempPass = 'Welcome' + Math.floor(1000 + Math.random() * 9000) + '!';
    const message = `Subject: Your New Access to St. Peter's Church App ⛪

Dear ${username},

We've received your request to reset your credentials for the St. Peter's Church App. We're happy to help you get back into our digital sanctuary!

Your temporary login details are below:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Username: ${username}
Temporary Password: ${tempPass}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

How to log in:
1. Open the St. Peter's Church App.
2. Enter your username and the temporary password exactly as shown above.
3. Once logged in, we recommend updating your password in your profile settings for security.

If you have any trouble logging in, please don't hesitate to reach out to us.

Blessings,
The St. Peter's Church Team
"Built with love for the Kingdom"`;

    navigator.clipboard.writeText(message);
    toast.success('Professional Email Message Copied!', {
      icon: '📧',
      duration: 4000
    });
  };

  const filteredRequests = requests.filter(r => 
    r.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.real_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-black text-primary uppercase tracking-tight">Password Reset Requests</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Manage credential recovery</p>
            </div>
          </div>
          <button 
            onClick={fetchRequests}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors text-primary"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Manual Reset Tool */}
        <div className="bg-white p-6 rounded-[2rem] border border-primary/20 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-black text-primary uppercase tracking-tight">Manual Reset Tool</h2>
          </div>
          <p className="text-xs text-gray-500 font-medium">Reset password for ANY user by typing their username below:</p>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Enter any username..."
                value={manualUsername}
                onChange={(e) => setManualUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-medium text-gray-700"
              />
            </div>
            <button
              onClick={() => {
                if (!manualUsername) return toast.error('Enter a username first');
                copyResetSQL(manualUsername);
              }}
              className="bg-primary text-white font-black px-6 rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2 text-xs uppercase tracking-widest"
            >
              <Terminal className="w-4 h-4" />
              Get SQL
            </button>
            <button
              onClick={() => {
                if (!manualUsername) return toast.error('Enter a username first');
                copyEmailMessage(manualUsername);
              }}
              className="bg-blue-600 text-white font-black px-6 rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2 text-xs uppercase tracking-widest"
            >
              <Mail className="w-4 h-4" />
              Copy Email
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 outline-none font-medium text-gray-700"
          />
        </div>

        {/* Info Card */}
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800 font-medium leading-relaxed">
            <strong>Admin Note:</strong> To reset a user's password, go to your <strong>Supabase Dashboard &gt; Authentication &gt; Users</strong>, find the user, and use the "Reset Password" or "Change Password" option. Then, send the temporary password to the email address provided below.
          </p>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 text-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No pending reset requests found.</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div 
                key={request.id}
                className={`bg-white p-6 rounded-[2rem] border transition-all ${
                  request.status === 'pending' ? 'border-primary/20 shadow-md' : 'border-gray-100 opacity-75'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        request.status === 'pending' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Username</p>
                        <p className="font-black text-gray-900 text-lg">{request.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Contact Email</p>
                        <a 
                          href={`mailto:${request.real_email}`}
                          className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {request.real_email}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Requested On</p>
                        <p className="font-bold text-gray-700">
                          {format(new Date(request.created_at), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[160px]">
                    {request.status === 'pending' ? (
                      <button
                        onClick={() => handleStatusUpdate(request.id, 'resolved')}
                        className="w-full bg-green-600 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest hover:bg-green-700 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Resolved
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusUpdate(request.id, 'pending')}
                        className="w-full bg-gray-100 text-gray-600 font-black py-3 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reopen Request
                      </button>
                    )}
                    <button
                      onClick={() => copyResetSQL(request.username)}
                      className="w-full bg-primary/10 text-primary font-black py-3 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest hover:bg-primary/20 transition-all"
                    >
                      <Terminal className="w-4 h-4" />
                      Copy Reset SQL
                    </button>
                    <button
                      onClick={() => copyEmailMessage(request.username)}
                      className="w-full bg-blue-50 text-blue-600 font-black py-3 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest hover:bg-blue-100 transition-all"
                    >
                      <Mail className="w-4 h-4" />
                      Copy Email Message
                    </button>
                    <button
                      onClick={() => window.open(`https://app.supabase.com`, '_blank')}
                      className="w-full bg-gray-900 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest hover:bg-black transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Supabase Auth
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
