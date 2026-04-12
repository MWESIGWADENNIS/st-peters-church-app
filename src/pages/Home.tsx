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
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { getTodayServices, getSundayTheme } from '../lib/churchSchedule';

import { useDataStore } from '../store/dataStore';

export default function Home() {
  const navigate = useNavigate();
  const { 
    announcements: cachedAnnouncements, 
    events: cachedEvents, 
    dailyBread: cachedDailyBread,
    setAnnouncements,
    setEvents,
    setDailyBread,
    isCacheValid
  } = useDataStore();

  const [banners, setBanners] = useState<any[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [dailyBread, setLocalDailyBread] = useState<any>(cachedDailyBread);
  const [upcomingEvents, setLocalUpcomingEvents] = useState<any[]>(cachedEvents);
  const [announcements, setLocalAnnouncements] = useState<any[]>(cachedAnnouncements);
  const [recentVideos, setRecentVideos] = useState<any[]>([]);

  const [loading, setLoading] = useState(!isCacheValid('home'));

  const fetchData = async (force = false) => {
    // If cache is valid, we still fetch in background to refresh, but don't show loading
    const cacheValid = isCacheValid('home');
    if (!cacheValid || force) setLoading(true);

    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const dayName = format(new Date(), 'EEEE');

      // Parallelize all requests
      const requests = [
        supabase.from('services').select('id, name, start_time').eq('day_of_week', dayName).order('start_time', { ascending: true }),
        supabase.from('daily_bread').select('id, title, bible_verse, devotion_body, devotion_date').eq('devotion_date', todayStr).maybeSingle(),
        // Fetch events from today onwards
        supabase.from('events').select('id, title, image_url, event_date, start_time').gte('event_date', todayStr).order('event_date', { ascending: true }).limit(10),
        supabase.from('announcements').select('id, title, body, image_url, is_pinned, created_at').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(4),
        supabase.from('church_videos').select('id, title, youtube_url, video_url, thumbnail_url, category, recorded_date').order('recorded_date', { ascending: false }).limit(4)
      ];

      const results = await Promise.allSettled(requests);
      
      const [
        todayServicesResult,
        dailyBreadResult,
        eventsResult,
        announcementsResult,
        videosResult
      ] = results;

      const todayServicesData = todayServicesResult.status === 'fulfilled' ? (todayServicesResult.value.data as any[]) : null;
      const dbData = dailyBreadResult.status === 'fulfilled' ? dailyBreadResult.value.data : null;
      const allEvents = eventsResult.status === 'fulfilled' ? (eventsResult.value.data as any[]) : [];
      const allAnnouncements = announcementsResult.status === 'fulfilled' ? (announcementsResult.value.data as any[]) : [];
      const recVideos = videosResult.status === 'fulfilled' ? (videosResult.value.data as any[]) : null;

      // Filter data
      const todayEvent = allEvents?.find(e => e.event_date === todayStr);
      
      // Upcoming events: Today (if not past) or future
      const upEvents = allEvents?.filter(e => {
        const eventDate = new Date(e.event_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // If it's a future date, it's upcoming
        if (eventDate > today) return true;
        
        // If it's today, check if it's still upcoming (we'll give it a 4 hour window if no end time)
        if (e.event_date === todayStr) {
          return true; // Keep today's events visible all day
        }
        
        return false;
      }).slice(0, 5);
      const pinnedAnnouncement = allAnnouncements?.find(a => a.is_pinned);
      const recAnn = allAnnouncements?.slice(0, 3);

        // Construct Banners
        const newBanners = [];
        const sundayTheme = getSundayTheme(new Date());

        if (todayServicesData && todayServicesData.length > 0) {
          const mainService = todayServicesData[0];
          newBanners.push({
            type: 'service',
            title: sundayTheme ? `Today: ${sundayTheme}` : "Today's Service",
            subtitle: mainService.name,
            time: mainService.start_time.slice(0, 5),
            icon: Clock,
            color: 'bg-primary',
            path: '/today-service'
          });
        }

        if (pinnedAnnouncement) {
          newBanners.push({
            type: 'announcement',
            title: 'Pinned Announcement',
            subtitle: pinnedAnnouncement.title,
            image: pinnedAnnouncement.image_url,
            badge: '📌 Pinned',
            path: `/announcements/${pinnedAnnouncement.id}`
          });
        }

        if (todayEvent) {
          newBanners.push({
            type: 'event',
            title: "Today's Event",
            subtitle: todayEvent.title,
            image: todayEvent.image_url,
            badge: 'Today',
            path: `/events/${todayEvent.id}`
          });
        }

        newBanners.push({
          type: 'verse',
          title: 'Daily Encouragement',
          subtitle: '"For I know the plans I have for you," declares the Lord...',
          reference: 'Jeremiah 29:11',
          color: 'bg-gradient-to-br from-primary to-accent'
        });

        setBanners(newBanners);
        
        // Update Store
        setDailyBread(dbData);
        setEvents(upEvents || []);
        setAnnouncements(recAnn || []);
        
        // Update Local State
        setLocalDailyBread(dbData);
        setLocalUpcomingEvents(upEvents || []);
        setLocalAnnouncements(recAnn || []);
        setRecentVideos(recVideos || []);
        
        // Mark home cache as valid
        useDataStore.setState((state) => ({ 
          lastFetched: { ...state.lastFetched, home: Date.now() } 
        }));

      } catch (error: any) {
        console.error('Error fetching home data:', error);
        toast.error('Failed to refresh some data. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % (banners.length || 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [banners]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-6"
    >
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-black text-primary">Welcome Home</h1>
        <button 
          onClick={() => fetchData(true)} 
          disabled={loading}
          className="p-2 text-gray-400 hover:text-primary transition-colors disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
        </button>
      </div>

      {/* Rotating Banner */}
      <div className="relative h-48 rounded-2xl overflow-hidden shadow-lg bg-gray-100">
        {loading ? (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex flex-col justify-center p-6">
            <div className="h-4 w-24 bg-gray-300 rounded mb-2" />
            <div className="h-8 w-48 bg-gray-300 rounded" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBanner}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0"
            >
              <Link 
                to={banners[currentBanner]?.path || '#'} 
                className="block h-full w-full relative group"
              >
                {banners[currentBanner]?.image ? (
                  <div className="relative h-full w-full">
                    <img 
                      src={banners[currentBanner].image} 
                      alt={banners[currentBanner].title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="eager"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
                      {banners[currentBanner].badge && (
                        <span className="bg-accent text-white text-[10px] font-black px-2.5 py-1 rounded-full w-fit mb-2 uppercase tracking-wider shadow-sm">
                          {banners[currentBanner].badge}
                        </span>
                      )}
                      <h3 className="text-white font-display font-black text-xl leading-tight drop-shadow-md">
                        {banners[currentBanner].subtitle}
                      </h3>
                      <div className="flex items-center gap-1 text-white/80 text-[10px] font-bold mt-2 uppercase tracking-widest">
                        Tap to read more <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`h-full w-full ${banners[currentBanner]?.color || 'bg-primary'} p-6 flex flex-col justify-center text-white relative`}>
                    <div className="absolute top-4 right-4 opacity-10">
                      {(() => {
                        const Icon = banners[currentBanner]?.icon;
                        return Icon ? <Icon className="w-20 h-20" /> : null;
                      })()}
                    </div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-1">
                      {banners[currentBanner]?.title}
                    </p>
                    <h3 className="text-2xl font-display font-black leading-tight mb-2">
                      {banners[currentBanner]?.subtitle}
                    </h3>
                    {banners[currentBanner]?.reference && (
                      <p className="text-sm font-bold text-accent italic">
                        — {banners[currentBanner].reference}
                      </p>
                    )}
                    {banners[currentBanner]?.time && (
                      <div className="flex items-center gap-2 text-sm font-bold opacity-90 mt-2">
                        <Clock className="w-4 h-4" /> {banners[currentBanner].time}
                      </div>
                    )}
                  </div>
                )}
              </Link>
            </motion.div>
          </AnimatePresence>
        )}
        
        {/* Banner Indicators */}
        {!loading && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all ${currentBanner === i ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Daily Bread Card */}
      <section className="bg-lavender rounded-2xl p-5 shadow-sm border border-primary/5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-primary flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> Daily Bread
          </h2>
          <span className="text-xs font-medium text-gray-500">
            {format(new Date(), 'MMM dd, yyyy')}
          </span>
        </div>
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-6 bg-primary/10 rounded w-3/4" />
            <div className="h-4 bg-primary/5 rounded w-1/2" />
            <div className="h-16 bg-primary/5 rounded w-full" />
          </div>
        ) : dailyBread ? (
          <div className="space-y-2">
            <h3 className="font-display font-bold text-lg">{dailyBread.title}</h3>
            <p className="text-accent text-sm font-bold italic">{dailyBread.bible_verse}</p>
            <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
              {dailyBread.devotion_body}
            </p>
            <Link 
              to={`/daily-bread/${dailyBread.id}`}
              className="inline-flex items-center text-primary text-sm font-bold mt-2"
            >
              Read More <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-gray-500 italic text-sm">"The Lord is my shepherd; I shall not want."</p>
            <p className="text-xs text-primary font-bold mt-1">— Psalm 23:1</p>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: MessageSquare, label: 'Prayer', path: '/prayer', color: 'bg-blue-50 text-blue-600' },
          { icon: Calendar, label: 'Events', path: '/events', color: 'bg-orange-50 text-orange-600' },
          { icon: Megaphone, label: 'News', path: '/announcements', color: 'bg-purple-50 text-purple-600' },
          { icon: Info, label: 'About', path: '/about', color: 'bg-green-50 text-green-600' },
        ].map((action) => (
          <Link key={action.label} to={action.path} className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 ${action.color} rounded-2xl flex items-center justify-center shadow-sm`}>
              <action.icon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Upcoming Events */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Upcoming Events</h2>
          <Link to="/events" className="text-xs font-bold text-primary">See All</Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-40 h-32 bg-gray-100 rounded-xl animate-pulse" />
            ))
          ) : upcomingEvents.length > 0 ? upcomingEvents.map((event) => (
            <Link 
              key={event.id} 
              to={`/events/${event.id}`}
              className="flex-shrink-0 w-40 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="h-24 bg-gray-100 relative">
                {event.image_url ? (
                  <img 
                    src={event.image_url} 
                    alt={event.title} 
                    className="w-full h-full object-cover" 
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Calendar className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold text-primary">
                  {format(new Date(event.event_date), 'MMM dd')}
                </div>
              </div>
              <div className="p-3">
                <h3 className="text-xs font-bold text-gray-800 line-clamp-2">{event.title}</h3>
              </div>
            </Link>
          )) : (
            <div className="w-full py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-xs text-gray-400">No upcoming events scheduled.</p>
            </div>
          )}
        </div>
      </section>

      {/* Church Gallery */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Church Gallery</h2>
          <Link to="/gallery" className="text-xs font-bold text-primary">See All</Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {loading ? (
            Array(2).fill(0).map((_, i) => (
              <div key={i} className="aspect-video bg-gray-100 rounded-2xl animate-pulse" />
            ))
          ) : recentVideos.length > 0 ? recentVideos.map((video) => (
            <button 
              key={video.id}
              onClick={() => navigate(`/gallery/${video.id}`)}
              className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-sm group text-left w-full"
            >
              {video.thumbnail_url ? (
                <img 
                  src={video.thumbnail_url} 
                  alt={video.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="absolute inset-0 bg-gray-800" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                <Play className="w-8 h-8 text-white fill-white opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-[9px] font-black text-white truncate uppercase tracking-tighter">{video.title}</p>
              </div>
              <div className="absolute top-2 left-2 flex items-center gap-1">
                <span className="px-1.5 py-0.5 bg-primary text-white text-[7px] font-black uppercase rounded">
                  {video.category}
                </span>
                <span className="px-1.5 py-0.5 bg-black/40 backdrop-blur-sm text-white text-[7px] font-black uppercase rounded flex items-center gap-0.5">
                  <Eye className="w-2 h-2" /> {video.views || 0}
                </span>
              </div>
            </button>
          )) : (
            <div className="col-span-2 py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-xs text-gray-400">No videos available.</p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Announcements */}
      <section className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Announcements</h2>
          <Link to="/announcements" className="text-xs font-bold text-primary">See All</Link>
        </div>
        <div className="space-y-3">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))
          ) : announcements.map((ann) => (
            <Link 
              key={ann.id} 
              to={`/announcements/${ann.id}`}
              className="flex gap-4 bg-white p-3 rounded-xl shadow-sm border border-gray-100"
            >
              {ann.image_url && (
                <img 
                  src={ann.image_url} 
                  alt={ann.title} 
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0" 
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {ann.is_pinned && <span className="text-accent">📌</span>}
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    {format(new Date(ann.created_at), 'MMM dd, yyyy')}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-800 truncate">{ann.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{ann.body}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
