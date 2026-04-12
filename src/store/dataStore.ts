import { create } from 'zustand';

interface DataState {
  announcements: any[];
  events: any[];
  services: any[];
  dailyBread: any | null;
  sermons: any[];
  hymns: any[];
  ministries: any[];
  schools: any[];
  leadership: any[];
  churchSettings: any | null;
  unreadCount: number;
  lastFetched: { [key: string]: number };
  
  setAnnouncements: (data: any[]) => void;
  setEvents: (data: any[]) => void;
  setServices: (data: any[]) => void;
  setDailyBread: (data: any) => void;
  setSermons: (data: any[]) => void;
  setHymns: (data: any[]) => void;
  setMinistries: (data: any[]) => void;
  setSchools: (data: any[]) => void;
  setLeadership: (data: any[]) => void;
  setChurchSettings: (data: any) => void;
  setUnreadCount: (count: number) => void;
  
  isCacheValid: (key: string, ttl?: number) => boolean;
}

const DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes

export const useDataStore = create<DataState>((set, get) => ({
  announcements: [],
  events: [],
  services: [],
  dailyBread: null,
  sermons: [],
  hymns: [],
  ministries: [],
  schools: [],
  leadership: [],
  churchSettings: null,
  unreadCount: 0,
  lastFetched: {},

  setAnnouncements: (data) => set((state) => ({ 
    announcements: data, 
    lastFetched: { ...state.lastFetched, announcements: Date.now() } 
  })),
  
  setEvents: (data) => set((state) => ({ 
    events: data, 
    lastFetched: { ...state.lastFetched, events: Date.now() } 
  })),
  
  setServices: (data) => set((state) => ({ 
    services: data, 
    lastFetched: { ...state.lastFetched, services: Date.now() } 
  })),
  
  setDailyBread: (data) => set((state) => ({ 
    dailyBread: data, 
    lastFetched: { ...state.lastFetched, dailyBread: Date.now() } 
  })),
  
  setSermons: (data) => set((state) => ({ 
    sermons: data, 
    lastFetched: { ...state.lastFetched, sermons: Date.now() } 
  })),
  
  setHymns: (data) => set((state) => ({ 
    hymns: data, 
    lastFetched: { ...state.lastFetched, hymns: Date.now() } 
  })),

  setMinistries: (data) => set((state) => ({ 
    ministries: data, 
    lastFetched: { ...state.lastFetched, ministries: Date.now() } 
  })),

  setSchools: (data) => set((state) => ({ 
    schools: data, 
    lastFetched: { ...state.lastFetched, schools: Date.now() } 
  })),

  setLeadership: (data) => set((state) => ({ 
    leadership: data, 
    lastFetched: { ...state.lastFetched, leadership: Date.now() } 
  })),

  setChurchSettings: (data) => set((state) => ({ 
    churchSettings: data, 
    lastFetched: { ...state.lastFetched, churchSettings: Date.now() } 
  })),

  setUnreadCount: (count) => set({ unreadCount: count }),

  isCacheValid: (key, ttl = DEFAULT_TTL) => {
    const last = get().lastFetched[key];
    if (!last) return false;
    return Date.now() - last < ttl;
  }
}));
