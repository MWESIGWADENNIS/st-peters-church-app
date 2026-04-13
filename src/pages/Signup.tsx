import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { UserPlus, ChevronRight, ChevronLeft } from 'lucide-react';

import { useDataStore } from '../store/dataStore';

export default function Signup() {
  const [step, setStep] = useState(1);
  const { churchSettings, setChurchSettings } = useDataStore();
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    phone: '',
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
        toast.error('Failed to load zones or ministries. Please check your database connection.');
      }
    };
    fetchData();
  }, [churchSettings, setChurchSettings]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validation
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

    if (!formData.zoneId) {
      return toast.error('Please select your zone');
    }

    setLoading(true);
    try {
      const cleanUsername = formData.username.toLowerCase().trim();
      
      // 2. Check if username is already taken
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
      
      // 3. Create Auth User
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

      if (authError) {
        console.error('Auth signup error:', authError);
        throw authError;
      }
      
      if (!authData.user) throw new Error('Signup failed - no user returned');

      console.log('Auth user created:', authData.user.id);

      // 4. Create Profile
      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        username: cleanUsername,
        full_name: formData.fullName,
        phone: formData.phone,
        zone_id: formData.zoneId,
        role: 'member',
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      console.log('Profile created successfully');

      // 5. Add Ministries
      if (formData.ministries.length > 0) {
        const ministryInserts = formData.ministries.map(mId => ({
          user_id: authData.user!.id,
          ministry_id: mId,
          status: 'pending'
        }));
        
        const { error: ministryError } = await supabase.from('user_ministries').insert(ministryInserts);
        if (ministryError) {
          console.error('Ministry association error:', ministryError);
          // We don't throw here to allow the user to at least log in if profile was created
          toast.error('Account created, but ministry requests failed. You can join them from your profile.');
        }
      }

      toast.success('Account created successfully! Redirecting...');
      
      // Small delay to ensure session is processed
      setTimeout(() => {
        navigate('/home');
      }, 1500);
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
    <div className="min-h-screen bg-lavender flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg overflow-hidden">
            {churchSettings?.logo_url ? (
              <img 
                src={churchSettings.logo_url} 
                alt="Logo" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-white text-2xl font-black">SP</span>
            )}
          </div>
          <h1 className="text-xl font-black text-primary">
            Join {churchSettings?.church_name || "Our Family"}
          </h1>
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1.5 w-8 rounded-full ${step >= i ? 'bg-primary' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value.replace(/\s/g, '') })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. john_doe (no spaces)"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-1 ml-1">This will be your login name. Letters and numbers only.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. 0700000000"
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!formData.username || !formData.fullName || !formData.phone) {
                    return toast.error('Please fill in all fields');
                  }
                  const usernameRegex = /^[a-zA-Z0-9_]+$/;
                  if (!usernameRegex.test(formData.username)) {
                    return toast.error('Username can only contain letters, numbers, and underscores');
                  }
                  setStep(2);
                }}
                className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                Next Step <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Your Zone</label>
                <select
                  value={formData.zoneId}
                  onChange={e => setFormData({ ...formData, zoneId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                  required
                >
                  <option value="">{zones.length === 0 ? 'Loading zones...' : 'Select your zone'}</option>
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
                {zones.length === 0 && (
                  <p className="text-[10px] text-red-500 mt-1 ml-1">
                    If zones don't appear, please ensure you have run the SQL setup script in your Supabase dashboard.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Your Ministry (Optional)</label>
                <p className="text-[10px] text-gray-400 mb-3">You can join multiple ministries to serve in the church.</p>
                <div className="grid grid-cols-2 gap-2">
                  {ministries.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMinistry(m.id)}
                      className={`p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border text-center flex flex-col items-center justify-center gap-1 ${
                        formData.ministries.includes(m.id)
                          ? 'bg-primary text-white border-primary shadow-md scale-95'
                          : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-primary/20'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-xl flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-2 bg-primary text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  Next <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Create a password"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Repeat password"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-xl flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-2 bg-primary text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" /> Create Account
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
