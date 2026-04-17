import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Hymns from './pages/Hymns';
import HymnDetail from './pages/HymnDetail';
import Livestream from './pages/Livestream';
import Sermons from './pages/Sermons';
import SermonDetail from './pages/SermonDetail';
import More from './pages/More';
import PrayerRequests from './pages/PrayerRequests';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Announcements from './pages/Announcements';
import AnnouncementDetail from './pages/AnnouncementDetail';
import About from './pages/About';
import Leadership from './pages/About/Leadership';
import History from './pages/About/History';
import Contact from './pages/About/Contact';
import ServiceTimes from './pages/About/ServiceTimes';
import Ministries from './pages/Ministries';
import MinistryDetail from './pages/MinistryDetail';
import Schools from './pages/Schools';
import DailyBread from './pages/DailyBread';
import DailyBreadDetail from './pages/DailyBreadDetail';
import TodayService from './pages/TodayService';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Videos from './pages/Videos';
import VideoDetail from './pages/VideoDetail';
import Testimonies from './pages/Testimonies';
import Gallery from './pages/Gallery';
import Notices from './pages/Notices';
import SermonSeries from './pages/SermonSeries';
import SermonSeriesDetail from './pages/SermonSeriesDetail';
import ChoirSchedule from './pages/ChoirSchedule';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminSettings from './pages/admin/Settings';
import AdminLivestream from './pages/admin/Livestream';
import AdminDailyBread from './pages/admin/DailyBread';
import AdminAnnouncements from './pages/admin/Announcements';
import AdminEvents from './pages/admin/Events';
import AdminLeadership from './pages/admin/Leadership';
import AdminHymns from './pages/admin/Hymns';
import AdminPrayerRequests from './pages/admin/PrayerRequests';
import AdminSermons from './pages/admin/Sermons';
import AdminServices from './pages/admin/Services';
import AdminMinistries from './pages/admin/Ministries';
import AdminZones from './pages/admin/Zones';
import AdminVideos from './pages/admin/Videos';
import AdminMinistryManagement from './pages/admin/MinistryManagement';
import AdminTestimonies from './pages/admin/Testimonies';
import AdminNotices from './pages/admin/Notices';
import AdminGallery from './pages/admin/Gallery';
import AdminSermonSeries from './pages/admin/SermonSeries';
import AdminChoirSchedule from './pages/admin/ChoirSchedule';
import AdminSchools from './pages/admin/Schools';
import AdminPasswordResets from './pages/admin/PasswordResets';

import { useDataStore } from './store/dataStore';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { NotificationListener } from './components/NotificationListener';
import { NotificationOverlay } from './components/NotificationOverlay';
import { PermissionModal } from './components/PermissionModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineBanner } from './components/OfflineBanner';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const { initialize, loading: authLoading } = useAuthStore();
  const { churchSettings, setChurchSettings } = useDataStore();

  useEffect(() => {
    initialize();
    
    // Fetch church settings
    const fetchSettings = async () => {
      if (!isSupabaseConfigured) return;
      try {
        const { data } = await supabase.from('church_settings').select('*').single();
        if (data) setChurchSettings(data);
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchSettings();

    // Safety timeout to hide splash screen after 8 seconds regardless of auth state
    const timer = setTimeout(() => {
      if (useAuthStore.getState().loading) {
        useAuthStore.setState({ loading: false });
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [initialize, setChurchSettings]);

  useEffect(() => {
    const handleOnline = () => {
      // Trigger silent refresh of critical data
      console.log('App back online, syncing data...');
      // In a real app, you might call specific fetch functions here
      // For now, we rely on the fact that components will re-fetch if needed
      // or the user can pull to refresh.
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-primary">
        <div className="text-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce overflow-hidden shadow-xl">
            {churchSettings?.logo_url ? (
              <img 
                src={churchSettings.logo_url} 
                alt="Logo" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-primary text-3xl font-black">SP</span>
            )}
          </div>
          <div className="animate-pulse text-white font-display text-xl font-black">
            {churchSettings?.church_name || "St. Peter's Church"}
          </div>
          
          {!isSupabaseConfigured && (
            <div className="mt-8 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-xs mx-auto">
              <div className="flex items-center gap-2 text-white mb-2 justify-center">
                <AlertCircle className="w-5 h-5 text-accent" />
                <span className="font-bold text-sm">Configuration Missing</span>
              </div>
              <p className="text-white/70 text-xs leading-relaxed">
                Supabase URL and Key are not set. If you are using the APK, ensure you added the secrets to GitHub before building.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Toaster position="top-center" />
        <OfflineBanner />
        <NotificationListener />
        <NotificationOverlay />
        <PermissionModal />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/hymns" element={<Hymns />} />
              <Route path="/hymns/:id" element={<HymnDetail />} />
              <Route path="/livestream" element={<Livestream />} />
              <Route path="/sermons" element={<Sermons />} />
              <Route path="/sermons/:id" element={<SermonDetail />} />
              <Route path="/more" element={<More />} />
              <Route path="/prayer" element={<PrayerRequests />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/announcements/:id" element={<AnnouncementDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/about/leadership" element={<Leadership />} />
              <Route path="/about/history" element={<History />} />
              <Route path="/about/contact" element={<Contact />} />
              <Route path="/about/service-times" element={<ServiceTimes />} />
              <Route path="/ministries" element={<Ministries />} />
              <Route path="/ministries/:id" element={<MinistryDetail />} />
              <Route path="/schools" element={<Schools />} />
              <Route path="/daily-bread" element={<DailyBread />} />
              <Route path="/daily-bread/:id" element={<DailyBreadDetail />} />
              <Route path="/today-service" element={<TodayService />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/videos/:id" element={<VideoDetail />} />
              <Route path="/testimonies" element={<Testimonies />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/notices" element={<Notices />} />
              <Route path="/sermons/series" element={<SermonSeries />} />
              <Route path="/sermons/series/:id" element={<SermonSeriesDetail />} />
              <Route path="/ministries/choir/schedule" element={<ChoirSchedule />} />
            </Route>
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/livestream" element={<AdminLivestream />} />
            <Route path="/admin/daily-bread" element={<AdminDailyBread />} />
            <Route path="/admin/announcements" element={<AdminAnnouncements />} />
            <Route path="/admin/events" element={<AdminEvents />} />
            <Route path="/admin/leadership" element={<AdminLeadership />} />
            <Route path="/admin/hymns" element={<AdminHymns />} />
            <Route path="/admin/prayer-requests" element={<AdminPrayerRequests />} />
            <Route path="/admin/sermons" element={<AdminSermons />} />
            <Route path="/admin/services" element={<AdminServices />} />
            <Route path="/admin/ministries" element={<AdminMinistries />} />
            <Route path="/admin/zones" element={<AdminZones />} />
            <Route path="/admin/videos" element={<AdminVideos />} />
            <Route path="/admin/ministry-management" element={<AdminMinistryManagement />} />
            <Route path="/admin/testimonies" element={<AdminTestimonies />} />
            <Route path="/admin/notices" element={<AdminNotices />} />
            <Route path="/admin/gallery" element={<AdminGallery />} />
            <Route path="/admin/sermon-series" element={<AdminSermonSeries />} />
            <Route path="/admin/choir-schedule" element={<AdminChoirSchedule />} />
            <Route path="/admin/schools" element={<AdminSchools />} />
            <Route path="/admin/password-resets" element={<AdminPasswordResets />} />
          </Route>

          <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
