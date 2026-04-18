import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Search, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Search as SearchIcon,
  ChevronRight,
  ArrowLeft,
  User as UserIcon,
  Lock,
  Check,
  X,
  Mail,
  UserCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const PERMISSIONS = [
  { id: 'devotions', label: 'Manage Devotions', desc: 'Can post Daily Bread' },
  { id: 'announcements', label: 'Manage Announcements', desc: 'Can post news' },
  { id: 'events', label: 'Manage Events', desc: 'Can manage calendar' },
  { id: 'prayers', label: 'Manage Prayers', desc: 'Can respond to requests' },
  { id: 'sermons', label: 'Manage Sermons', desc: 'Can upload sermons' },
  { id: 'ministries', label: 'Manage Ministries', desc: 'Can manage groups' },
  { id: 'schools', label: 'Manage Schools', desc: 'Can manage school work' },
  { id: 'gallery', label: 'Manage Gallery', desc: 'Can upload photos' },
  { id: 'settings', label: 'Manage Settings', desc: 'Church global config' },
];

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [draftUser, setDraftUser] = useState<any | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, zone:zones(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async () => {
    if (!draftUser) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          role: draftUser.role || 'member',
          permissions: draftUser.permissions || []
        })
        .eq('id', draftUser.id);

      if (error) throw error;

      toast.success('User updated successfully');
      fetchUsers();
      setSelectedUser(null);
      setDraftUser(null);
    } catch (err: any) {
      console.error('Update error:', err);
      toast.error(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleDraftPermission = (pId: string) => {
    if (!draftUser) return;
    const current = draftUser.permissions || [];
    const updated = current.includes(pId)
      ? current.filter((id: string) => id !== pId)
      : [...current, pId];
    setDraftUser({ ...draftUser, permissions: updated });
  };

  const setDraftRole = (role: string) => {
    if (!draftUser) return;
    setDraftUser({ ...draftUser, role });
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone?.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-50 rounded-full">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-black text-primary">User Management</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">
              {users.length} Total
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-5 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          />
        </div>

        {/* User List */}
        <div className="space-y-3">
          {loading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
            ))
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((u) => (
              <motion.div
                key={u.id}
                layoutId={`user-${u.id}`}
                onClick={() => setSelectedUser(u)}
                className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-lavender flex items-center justify-center overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 truncate">{u.full_name}</h4>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase truncate">@{u.username}</p>
                    <span className="text-gray-300">•</span>
                    <p className="text-[10px] font-black text-primary tracking-widest uppercase">{u.zone?.name || 'No Zone'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className={cn(
                    "px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter flex items-center gap-1",
                    u.role === 'admin' ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                  )}>
                    {u.role === 'admin' ? <ShieldCheck className="w-2 h-2" /> : <UserCheck className="w-2 h-2" />}
                    {u.role || 'Member'}
                  </div>
                  {u.permissions && u.permissions.length > 0 && (
                    <span className="text-[8px] font-bold text-primary opacity-50">
                      {u.permissions.length} Special Roles
                    </span>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No members found</p>
            </div>
          )}
        </div>
      </main>

      {/* Role Assignment Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedUser(null);
                setDraftUser(null);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl h-[85vh] sm:h-auto overflow-y-auto"
              onAnimationComplete={() => {
                if (!draftUser) setDraftUser({ ...selectedUser });
              }}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-lavender flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                    {selectedUser.avatar_url ? (
                      <img src={selectedUser.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-8 h-8 text-primary" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 leading-tight">{selectedUser.full_name}</h2>
                    <p className="text-xs font-black text-primary uppercase tracking-widest">@{selectedUser.username}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedUser(null);
                    setDraftUser(null);
                  }}
                  className="p-3 bg-gray-50 text-gray-400 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {draftUser && (
                <div className="space-y-8">
                  {/* Base Role */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Base Role</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setDraftRole('member')}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                          draftUser.role !== 'admin' 
                            ? "bg-primary/5 border-primary text-primary shadow-inner" 
                            : "bg-gray-50 border-gray-100 text-gray-400 font-bold"
                        )}
                      >
                        <UserIcon className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Member</span>
                      </button>
                      <button
                        onClick={() => setDraftRole('admin')}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                          draftUser.role === 'admin' 
                            ? "bg-primary/5 border-primary text-primary shadow-inner" 
                            : "bg-gray-50 border-gray-100 text-gray-400 font-bold"
                        )}
                      >
                        <Shield className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Admin</span>
                      </button>
                    </div>
                  </div>

                  {/* Granular Permissions */}
                  {draftUser.role === 'admin' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between ml-1">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Special Roles & Permissions</h3>
                        <span className="text-[9px] font-bold text-primary/50 uppercase tracking-widest">Toggle to assign</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {PERMISSIONS.map(p => {
                          const hasPermission = draftUser.permissions?.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              onClick={() => toggleDraftPermission(p.id)}
                              className={cn(
                                "p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group",
                                hasPermission
                                  ? "bg-primary/5 border-primary shadow-sm"
                                  : "bg-white border-gray-100 hover:border-gray-200"
                              )}
                            >
                              <div className={cn(
                                "absolute top-2 right-2 w-5 h-5 rounded-md flex items-center justify-center border transition-all",
                                hasPermission ? "bg-primary border-primary" : "bg-gray-50 border-gray-200"
                              )}>
                                {hasPermission && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest block mb-1",
                                hasPermission ? "text-primary" : "text-gray-900"
                              )}>
                                {p.label}
                              </span>
                              <span className="text-[9px] font-medium text-gray-400 group-hover:text-gray-500">
                                {p.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 p-4 bg-primary/5 rounded-3xl border border-primary/10">
                    <div className="flex gap-3">
                      <ShieldAlert className="w-5 h-5 text-primary shrink-0" />
                      <p className="text-[10px] font-medium text-primary/70 leading-relaxed">
                        Assigned roles grant immediate access to the corresponding Admin Dashboard modules. 
                        Super Admins can access all tools regardless of specific permissions.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleSaveUser}
                      disabled={saving}
                      className="w-full bg-primary text-white font-black py-5 rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/40 disabled:opacity-50 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3"
                    >
                      {saving ? (
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
