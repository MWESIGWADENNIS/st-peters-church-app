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

import { useDataStore } from './store/dataStore';
import { supabase } from './lib/supabase';
import { NotificationListener } from './components/NotificationListener';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const { initialize, loading: authLoading } = useAuthStore();
  const { churchSettings, setChurchSettings } = useDataStore();

  useEffect(() => {
    initialize();
    
    // Fetch church settings
    const fetchSettings = async () => {
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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-primary">
        <div className="text-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce overflow-hidden shadow-xl">
            {churchSettings?.logo_url ? (
              <img src={churchSettings.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary text-3xl font-black">SP</span>
            )}
          </div>
          <div className="animate-pulse text-white font-display text-xl font-black">
            {churchSettings?.church_name || "St. Peter's Church"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Toaster position="top-center" />
        <NotificationListener />
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
              <Route path="/gallery" element={<Videos />} />
              <Route path="/gallery/:id" element={<VideoDetail />} />
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
          </Route>

          <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
