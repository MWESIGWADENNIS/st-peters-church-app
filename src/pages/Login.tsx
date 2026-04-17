import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { LogIn, UserPlus, AlertCircle, Quote, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

import { useDataStore } from '../store/dataStore';

const VERSES = [
  { text: "For where two or three gather in my name, there am I with them.", ref: "Matthew 18:20" },
  { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
  { text: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1" },
  { text: "Be strong and courageous. Do not be afraid; do not be discouraged.", ref: "Joshua 1:9" }
];

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [currentVerse, setCurrentVerse] = useState(VERSES[0]);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const navigate = useNavigate();
  const { churchSettings, setChurchSettings } = useDataStore();

  useEffect(() => {
    setCurrentVerse(VERSES[Math.floor(Math.random() * VERSES.length)]);
    
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
    setLoginError(null);

    try {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanUsername);
      const email = isEmail ? cleanUsername : `${cleanUsername}@stpeters.app`;
      
      console.log('Attempting login with email:', email);

      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timed out. This usually means the connection to the church server is slow. Please try again.')), 30000)
      );

      const { error } = await Promise.race([loginPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Supabase Auth Error:', error);
        if (error.message === 'Invalid login credentials') {
          // Check if user exists in public.users to give better feedback
          const { data: userExists, error: checkError } = await supabase
            .from('users')
            .select('username, role')
            .eq('username', cleanUsername)
            .maybeSingle();

          if (checkError) console.error('User check error:', checkError);

          if (!userExists) {
            const msg = `We couldn't find an account for "${cleanUsername}". Please check your spelling or join our family by signing up!`;
            setLoginError(msg);
            throw new Error(msg);
          } else {
            const msg = `The password for ${cleanUsername} isn't quite right. Please try again, or use "Forgot Credentials" for help.`;
            setLoginError(msg);
            throw new Error(msg);
          }
        }
        setLoginError(error.message);
        throw error;
      }

      toast.success('Welcome back to our family!');
      navigate('/home');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Invalid username or password', {
        icon: <AlertCircle className="text-red-500" />,
        style: {
          borderRadius: '1rem',
          background: '#fff',
          color: '#333',
          fontWeight: 'bold',
          border: '2px solid #fee2e2'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-church-pattern flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-primary/10 p-8 md:p-10 border border-white relative overflow-hidden">
          {/* Stained Glass Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-stained-glass opacity-30 -mr-16 -mt-16 rounded-full" />
          
          <div className="text-center relative z-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20 overflow-hidden transform rotate-3 hover:rotate-0 transition-transform duration-500"
            >
              {churchSettings?.logo_url ? (
                <img 
                  src={churchSettings.logo_url} 
                  alt="Logo" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-white text-4xl font-black font-display">SP</span>
              )}
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-black text-primary mb-2 tracking-tight"
            >
              {churchSettings?.church_name || "St. Peter's Church"}
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-2 mb-8"
            >
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'online' ? 'bg-green-500 animate-pulse' : 
                connectionStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
              }`} />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                {connectionStatus === 'online' ? 'Sanctuary Connected' : 
                 connectionStatus === 'offline' ? 'Sanctuary Offline' : 'Preparing Sanctuary...'}
              </p>
            </motion.div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            <AnimatePresence>
              {loginError && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="bg-red-50 border-2 border-red-100 p-4 rounded-2xl flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-red-700 leading-relaxed">
                    {loginError}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Username</label>
              <div className="relative group">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none font-medium text-gray-700"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none font-medium text-gray-700"
                placeholder="Enter your password"
                required
              />
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-black py-5 rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-sm uppercase tracking-widest"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Enter Sanctuary
                </>
              )}
            </motion.button>
          </form>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-10 text-center space-y-6 relative z-10"
          >
            <div className="pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 font-medium">
                New to our community?{' '}
                <Link to="/signup" className="text-primary font-black hover:underline underline-offset-4">
                  Join Our Family
                </Link>
              </p>
            </div>
            
            <button 
              onClick={() => setIsForgotModalOpen(true)}
              className="text-[10px] font-black text-gray-400 hover:text-primary transition-colors uppercase tracking-widest"
            >
              Forgot Credentials?
            </button>
          </motion.div>
        </div>

        <ForgotPasswordModal 
          isOpen={isForgotModalOpen} 
          onClose={() => setIsForgotModalOpen(false)} 
        />

        {/* Daily Verse Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-12 text-center px-4"
        >
          <div className="inline-flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md mb-4">
            <Quote className="w-5 h-5 text-primary opacity-40" />
          </div>
          <p className="text-lg font-serif italic text-primary/70 leading-relaxed mb-2">
            "{currentVerse.text}"
          </p>
          <p className="text-xs font-black text-primary/40 uppercase tracking-[0.3em]">
            — {currentVerse.ref}
          </p>
          <div className="mt-8 flex items-center justify-center gap-1 text-primary/20">
            <Heart className="w-3 h-3 fill-current" />
            <span className="text-[10px] font-black uppercase tracking-widest">Built with love for the Kingdom</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
