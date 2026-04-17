import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';
import { 
  User, 
  Phone, 
  MapPin, 
  Camera, 
  LogOut, 
  ChevronLeft, 
  Save,
  Lock,
  Users,
  Check,
  X,
  ChevronDown,
  Clock,
  Gift,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

export default function Profile() {
  const { user, profile, fetchProfile, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [zones, setZones] = useState<any[]>([]);
  const [ministries, setMinistries] = useState<any[]>([]);
  const [userMinistries, setUserMinistries] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    dateOfBirth: '',
    zoneId: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || '',
        phone: profile.phone || '',
        dateOfBirth: profile.date_of_birth || '',
        zoneId: profile.zone_id || '',
      });
    }

    const fetchData = async () => {
      const { data: zData } = await supabase.from('zones').select('*');
      const { data: mData } = await supabase.from('ministries').select('*').eq('is_active', true);
      if (zData) setZones(zData);
      if (mData) setMinistries(mData);

      if (user) {
        const { data: umData } = await supabase
          .from('user_ministries')
          .select('ministry_id, status')
          .eq('user_id', user.id);
        if (umData) setUserMinistries(umData);
      }
    };
    fetchData();
  }, [profile, user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
          date_of_birth: formData.dateOfBirth,
          zone_id: formData.zoneId,
        })
        .eq('id', user.id);

      if (error) throw error;

      await fetchProfile(user.id);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters long.');
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('Passwords do not match.');
    }

    setLoading(true);
    console.log('Starting password update...');
    
    try {
      const updatePromise = supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Password update timed out. This can happen on slow connections. Your password might have still updated, please try logging out and back in if this persists.')), 30000)
      );

      const { data, error } = await Promise.race([updatePromise, timeoutPromise]) as any;

      if (error) {
        console.error('Password update error:', error);
        throw error;
      }

      console.log('Password updated successfully:', data);
      toast.success('Hooray! Your new password is set! Your sanctuary account is now even more secure. 🙏', {
        icon: '🎉',
        duration: 6000,
        style: {
          borderRadius: '1.5rem',
          background: '#fff',
          color: '#333',
          fontWeight: 'bold',
          border: '2px solid #f0fdf4',
          padding: '16px'
        }
      });
      setIsPasswordModalOpen(false);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Final catch error:', error);
      if (error.message === 'New password should be different from the old password.') {
        toast.error('Your new password must be different from your current one. Please choose a unique password.', {
          icon: '🔄',
          duration: 5000
        });
      } else {
        toast.error(error.message || 'Failed to change password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setLoading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `avatars/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('church-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('church-assets')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await fetchProfile(user.id);
      toast.success('Avatar updated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload avatar.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMinistry = async (ministryId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('user_ministries')
        .insert({
          user_id: user.id,
          ministry_id: ministryId,
          status: 'pending'
        });
      
      if (error) throw error;
      
      setUserMinistries(prev => [...prev, { ministry_id: ministryId, status: 'pending' }]);
      toast.success('Join request sent to admin!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send request.');
    }
  };

  const handleLeaveMinistry = async (ministryId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('user_ministries')
        .delete()
        .eq('user_id', user.id)
        .eq('ministry_id', ministryId);
      
      if (error) throw error;
      
      setUserMinistries(prev => prev.filter(um => um.ministry_id !== ministryId));
      toast.success('Removed from ministry.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove.');
    }
  };

  return (
    <div className="min-h-screen bg-white pb-12">
      <div className="p-4 flex items-center gap-4 sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-black text-primary">My Profile</h1>
      </div>

      <div className="p-6 space-y-8">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-32 h-32 rounded-3xl bg-lavender flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary font-black text-4xl">{profile?.full_name?.charAt(0) || 'U'}</span>
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg cursor-pointer border-4 border-white">
              <Camera className="w-5 h-5" />
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={loading} />
            </label>
          </div>
            <div className="text-center">
              <h2 className="text-xl font-black text-gray-900">{profile?.full_name}</h2>
              <div className="flex items-center justify-center gap-2 mt-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">@{profile?.username}</p>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">{profile?.zone?.name || 'No Zone'}</p>
              </div>
              <div className="mt-2">
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                  {profile?.role || 'Member'}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                  <User className="w-3 h-3" /> Username
                </label>
                <input
                  type="text"
                  value={profile?.username || ''}
                  disabled
                  className="w-full px-5 py-4 bg-gray-100 rounded-2xl border border-gray-100 text-gray-500 cursor-not-allowed font-bold"
                />
                <p className="text-[10px] text-gray-400 ml-1 italic">Usernames cannot be changed.</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                  <User className="w-3 h-3" /> Full Name
                </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                <Phone className="w-3 h-3" /> Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="e.g. 0700000000"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                <Gift className="w-3 h-3" /> Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-gray-700"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                <MapPin className="w-3 h-3" /> Your Zone
              </label>
              <div className="relative">
                <select
                  value={formData.zoneId}
                  onChange={e => setFormData({ ...formData, zoneId: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none transition-all appearance-none font-bold text-gray-700"
                  required
                >
                  <option value="">Select your zone</option>
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                  <Users className="w-3 h-3" /> Ministries
                </label>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Tap to join or leave</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {ministries.length > 0 ? (
                  ministries.map(m => {
                    const membership = userMinistries.find(um => um.ministry_id === m.id);
                    const status = membership?.status;

                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          if (!status) handleJoinMinistry(m.id);
                          else handleLeaveMinistry(m.id);
                        }}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2",
                          !status && "bg-white text-gray-500 border-gray-100 hover:border-primary/30",
                          status === 'pending' && "bg-yellow-50 text-yellow-700 border-yellow-200",
                          status === 'approved' && "bg-green-50 text-green-700 border-green-200",
                          status === 'rejected' && "bg-red-50 text-red-700 border-red-200"
                        )}
                      >
                        {m.name}
                        {status === 'pending' && <Clock className="w-3 h-3" />}
                        {status === 'approved' && <Check className="w-3 h-3" />}
                        {status === 'rejected' && <X className="w-3 h-3" />}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-400 italic p-4 bg-gray-50 rounded-xl w-full text-center">
                    No ministries available at the moment.
                  </p>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" /> Save Changes
              </>
            )}
          </button>
        </form>

        <div className="pt-4 space-y-4">
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full py-4 bg-gray-50 text-gray-600 font-bold rounded-2xl flex items-center justify-center gap-2 border border-gray-100"
          >
            <Lock className="w-5 h-5" /> Change Password
          </button>
          
          <button
            onClick={async () => {
              await signOut();
              navigate('/login');
            }}
            className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-2xl flex items-center justify-center gap-2 border border-red-100"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl space-y-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-black text-primary">Change Password</h2>
                <p className="text-xs text-gray-500 font-medium mt-2 leading-relaxed px-4">
                  Choose a new strong password for your sanctuary account.
                </p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                    placeholder="At least 6 characters"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                    placeholder="Repeat new password"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="flex-1 py-4 bg-gray-50 text-gray-600 font-black rounded-2xl uppercase tracking-widest text-[10px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 uppercase tracking-widest text-[10px] disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                    ) : (
                      'Update'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
