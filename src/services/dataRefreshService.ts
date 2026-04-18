import { supabase } from '../lib/supabase';
import { persistenceService } from './persistenceService';
import { useDataStore } from '../store/dataStore';

export const dataRefreshService = {
  async refreshAll() {
    console.log('[DataRefresh] Refreshing all cached data...');
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      const [
        dailyBreadRes,
        announcementsRes,
        sermonsRes,
        hymnsRes,
        servicesRes,
        leadershipRes,
        settingsRes,
        noticesRes
      ] = await Promise.all([
        supabase.from('daily_bread').select('*').eq('devotion_date', todayStr).maybeSingle(),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('sermons').select('*, sermon_series(title)').order('sermon_date', { ascending: false }).limit(20),
        supabase.from('hymns').select('*').order('number', { ascending: true }),
        supabase.from('services').select('*').order('start_time', { ascending: true }),
        supabase.from('leadership').select('*').order('priority', { ascending: true }),
        supabase.from('church_settings').select('*').single(),
        supabase.from('notices').select('*').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false })
      ]);

      // Cache in IndexedDB
      if (dailyBreadRes.data) await persistenceService.set('daily_bread', [dailyBreadRes.data]);
      if (announcementsRes.data) await persistenceService.set('announcements', announcementsRes.data);
      if (sermonsRes.data) await persistenceService.set('sermons', sermonsRes.data);
      if (hymnsRes.data) await persistenceService.set('hymns', hymnsRes.data);
      if (servicesRes.data) await persistenceService.set('schedule', servicesRes.data);
      if (leadershipRes.data) await persistenceService.set('leadership', leadershipRes.data);
      if (settingsRes.data) await persistenceService.set('settings', settingsRes.data);
      if (noticesRes.data) await persistenceService.set('notices', noticesRes.data);

      // Update Zustand store for immediate UI update
      const store = useDataStore.getState();
      if (dailyBreadRes.data) store.setDailyBread(dailyBreadRes.data);
      if (announcementsRes.data) store.setAnnouncements(announcementsRes.data);
      if (sermonsRes.data) store.setSermons(sermonsRes.data);
      if (hymnsRes.data) store.setHymns(hymnsRes.data);
      if (servicesRes.data) store.setServices(servicesRes.data);
      if (leadershipRes.data) store.setLeadership(leadershipRes.data);
      if (settingsRes.data) store.setChurchSettings(settingsRes.data);
      if (noticesRes.data) store.setNotices(noticesRes.data);

      console.log('[DataRefresh] Sync complete.');
      return true;
    } catch (error) {
      console.error('[DataRefresh] Failed to sync:', error);
      return false;
    }
  },

  async loadFromCache() {
    const store = useDataStore.getState();
    
    const [
      dailyBread,
      announcements,
      sermons,
      hymns,
      services,
      leadership,
      settings,
      notices
    ] = await Promise.all([
      persistenceService.get('daily_bread'),
      persistenceService.get('announcements'),
      persistenceService.get('sermons'),
      persistenceService.get('hymns'),
      persistenceService.get('schedule'),
      persistenceService.get('leadership'),
      persistenceService.get('settings'),
      persistenceService.get('notices')
    ]);

    if (dailyBread?.length) store.setDailyBread(dailyBread[0]);
    if (announcements?.length) store.setAnnouncements(announcements);
    if (sermons?.length) store.setSermons(sermons);
    if (hymns?.length) store.setHymns(hymns);
    if (services?.length) store.setServices(services);
    if (leadership?.length) store.setLeadership(leadership);
    if (settings) store.setChurchSettings(settings);
    if (notices?.length) store.setNotices(notices);
  }
};
