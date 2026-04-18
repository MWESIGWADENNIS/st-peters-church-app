import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: any | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: any | null) => void;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  initialize: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  signOut: async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
    sessionStorage.removeItem('toasted_notifications');
    set({ user: null, profile: null });
  },
  fetchProfile: async (userId) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, zone:zones(*)')
        .eq('id', userId)
        .single();
      
      if (!error) {
        // Fallback for primary admin
        const isPrimaryAdmin = 
          get().user?.email === 'dmwesigwa200@gmail.com' || 
          data?.username === 'dmwesigwa200' ||
          data?.username === 'admin';
          
        if (isPrimaryAdmin) {
          data.role = 'admin';
          data.is_super_admin = true;
        }
        set({ profile: data });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  },
  hasPermission: (permission: string) => {
    const profile = get().profile;
    if (!profile) return false;
    if (profile.is_super_admin || profile.role === 'admin' && (!profile.permissions || profile.permissions.length === 0)) return true;
    return profile.permissions?.includes(permission) || false;
  },
  initialize: async () => {
    if (get().initialized) return;

    if (!isSupabaseConfigured) {
      set({ loading: false, initialized: true });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      set({ user });

      if (user) {
        await get().fetchProfile(user.id);
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        const user = session?.user ?? null;
        set({ user });
        if (user) {
          await get().fetchProfile(user.id);
        } else {
          set({ profile: null });
        }
        set({ loading: false });
      });
    } catch (err) {
      console.error('Auth initialization error:', err);
    } finally {
      set({ loading: false, initialized: true });
    }
  },
}));
