import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  Calendar, 
  Megaphone, 
  MessageSquare, 
  Info, 
  ChevronRight,
  Clock,
  MapPin,
  User,
  BookOpen,
  RefreshCw,
  Play,
  Eye,
  ShieldCheck,
  Music,
  StickyNote,
  Gift,
  Image as ImageIcon,
  Sparkles,
  Quote,
  ArrowRight,
  Search,
  Book
} from 'lucide-react';
import { format, isToday } from 'date-fns';
import { toast } from 'react-hot-toast';
import { getTodayServices, getSundayTheme } from '../lib/churchSchedule';
import { getVibe } from '../utils/vibeUtils';
import { getBibleLink } from '../utils/bibleLinkUtils';
import { useDataStore } from '../store/dataStore';
import { useAuthStore } from '../store/authStore';
import { PullToRefresh } from '../components/PullToRefresh';
import { BannerSkeleton, CardSkeleton } from '../components/Skeleton';
import { dataRefreshService } from '../services/dataRefreshService';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function Home() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { 
    announcements: cachedAnnouncements, 
    events: cachedEvents, 
    dailyBread: cachedDailyBread,
    notices: cachedNotices,
    hymnOfWeek: cachedHymnOfWeek,
    galleryAlbums: cachedGalleryAlbums,
    setAnnouncements,
    setEvents,
    setDailyBread,
    setNotices,
    setHymnOfWeek,
    setGalleryAlbums,
    isCacheValid
  } = useDataStore();

  const [banners, setBanners] = useState<any[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [dailyBread, setLocalDailyBread] = useState<any>(cachedDailyBread);
  const [upcomingEvents, setLocalUpcomingEvents] = useState<any[]>(cachedEvents);
  const [announcements, setLocalAnnouncements] = useState<any[]>(cachedAnnouncements);
  const [notices, setLocalNotices] = useState<any[]>(cachedNotices);
  const [hymnOfWeek, setLocalHymnOfWeek] = useState<any>(cachedHymnOfWeek);
  const [recentAlbums, setRecentAlbums] = useState<any[]>(cachedGalleryAlbums);
  const [recentVideos, setRecentVideos] = useState<any[]>([]);
  const [isBirthday, setIsBirthday] = useState(false);
  const [showBirthdayPrompt, setShowBirthdayPrompt] = useState(false);
  const [vibe, setVibe] = useState(getVibe(new Date()));

  const [loading, setLoading] = useState(!isCacheValid('home'));
  const [error, setError] = useState<string | null>(null);
  const isOnline = useNetworkStatus();

  const fetchData = async (force = false) => {
    const cacheValid = isCacheValid('home');
    if ((!cacheValid || force) && isOnline) {
      setLoading(true);
      setError(null);
    }

    try {
      if (!isOnline) {
        await dataRefreshService.loadFromCache();
        return;
      }

      await dataRefreshService.refreshAll();
      
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const dayName = format(new Date(), 'EEEE');

      const requests = [
        supabase.from('services').select('*').eq('day_of_week', dayName).order('start_time', { ascending: true }),
        supabase.from('daily_bread').select('id, title, bible_verse, devotion_body, devotion_date').eq('devotion_date', todayStr).maybeSingle(),
        supabase.from('events').select('id, title, image_url, event_date, start_time').gte('event_date', todayStr).order('event_date', { ascending: true }).limit(10),
        supabase.from('announcements').select('id, title, body, image_url, is_pinned, created_at').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(4),
        supabase.from('church_videos').select('id, title, youtube_url, video_url, thumbnail_url, category, recorded_date').order('recorded_date', { ascending: false }).limit(4),
        supabase.from('notices').select('*').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(3),
        supabase.from('hymns').select('*').eq('is_hymn_of_week', true).maybeSingle(),
        supabase.from('gallery_albums').select('*').order('created_at', { ascending: false }).limit(4),
        user ? supabase.from('users').select('date_of_birth').eq('id', user.id).single() : Promise.resolve({ data: null })
      ];

      const results = await Promise.allSettled(requests);
      
      const [
        todayServicesResult,
        dailyBreadResult,
        eventsResult,
        announcementsResult,
        videosResult,
        noticesResult,
        hymnOfWeekResult,
        galleryResult,
        userProfileResult
      ] = results;

      const todayServicesData = todayServicesResult.status === 'fulfilled' ? (todayServicesResult.value.data as any[]) : null;
      const dbData = dailyBreadResult.status === 'fulfilled' ? dailyBreadResult.value.data : null;
      const allEvents = eventsResult.status === 'fulfilled' ? (eventsResult.value.data as any[]) : [];
      const allAnnouncements = announcementsResult.status === 'fulfilled' ? (announcementsResult.value.data as any[]) : [];
      const recVideos = videosResult.status === 'fulfilled' ? (videosResult.value.data as any[]) : null;
      const noticesData = noticesResult.status === 'fulfilled' ? (noticesResult.value.data as any[]) : [];
      const hymnData = hymnOfWeekResult.status === 'fulfilled' ? hymnOfWeekResult.value.data : null;
      const galleryData = galleryResult.status === 'fulfilled' ? (galleryResult.value.data as any[]) : [];
      const profileData = userProfileResult.status === 'fulfilled' ? userProfileResult.value.data : null;

      // Check Birthday
      if (profileData?.date_of_birth) {
        const dob = new Date(profileData.date_of_birth);
        const today = new Date();
        if (dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate()) {
          setIsBirthday(true);
        }
      } else if (user) {
        setShowBirthdayPrompt(true);
      }

      const upEvents = allEvents?.slice(0, 5);
      const pinnedAnnouncement = allAnnouncements?.find(a => a.is_pinned);
      const recAnn = allAnnouncements?.slice(0, 3);

      const newBanners = [];
      const sundayTheme = getSundayTheme(new Date());

      if (todayServicesData && todayServicesData.length > 0) {
        const now = new Date();
        const currentTime = format(now, 'HH:mm');
        
        todayServicesData.forEach((service, index) => {
          if (!service?.start_time) return; // Defensive check
          
          const startTime = service.start_time.slice(0, 5);
          const startHour = parseInt(startTime.split(':')[0]) || 0;
          const startMin = parseInt(startTime.split(':')[1]) || 0;
          const endHour = startHour + 2;
          const endTime = `${endHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
          
          const isLive = currentTime >= startTime && currentTime <= endTime;
          const isFinished = currentTime > endTime;
          const finishedLimitHour = endHour + 4;
          const finishedLimitTime = `${finishedLimitHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
          const isRecentlyFinished = isFinished && currentTime <= finishedLimitTime;

          if (isRecentlyFinished) {
            newBanners.push({
              type: 'service-recap',
              title: "Service Completed",
              subtitle: `Thank you for attending ${service.name}!`,
              time: startTime,
              icon: BookOpen,
              isFinished: true,
              color: 'bg-gradient-to-br from-slate-600 to-slate-800',
              path: '/today-service'
            });
          } else if (!isFinished) {
            newBanners.push({
              type: 'service',
              title: sundayTheme ? sundayTheme : "Today's Service",
              subtitle: service.name,
              time: startTime,
              icon: Clock,
              isLive,
              preacher: service.preacher,
              preacher_image_url: service.preacher_image_url,
              theme: service.theme,
              color: isLive 
                ? 'bg-gradient-to-br from-red-600 via-rose-500 to-orange-500' 
                : index % 2 === 0 
                  ? 'bg-gradient-to-br from-primary via-primary/90 to-indigo-600'
                  : 'bg-gradient-to-br from-indigo-600 via-blue-500 to-primary',
              path: '/today-service'
            });
          }
        });
      }

      if (pinnedAnnouncement) {
        newBanners.push({
          type: 'announcement',
          title: 'Pinned Announcement',
          subtitle: pinnedAnnouncement.title,
          image: pinnedAnnouncement.image_url,
          badge: '📌 Pinned',
          color: 'bg-gradient-to-br from-purple-600 to-indigo-600',
          path: `/announcements/${pinnedAnnouncement.id}`
        });
      }

      newBanners.push({
        type: 'verse',
        title: 'Daily Encouragement',
        subtitle: '"For I know the plans I have for you," declares the Lord...',
        reference: 'Jeremiah 29:11',
        color: 'bg-gradient-to-br from-emerald-500 to-teal-600',
        path: getBibleLink('Jeremiah 29:11')
      });

      // Batch state updates
      setBanners(newBanners);
      setLocalDailyBread(dbData);
      setLocalUpcomingEvents(upEvents || []);
      setLocalAnnouncements(recAnn || []);
      setLocalNotices(noticesData || []);
      setLocalHymnOfWeek(hymnData);
      setRecentAlbums(galleryData || []);
      setRecentVideos(recVideos || []);

      // Update store
      setDailyBread(dbData);
      setEvents(upEvents || []);
      setAnnouncements(recAnn || []);
      setNotices(noticesData || []);
      setHymnOfWeek(hymnData);
      setGalleryAlbums(galleryData || []);
      
      useDataStore.setState((state) => ({ 
        lastFetched: { ...state.lastFetched, home: Date.now() } 
      }));

    } catch (error: any) {
      console.error('Error fetching home data:', error);
      let message = error.message || 'Failed to refresh data.';
      if (message.includes('Failed to fetch')) {
        message = 'Connection error. Please check your internet or Supabase configuration.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setVibe(getVibe(new Date()));

    const handleOnline = () => {
      console.log('Back online, refreshing home data...');
      dataRefreshService.refreshAll();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % (banners.length || 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [banners]);

  return (
    <PullToRefresh onRefresh={() => fetchData(true)}>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 space-y-6 relative"
      >
        {/* Vibe Background Glow */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-64 bg-gradient-to-b opacity-10 -z-10 transition-colors duration-1000",
          vibe.type === 'independence' ? 'from-yellow-400' :
          vibe.type === 'womens-day' ? 'from-pink-400' :
          vibe.type === 'easter' ? 'from-purple-400' :
          vibe.type === 'palm-sunday' ? 'from-emerald-400' :
          vibe.type === 'christmas' ? 'from-red-400' :
          vibe.type === 'sunday' ? 'from-primary' :
          vibe.type === 'tuesday' ? 'from-red-600' :
          vibe.type === 'wednesday' ? 'from-teal-600' :
          vibe.type === 'friday' ? 'from-sky-600' :
          'from-primary'
        )} />

        <div className="flex items-start justify-between mb-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-2 animate-float"
          >
            <div className="flex flex-col">
              <motion.span 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em] mb-1 transition-colors duration-500",
                  vibe.type === 'default' ? 'text-primary/50' : vibe.primaryColor
                )}
              >
                {vibe.greeting}
              </motion.span>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black leading-none tracking-tighter flex flex-col">
                  <span className="text-primary opacity-90">Welcome,</span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "bg-clip-text text-transparent animate-gradient-x py-1 bg-gradient-to-r",
                      vibe.gradient
                    )}>
                      {profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'Member'}
                    </span>
                    {profile?.role === 'admin' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-primary text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter shadow-sm flex items-center gap-0.5"
                      >
                         Admin
                      </motion.div>
                    )}
                  </div>
                </h1>
                <motion.span
                  animate={{ 
                    rotate: [0, 10, -10, 10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-3xl drop-shadow-sm"
                >
                  {vibe.icon}
                </motion.span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className={cn(
                  "px-3 py-1 rounded-full border-l-4 flex items-center gap-2 shadow-sm transition-all duration-500",
                  vibe.type === 'independence' ? 'bg-yellow-50 border-red-600' :
                  vibe.type === 'womens-day' ? 'bg-pink-50 border-purple-600' :
                  vibe.type === 'easter' ? 'bg-purple-50 border-yellow-400' :
                  'bg-gradient-to-r from-accent/20 to-transparent border-accent'
                )}
              >
                <Sparkles className={cn(
                  "w-3.5 h-3.5 animate-pulse",
                  vibe.type === 'independence' ? 'text-red-600' : 
                  vibe.type === 'womens-day' ? 'text-purple-600' : 
                  'text-accent'
                )} />
                <span className="text-[10px] font-black text-primary uppercase tracking-tight">
                  {vibe.subGreeting}
                </span>
                {vibe.badge && (
                  <span className="ml-1 px-1.5 py-0.5 bg-primary text-white text-[8px] rounded-md font-black">
                    {vibe.badge}
                  </span>
                )}
              </motion.div>
            </div>
          </motion.div>
          
          <div className="flex items-center gap-2">
            {profile?.role === 'admin' && (
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/admin')}
                className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center border border-white/20"
              >
                <div className="relative">
                  <ShieldCheck className="w-5 h-5" />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full border border-primary shadow-[0_0_5px_rgba(245,171,0,0.5)]"
                  />
                </div>
              </motion.button>
            )}
            
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9, rotate: 180 }}
              onClick={() => fetchData(true)} 
              disabled={loading}
              className="p-3 bg-white text-primary rounded-2xl transition-all disabled:opacity-50 shadow-xl border border-primary/5 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <RefreshCw className={cn("w-5 h-5 relative z-10 transition-transform group-hover:scale-110", loading && "animate-spin")} />
            </motion.button>
          </div>
        </div>

        {/* Sunday Worship Special Card */}
        {vibe.type === 'sunday' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-red-800 via-red-900 to-amber-600 p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(128,0,0,0.3)] border border-white/20 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
            
            <div className="relative z-10 space-y-3">
               <div className="flex items-center gap-2">
                 <div className="px-2 py-0.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 flex items-center gap-1.5">
                   <span className="w-1 h-1 bg-amber-400 rounded-full animate-ping" />
                   <span className="text-[8px] font-black text-amber-200 uppercase tracking-widest">Worship Day</span>
                 </div>
               </div>
               
               <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner group-hover:rotate-6 transition-transform">
                   <Sparkles className="w-8 h-8 text-amber-400" />
                 </div>
                 <div>
                   <h2 className="text-xl font-black text-white leading-tight tracking-tight">Today is a Day for Praise</h2>
                   <p className="text-amber-100/70 text-[10px] font-bold mt-1 max-w-[200px]">"I was glad when they said unto me, Let us go into the house of the Lord." — Psalm 122:1</p>
                 </div>
               </div>

               <div className="pt-2 flex items-center gap-3">
                 <button 
                   onClick={() => navigate('/livestream')} 
                   className="flex-1 py-3 bg-white text-red-900 font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                 >
                   <Play className="w-3.5 h-3.5 fill-current" /> Join Online
                 </button>
                 <button 
                    onClick={() => navigate('/hymns')}
                    className="p-3 bg-white/10 backdrop-blur-md text-white rounded-2xl border border-white/20 hover:bg-white/20 transition-all"
                 >
                   <Music className="w-5 h-5" />
                 </button>
               </div>
            </div>
          </motion.div>
        )}

        {/* Sunday Preacher Invitation Card */}
        {vibe.type === 'sunday' && banners.some(b => b.type === 'service') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col gap-6 relative overflow-hidden"
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Sunday Service</h3>
                  <p className="text-[10px] font-bold text-gray-400">Word from our Preacher</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-accent/10 text-accent text-[9px] font-black rounded-lg uppercase tracking-widest border border-accent/20">
                Invitation
              </div>
            </div>

            <div className="flex items-center gap-5 relative z-10">
              <div className="w-24 h-24 rounded-3xl bg-gray-50 p-1 border border-gray-100 flex-shrink-0 group overflow-hidden">
                {banners.find(b => b.type === 'service')?.preacher_image_url ? (
                  <img 
                    src={banners.find(b => b.type === 'service')?.preacher_image_url} 
                    alt="Preacher" 
                    className="w-full h-full object-cover rounded-2xl transition-transform group-hover:scale-110" 
                  />
                ) : (
                  <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary/30">
                    <User className="w-10 h-10" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-secondary text-[10px] font-black uppercase tracking-widest">Preaching Today</p>
                <h4 className="text-xl font-display font-black text-primary leading-tight">
                  {banners.find(b => b.type === 'service')?.preacher || 'Our Clergy'}
                </h4>
                {banners.find(b => b.type === 'service')?.theme && (
                  <p className="text-xs font-bold text-gray-500 line-clamp-2 italic">
                    Theme: "{banners.find(b => b.type === 'service')?.theme}"
                  </p>
                )}
              </div>
            </div>

            <div className="relative z-10 p-5 bg-primary rounded-3xl text-white shadow-lg shadow-primary/20">
              <p className="text-xs font-medium leading-relaxed mb-4 opacity-90">
                Join us today as we gather to receive a powerful word of transformation. Don't miss this opportunity to be spiritually renewed!
              </p>
              <button 
                onClick={() => navigate('/today-service')}
                className="w-full py-3 bg-white text-primary font-black rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-sm flex items-center justify-center gap-2 group"
              >
                View Full Program <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <div className="absolute -left-4 -bottom-4 opacity-5 pointer-events-none">
              <Sparkles className="w-32 h-32 text-primary" />
            </div>
          </motion.div>
        )}

        {/* Vibe Message Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={cn(
            "p-4 rounded-3xl border shadow-lg relative overflow-hidden group",
            vibe.type === 'independence' ? 'bg-black text-white border-yellow-500/30' :
            vibe.type === 'womens-day' ? 'bg-purple-50 border-purple-100 text-purple-900' :
            vibe.type === 'easter' ? 'bg-lavender border-primary/10 text-primary' :
            vibe.type === 'palm-sunday' ? 'bg-emerald-50 border-emerald-100 text-emerald-900' :
            vibe.type === 'christmas' ? 'bg-red-50 border-red-100 text-red-900' :
            'bg-white border-gray-100 text-gray-900'
          )}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Quote className="w-12 h-12" />
          </div>
          <p className="text-xs font-bold italic leading-relaxed relative z-10 pr-8">
            "{vibe.message}"
          </p>
        </motion.div>

        {/* Birthday Banner */}
        <AnimatePresence>
          {isBirthday && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 p-4 rounded-2xl shadow-lg border-2 border-white/50 relative overflow-hidden"
            >
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -right-4 -top-4 opacity-20"
              >
                <Gift size={100} />
              </motion.div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">
                  🎂
                </div>
                <div>
                  <h3 className="font-black text-primary text-lg leading-tight">Happy Birthday, {profile?.full_name || user?.user_metadata?.full_name || 'Member'}!</h3>
                  <p className="text-primary/70 text-xs font-bold">May God bless you abundantly today and always!</p>
                </div>
              </div>
            </motion.div>
          )}

          {!isBirthday && showBirthdayPrompt && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-white p-4 rounded-2xl shadow-lg border border-primary/10 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-primary text-sm leading-tight">Missing your birthday?</h3>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Add it so we can celebrate you!</p>
                  </div>
                </div>
                <Link 
                  to="/profile" 
                  className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg shadow-md hover:scale-105 transition-transform"
                >
                  Add Now
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rotating Banner */}
        <div className="relative h-52">
          {loading ? (
            <BannerSkeleton />
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentBanner}
                initial={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <Link 
                  to={banners[currentBanner]?.path || '#'} 
                  className="block h-full w-full relative"
                >
                  {banners[currentBanner]?.image ? (
                    <div className="relative h-full w-full overflow-hidden">
                      <motion.img 
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 10, ease: "linear" }}
                        src={banners[currentBanner].image || undefined} 
                        alt={banners[currentBanner].title}
                        className="w-full h-full object-cover"
                        loading="eager"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <div className="absolute inset-0 p-6 flex flex-col justify-end">
                        <div className="flex items-center gap-2 mb-3">
                          {banners[currentBanner].badge && (
                            <motion.span 
                              initial={{ y: 10, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.2 }}
                              className="bg-accent/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg border border-white/20"
                            >
                              {banners[currentBanner].badge}
                            </motion.span>
                          )}
                        </div>
                        <motion.h3 
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="text-white font-display font-black text-2xl leading-tight drop-shadow-2xl max-w-[85%]"
                        >
                          {banners[currentBanner].subtitle}
                        </motion.h3>
                      </div>
                    </div>
                  ) : (
                    <div className={cn(
                      "h-full w-full p-8 flex flex-col justify-center text-white relative overflow-hidden transition-colors duration-700",
                      banners[currentBanner]?.color || 'bg-primary'
                    )}>
                      {/* Premium Decorative Elements */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-[80px] animate-pulse" />
                      <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full -ml-24 -mb-24 blur-[60px]" />
                      
                      <div className="relative z-10 space-y-3">
                        <div className="flex items-center gap-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
                            {banners[currentBanner]?.title}
                          </p>
                          {banners[currentBanner]?.isLive && (
                            <div className="flex items-center gap-1.5 bg-red-500/20 backdrop-blur-xl px-2.5 py-1 rounded-full border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                              <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                              <span className="text-[8px] font-black uppercase tracking-tighter">Live Now</span>
                            </div>
                          )}
                          {banners[currentBanner]?.isFinished && (
                            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-xl px-2.5 py-1 rounded-full border border-white/20">
                              <span className="text-[8px] font-black uppercase tracking-tighter">Completed</span>
                            </div>
                          )}
                        </div>
                        
                        <h3 className="text-3xl font-display font-black leading-[1.1] tracking-tight max-w-[90%] drop-shadow-lg">
                          {banners[currentBanner]?.subtitle}
                        </h3>
                        
                        <div className="flex items-center gap-4 pt-1">
                          {banners[currentBanner]?.time && !banners[currentBanner]?.isFinished && (
                            <div className="flex items-center gap-2 text-white/90 font-bold text-xs bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Starts at {banners[currentBanner].time}</span>
                            </div>
                          )}

                          {banners[currentBanner]?.isFinished && (
                            <div className="flex items-center gap-2 text-white/90 font-bold text-xs bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>View Recap</span>
                            </div>
                          )}
                        </div>
                        
                        {banners[currentBanner]?.reference && (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex items-start gap-3 text-white/90 italic bg-black/10 backdrop-blur-sm p-3 rounded-2xl border border-white/5"
                          >
                            <Quote className="w-4 h-4 text-white/30 flex-shrink-0" />
                            <p className="text-sm font-medium leading-relaxed">
                              {banners[currentBanner].reference}
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  )}
                </Link>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Premium Progress Indicators */}
          {!loading && banners.length > 1 && (
            <div className="absolute bottom-6 left-8 flex gap-2 z-20">
              {banners.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentBanner(idx);
                  }}
                  className="group relative py-2"
                >
                  <div 
                    className={cn(
                      "h-1 rounded-full transition-all duration-700 ease-out",
                      currentBanner === idx ? "w-8 bg-white" : "w-2 bg-white/30 group-hover:bg-white/50"
                    )}
                  />
                  {currentBanner === idx && (
                    <motion.div 
                      layoutId="active-dot"
                      className="absolute inset-0 bg-white/20 blur-md rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
          
          {/* Navigation Arrows (Visible on hover) */}
          {!loading && banners.length > 1 && (
            <div className="absolute inset-y-0 right-4 flex flex-col justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
                }}
                className="p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentBanner((prev) => (prev + 1) % banners.length);
                }}
                className="p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Daily Bread Card */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-gradient-to-br from-primary via-indigo-700 to-purple-900 text-white p-6 border border-white/10"
        >
          {/* Static Decorative Elements */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-white/10 rounded-full blur-[100px] opacity-40" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 bg-accent/20 rounded-full blur-[80px] opacity-30" />
          <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-12">
            <BookOpen className="w-40 h-40" />
          </div>
 
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5 px-4 py-1.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Daily Bread</span>
              </div>
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest bg-black/20 px-3 py-1.5 rounded-full border border-white/5">
                {format(new Date(), 'EEEE, MMM dd')}
              </span>
            </div>
 
            {dailyBread ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-black text-3xl mb-2 leading-tight tracking-tight drop-shadow-md">
                    {dailyBread.title}
                  </h3>
                  <div className="h-1.5 w-12 bg-accent rounded-full shadow-[0_0_15px_rgba(245,166,35,0.4)]" />
                </div>
                
                <div className="relative pl-6 border-l-4 border-accent/40 py-2 bg-white/5 rounded-r-2xl">
                  <Quote className="absolute -left-3 -top-3 w-6 h-6 text-accent/20" />
                  <p className="text-accent font-display italic text-xl leading-snug drop-shadow-sm pr-4">
                    {dailyBread.bible_verse}
                  </p>
                </div>
 
                <p className="text-white/80 text-sm line-clamp-3 leading-relaxed font-medium italic bg-black/10 p-4 rounded-2xl border border-white/5">
                  "{dailyBread.devotion_body}"
                </p>
 
                <div className="pt-2">
                  <Link 
                    to={`/daily-bread/${dailyBread.id}`}
                    className="group/btn inline-flex items-center gap-3 bg-white text-primary px-7 py-3 rounded-2xl text-xs font-black transition-all hover:bg-accent hover:text-white shadow-[0_15px_30px_rgba(0,0,0,0.2)] hover:shadow-accent/40 active:scale-95"
                  >
                    Read Full Devotion
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-2" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-white/40 italic text-xl font-display animate-pulse">
                  "The Lord is my shepherd; I shall not want."
                </p>
              </div>
            )}
          </div>
        </motion.section>

        {/* Hymn of the Week */}
        {hymnOfWeek && (
          <section className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-black text-gray-900 flex items-center gap-2.5 text-base uppercase tracking-tight">
                <div className="p-1.5 bg-accent/10 rounded-lg">
                  <Music className="w-4 h-4 text-accent" />
                </div>
                Hymn of the Week
              </h2>
            </div>
            <Link to={`/hymns/${hymnOfWeek.id}`}>
              <motion.div 
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-[2rem] p-6 shadow-[0_15px_35px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden group transition-all"
              >
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12">
                  <Music size={100} />
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <span className="bg-accent text-white text-[11px] font-black px-3 py-1.5 rounded-xl shadow-lg shadow-accent/20">
                    #{hymnOfWeek.number}
                  </span>
                  <h3 className="font-black text-gray-900 text-xl tracking-tight leading-tight">{hymnOfWeek.title}</h3>
                </div>
                <p className="text-gray-500 text-sm italic line-clamp-1 mb-4 pl-4 border-l-2 border-accent/20">
                  {hymnOfWeek.lyrics.split('\n')[0]}...
                </p>
                <div className="flex items-center text-primary text-[10px] font-black uppercase tracking-[0.2em] group-hover:gap-3 transition-all">
                  View Full Hymn <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            </Link>
          </section>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { icon: MessageSquare, label: 'Prayer', path: '/prayer', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50/50', text: 'text-blue-600' },
            { icon: Book, label: 'Bible', path: '/bible', color: 'from-primary to-indigo-600', bg: 'bg-primary/5', text: 'text-primary' },
            { icon: Calendar, label: 'Events', path: '/events', color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50/50', text: 'text-orange-600' },
            { icon: Megaphone, label: 'News', path: '/announcements', color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50/50', text: 'text-purple-600' },
            { icon: ImageIcon, label: 'Gallery', path: '/gallery', color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50/50', text: 'text-emerald-600' },
          ].map((action, idx) => (
            <div key={action.label}>
              <Link to={action.path} className="flex flex-col items-center gap-3 group">
                <motion.div 
                  whileHover={{ y: -5, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "w-full aspect-square rounded-[1.75rem] flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.05)] transition-all relative overflow-hidden border border-white",
                    action.bg
                  )}
                >
                  <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br transition-opacity", action.color)} />
                  <action.icon className={cn("w-6 h-6 transition-all group-hover:scale-110", action.text)} />
                </motion.div>
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-tight group-hover:text-primary transition-colors text-center">{action.label}</span>
              </Link>
            </div>
          ))}
        </div>

        {/* Notice Board */}
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-black text-gray-900 flex items-center gap-2.5 text-base uppercase tracking-tight">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <StickyNote className="w-4 h-4 text-primary" />
              </div>
              Notice Board
            </h2>
            <Link to="/notices" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline decoration-2 underline-offset-4">View All</Link>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="flex-shrink-0 w-72"><CardSkeleton /></div>)
            ) : notices.length > 0 ? (
              notices.map((notice) => (
                <motion.div 
                  key={notice.id}
                  whileHover={{ y: -5 }}
                  className={cn(
                    "flex-shrink-0 w-72 p-6 rounded-[2rem] border shadow-[0_15px_35px_rgba(0,0,0,0.05)] relative overflow-hidden group transition-all",
                    notice.colour === 'red' ? 'bg-red-50/50 border-red-100 text-red-900' :
                    notice.colour === 'green' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900' :
                    notice.colour === 'blue' ? 'bg-blue-50/50 border-blue-100 text-blue-900' :
                    'bg-amber-50/50 border-amber-100 text-amber-900'
                  )}
                >
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/30 rounded-full blur-3xl group-hover:scale-150 transition-transform" />
                  <h3 className="font-black font-display text-lg uppercase mb-2 truncate tracking-tight">{notice.title}</h3>
                  <p className="text-xs font-medium opacity-80 line-clamp-3 mb-4 leading-relaxed">{notice.body}</p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/5">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest opacity-40">
                      <Clock className="w-3 h-3" />
                      {format(new Date(notice.expires_at), 'MMM d')}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center shadow-sm">
                      <Info className="w-4 h-4 opacity-30" />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="w-full py-12 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100 mx-4">
                <StickyNote className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">No active notices at this time</p>
              </div>
            )}
          </div>
        </section>

        {/* Recent Videos Section */}
        {recentVideos.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-black text-gray-900 flex items-center gap-2.5 text-base uppercase tracking-tight">
                <div className="p-1.5 bg-red-50 rounded-lg">
                  <Play className="w-4 h-4 text-red-600 fill-current" />
                </div>
                Recent Sermons
              </h2>
              <Link to="/videos" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Watch More</Link>
            </div>
            
            <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4">
              {recentVideos.map((video) => (
                <motion.div
                  key={video.id}
                  whileHover={{ y: -5 }}
                  className="flex-shrink-0 w-72 group"
                >
                  <Link to={`/videos/${video.id}`} className="block space-y-3">
                    <div className="relative aspect-video rounded-[2rem] overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.1)] border border-white/20">
                      <img 
                        src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_url?.split('v=')[1]?.split('&')[0]}/maxresdefault.jpg`} 
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="w-14 h-14 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl transition-all group-hover:scale-110 group-hover:bg-white">
                          <Play className="w-6 h-6 text-red-600 fill-current ml-1" />
                        </div>
                      </div>
                      <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/20">
                        {video.category || 'Sermon'}
                      </div>
                    </div>
                    <div className="px-2">
                      <h3 className="font-black text-gray-900 text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {video.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(video.recorded_date), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Gallery Highlights Section */}
        {recentAlbums.length > 0 && (
          <section className="relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-gray-900 flex items-center gap-2 text-base uppercase tracking-tight">
                <div className="p-1.5 bg-emerald-100 rounded-lg">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                </div>
                Gallery Highlights
              </h2>
              <Link to="/gallery" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View All</Link>
            </div>

            <div className="mb-4">
              <div 
                onClick={() => navigate('/gallery')}
                className="relative cursor-pointer"
              >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <div className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-3 pl-11 pr-4 text-sm text-gray-400 font-medium">
                  Search images or videos...
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-5 scrollbar-hide -mx-4 px-4">
              {recentAlbums.map((album) => (
                <div
                  key={album.id}
                  className="flex-shrink-0 w-48 group transition-transform hover:-translate-y-1"
                >
                  <Link to="/gallery" className="block space-y-2.5">
                    <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border-2 border-white">
                      <img 
                        src={album.cover_image_url || `https://picsum.photos/seed/${album.id}/400/300`} 
                        alt={album.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                        <h3 className="text-white font-black text-[10px] uppercase tracking-tight line-clamp-1">
                          {album.title}
                        </h3>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-900 text-base uppercase tracking-tight">Upcoming Events</h2>
            <Link to="/events" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">See All</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-5 scrollbar-hide -mx-4 px-4">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex-shrink-0 w-40 group transition-transform hover:-translate-y-1"
              >
                <Link to={`/events/${event.id}`} className="block space-y-2.5">
                  <div className="relative h-28 rounded-3xl overflow-hidden shadow-lg border-2 border-white">
                    {event.image_url ? (
                      <img 
                        src={event.image_url || undefined} 
                        alt={event.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-gray-300">
                        <Calendar className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-2xl text-[9px] font-black text-primary shadow-lg border border-primary/5">
                      {format(new Date(event.event_date), 'MMM dd')}
                    </div>
                  </div>
                  <div className="px-1">
                    <h3 className="text-[11px] font-black text-gray-800 line-clamp-2 leading-tight group-hover:text-primary transition-colors uppercase tracking-tight">
                      {event.title}
                    </h3>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Announcements */}
        <section className="pb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-900 text-base uppercase tracking-tight">Announcements</h2>
            <Link to="/announcements" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">See All</Link>
          </div>
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="transition-transform hover:translate-x-1"
              >
                <Link 
                  to={`/announcements/${ann.id}`}
                  className="flex gap-4 bg-white p-3 rounded-3xl shadow-md border border-gray-100 hover:border-primary/20 transition-all group"
                >
                  {ann.image_url ? (
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm">
                      <img src={ann.image_url || undefined} alt={ann.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Megaphone className="w-6 h-6 text-primary/20" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="text-[13px] font-black text-gray-900 truncate tracking-tight group-hover:text-primary transition-colors">{ann.title}</h3>
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">{ann.body}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[8px] font-black text-primary/40 uppercase tracking-widest">
                      <Clock className="w-2.5 h-2.5" />
                      {format(new Date(ann.created_at), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      </motion.div>
    </PullToRefresh>
  );
}
