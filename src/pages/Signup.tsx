import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { UserPlus, ChevronRight, ChevronLeft, Heart, Sparkles, Church } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { useDataStore } from '../store/dataStore';

export default function Signup() {
  const [step, setStep] = useState(1);
  const { churchSettings, setChurchSettings } = useDataStore();
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    phone: '',
    dateOfBirth: '',
    zoneId: '',
    ministries: [] as string[],
    password: '',
    confirmPassword: '',
  });

  const [zones, setZones] = useState<any[]>([]);
  const [ministries, setMinistries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: zonesData, error: zonesError } = await supabase.from('zones').select('*');
        const { data: ministriesData, error: ministriesError } = await supabase.from('ministries').select('*').eq('is_active', true);
        
        if (zonesError) throw zonesError;
        if (ministriesError) throw ministriesError;

        if (zonesData) setZones(zonesData);
        if (ministriesData) setMinistries(ministriesData);
        
        if (!churchSettings) {
          const { data: settingsData, error: settingsError } = await supabase.from('church_settings').select('*').single();
          if (!settingsError && settingsData) setChurchSettings(settingsData);
        }
      } catch (error: any) {
        console.error('Error fetching signup data:', error);
        toast.error('Failed to load community data.');
      }
    };
    fetchData();
  }, [churchSettings, setChurchSettings]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(formData.username)) {
      return toast.error('Username can only contain letters, numbers, and underscores (no spaces)');
    }

    if (formData.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setLoading(true);
    try {
      const cleanUsername = formData.username.toLowerCase().trim();
      
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('username')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existingUser) {
        setLoading(false);
        return toast.error('This username is already taken. Please choose another one.');
      }

      const email = `${cleanUsername}@stpeters.app`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            username: cleanUsername,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Signup failed');

      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        username: cleanUsername,
        full_name: formData.fullName,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth,
        zone_id: formData.zoneId || null,
        role: 'member',
      });

      if (profileError) throw profileError;

      if (formData.ministries.length > 0) {
        const ministryInserts = formData.ministries.map(mId => ({
          user_id: authData.user!.id,
          ministry_id: mId,
          status: 'pending'
        }));
        await supabase.from('user_ministries').insert(ministryInserts);
      }

      toast.success('Welcome to our church family!');
      setTimeout(() => navigate('/home'), 1500);
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMinistry = (id: string) => {
    setFormData(prev => ({
      ...prev,
      ministries: prev.ministries.includes(id)
        ? prev.ministries.filter(m => m !== id)
        : [...prev.ministries, id]
    }));
  };

  return (
    <div className="min-h-screen bg-church-pattern flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-xl"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-primary/10 p-8 md:p-10 border border-white relative overflow-hidden">
          {/* Stained Glass Accent */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-stained-glass opacity-30 -ml-16 -mt-16 rounded-full" />
          
          <div className="text-center mb-10 relative z-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6"
            >
              <Church className="w-10 h-10 text-primary" />
            </motion.div>
            <h1 className="text-3xl font-black text-primary mb-2">Join Our Family</h1>
            <p className="text-gray-500 font-medium">Step {step} of 3: {
              step === 1 ? 'Personal Details' : 
              step === 2 ? 'Church Community' : 'Secure Your Account'
            }</p>
            
            {/* Progress Bar */}
            <div className="flex gap-2 justify-center mt-6">
              {[1, 2, 3].map((s) => (
                <div 
                  key={s} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    s <= step ? 'w-8 bg-primary' : 'w-4 bg-gray-100'
                  }`} 
                />
              ))}
            </div>
          </div>

          <form onSubmit={handleSignup} className="relative z-10">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Username</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value.replace(/\s/g, '') })}
                        className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none font-medium text-gray-700"
                        placeholder="e.g. john_doe"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none font-medium text-gray-700"
                        placeholder="Your full name"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none font-medium text-gray-700"
                        placeholder="e.g. 0700000000"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none font-medium text-gray-700"
                        required
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      if (!formData.username || !formData.fullName || !formData.phone || !formData.dateOfBirth) {
                        return toast.error('Please fill in all fields');
                      }
                      const usernameRegex = /^[a-zA-Z0-9_]+$/;
                      if (!usernameRegex.test(formData.username)) {
                        return toast.error('Username can only contain letters, numbers, and underscores');
                      }
                      setStep(2);
                    }}
                    className="w-full bg-primary text-white font-black py-5 rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 uppercase tracking-widest text-sm mt-4"
                  >
                    Next Step <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Your Zone</label>
                    <select
                      value={formData.zoneId}
                      onChange={e => setFormData({ ...formData, zoneId: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none font-medium text-gray-700 appearance-none"
                    >
                      <option value="">Select your zone (Optional)</option>
                      {zones.map(zone => (
                        <option key={zone.id} value={zone.id}>{zone.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Ministries You're Interested In</label>
                    <div className="grid grid-cols-2 gap-3">
                      {ministries.map(ministry => (
                        <button
                          key={ministry.id}
                          type="button"
                          onClick={() => toggleMinistry(ministry.id)}
                          className={`px-4 py-3 rounded-xl text-xs font-black transition-all border-2 text-left flex items-center gap-2 ${
                            formData.ministries.includes(ministry.id)
                              ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                              : 'bg-white text-gray-500 border-gray-100 hover:border-primary/20'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${formData.ministries.includes(ministry.id) ? 'bg-white' : 'bg-gray-200'}`} />
                          {ministry.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 bg-gray-50 text-gray-500 font-black py-5 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                    >
                      <ChevronLeft className="w-5 h-5" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="flex-[2] bg-primary text-white font-black py-5 rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                    >
                      Continue <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Create Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none font-medium text-gray-700"
                      placeholder="At least 6 characters"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Confirm Password</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none font-medium text-gray-700"
                      placeholder="Repeat your password"
                      required
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 bg-gray-50 text-gray-500 font-black py-5 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-[3] bg-primary text-white font-black py-5 rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Complete Registration
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 pt-8 border-t border-gray-100 text-center"
          >
            <p className="text-sm text-gray-500 font-medium">
              Already part of our family?{' '}
              <Link to="/login" className="text-primary font-black hover:underline underline-offset-4">
                Sign In Here
              </Link>
            </p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 flex items-center justify-center gap-2 text-primary/30"
        >
          <Heart className="w-4 h-4 fill-current" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Welcome to the Sanctuary</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
