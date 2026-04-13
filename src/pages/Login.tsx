import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';

import { useDataStore } from '../store/dataStore';
import { useEffect } from 'react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const navigate = useNavigate();
  const { churchSettings, setChurchSettings } = useDataStore();

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('church_settings').select('id').limit(1);
        if (error) throw error;
        setConnectionStatus('online');
      } catch (err) {
        console.error('Supabase connection check failed:', err);
        setConnectionStatus('offline');
      }
    };

    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from('church_settings').select('*').single();
        if (data) setChurchSettings(data);
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
    };

    checkConnection();
    if (!churchSettings) fetchSettings();
  }, [churchSettings, setChurchSettings]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSupabaseConfigured) {
      toast.error('Supabase is not configured. Please add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the Secrets panel.', {
        duration: 6000,
        icon: <AlertCircle className="text-red-500" />
      });
      return;
    }

    const cleanUsername = username.toLowerCase().trim();
    if (cleanUsername.includes(' ')) {
      return toast.error('Username cannot contain spaces');
    }

    setLoading(true);

    try {
      // Internal email format: username@stpeters.app
      const cleanUsername = username.toLowerCase().trim();
      
      // If user entered an email, try to extract just the username part
      const finalUsername = cleanUsername.includes('@') 
        ? cleanUsername.split('@')[0] 
        : cleanUsername;

      const email = `${finalUsername}@stpeters.app`;
      
      console.log(`Attempting login for: ${email}`);

      // Add a timeout to the login request
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timed out. This usually means the Supabase URL is incorrect or the database is unreachable.')), 15000)
      );

      const { error } = await Promise.race([loginPromise, timeoutPromise]) as any;

      if (error) {
        if (error.message === 'Invalid login credentials') {
          throw new Error('Invalid username or password. If you are an admin, ensure you have created an account and been assigned the admin role.');
        }
        throw error;
      }

      toast.success('Welcome back!');
      navigate('/home');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-lavender flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-8">
        <div className="text-center">
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden">
            {churchSettings?.logo_url ? (
              <img 
                src={churchSettings.logo_url} 
                alt="Logo" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-white text-3xl font-black">SP</span>
            )}
          </div>
          <h1 className="text-2xl font-black text-primary">
            {churchSettings?.church_name || "St. Peter's Church"}
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'online' ? 'bg-green-500' : 
              connectionStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
            }`} />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {connectionStatus === 'online' ? 'Database Connected' : 
               connectionStatus === 'offline' ? 'Database Offline' : 'Checking Connection...'}
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-bold hover:underline">
              Sign Up
            </Link>
          </p>
          <button 
            onClick={() => toast('Please contact the church admin to reset your password.')}
            className="text-xs text-gray-400 hover:text-primary transition-colors"
          >
            Forgot Password?
          </button>
        </div>
      </div>
    </div>
  );
}
