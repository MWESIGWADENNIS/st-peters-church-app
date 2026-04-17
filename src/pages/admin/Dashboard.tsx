import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-hot-toast';
import { 
  LayoutDashboard, 
  BookOpen, 
  Megaphone, 
  Calendar, 
  Users, 
  Radio, 
  Video,
  Settings, 
  ChevronRight,
  Plus,
  ArrowLeft,
  MessageSquare,
  AlertCircle,
  Music,
  Clock,
  MapPin,
  Image as ImageIcon,
  StickyNote,
  Layers,
  TrendingUp,
  Eye,
  CheckCircle2,
  School
} from 'lucide-react';
import { format, subMonths, startOfMonth } from 'date-fns';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Skeleton } from '../../components/Skeleton';
import { cn } from '../../lib/utils';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    members: 0,
    prayers: 0,
    events: 0,
    isLive: false,
    mostViewedSermon: null as any,
    totalRsvps: 0,
    pendingTestimonies: 0,
    pendingMinistries: 0
  });
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingTest, setSendingTest] = useState(false);

  const sendTestNotification = async () => {
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    setSendingTest(true);
    try {
      console.log('[TestNotif] Attempting RPC for user:', user.id);
      
      // 1. Save to database for history
      const { error: rpcError } = await supabase.rpc('notify_user', {
        target_user_id: user.id,
        notif_title: '🔔 Test Notification',
        notif_body: 'This is a test notification to verify that pop-ups and sounds are working correctly.',
        notif_type: 'general'
      });

      if (rpcError) throw rpcError;

      // 2. Direct broadcast for immediate pop-up (bypasses DB delays)
      const channel = supabase.channel('notification-system');
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.send({
            type: 'broadcast',
            event: 'new-notification',
            payload: {
              user_id: user.id,
              title: '🔔 Test Notification',
              body: 'This is a test notification to verify that pop-ups and sounds are working correctly.',
              type: 'general',
              created_at: new Date().toISOString()
            }
          });
          supabase.removeChannel(channel);
        }
      });
      
      toast.success('Test notification sent!');
      
      // 3. Force a local check
      window.dispatchEvent(new CustomEvent('check-notifications'));
    } catch (err: any) {
      console.error('Error sending test notification:', err);
      toast.error(`Database error: ${err.message}`);
    } finally {
      setSendingTest(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [
          { count: members },
          { count: prayers },
          { count: events },
          { data: live },
          { data: mostViewed },
          { count: rsvps },
          { count: pendingTestimonies },
          { count: pendingMinistries },
          { data: growth }
        ] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('prayer_requests').select('*', { count: 'exact', head: true }),
          supabase.from('events').select('*', { count: 'exact', head: true }),
          supabase.from('livestream').select('is_live').maybeSingle(),
          supabase.from('sermons').select('title, views').order('views', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('event_rsvp').select('*', { count: 'exact', head: true }),
          supabase.from('testimonies').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('user_ministries').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.rpc('get_member_growth')
        ]);

        setStats({
          members: members || 0,
          prayers: prayers || 0,
          events: events || 0,
          isLive: live?.is_live || false,
          mostViewedSermon: mostViewed,
          totalRsvps: rsvps || 0,
          pendingTestimonies: pendingTestimonies || 0,
          pendingMinistries: pendingMinistries || 0
        });

        if (growth && growth.length > 0) {
          setGrowthData(growth.map((d: any) => ({
            month: format(new Date(d.month), 'MMM'),
            count: Number(d.count)
          })));
        } else {
          // Fallback data if no growth data exists
          setGrowthData([
            { month: format(subMonths(new Date(), 1), 'MMM'), count: members > 0 ? members - 1 : 0 },
            { month: format(new Date(), 'MMM'), count: members || 0 }
          ]);
        }
      } catch (err) {
        console.error('Error fetching admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const adminModules = [
    { icon: BookOpen, label: 'Daily Bread', path: 'daily-bread', color: 'bg-green-50 text-green-600', subtitle: 'Manage daily devotions and scriptures' },
    { icon: Megaphone, label: 'Announcements', path: 'announcements', color: 'bg-purple-50 text-purple-600', subtitle: 'Post news and updates' },
    { icon: Calendar, label: 'Events', path: 'events', color: 'bg-orange-50 text-orange-600', subtitle: 'Church calendar' },
    { icon: MessageSquare, label: 'Testimonies', path: 'testimonies', color: 'bg-amber-50 text-amber-600', subtitle: 'Member stories' },
    { icon: StickyNote, label: 'Notice Board', path: 'notices', color: 'bg-yellow-50 text-yellow-600' },
    { icon: ImageIcon, label: 'Gallery', path: 'gallery', color: 'bg-emerald-50 text-emerald-600' },
    { icon: Layers, label: 'Sermon Series', path: 'sermon-series', color: 'bg-rose-50 text-rose-600' },
    { icon: Music, label: 'Choir Schedule', path: 'choir-schedule', color: 'bg-indigo-50 text-indigo-600' },
    { icon: Users, label: 'Leadership', path: 'leadership', color: 'bg-blue-50 text-blue-600' },
    { icon: Users, label: 'Ministry Requests', path: 'ministries', color: 'bg-teal-50 text-teal-600' },
    { icon: School, label: 'Schools Ministry', path: 'schools', color: 'bg-cyan-50 text-cyan-600' },
    { icon: MessageSquare, label: 'Prayer Requests', path: 'prayer-requests', color: 'bg-sky-50 text-sky-600' },
    { icon: AlertCircle, label: 'Password Resets', path: 'password-resets', color: 'bg-red-50 text-red-600' },
    { icon: Video, label: 'Sermons', path: 'sermons', color: 'bg-rose-50 text-rose-600' },
    { icon: Clock, label: 'Services', path: 'services', color: 'bg-emerald-50 text-emerald-600' },
    { icon: Settings, label: 'Settings', path: 'settings', color: 'bg-gray-50 text-gray-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/home')} className="p-2 hover:bg-gray-50 rounded-full">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-black text-primary">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={sendTestNotification}
              disabled={sendingTest}
              className="flex items-center gap-2 bg-primary/10 text-primary text-[10px] font-black px-3 py-1.5 rounded-full uppercase hover:bg-primary/20 transition-all disabled:opacity-50"
            >
              {sendingTest ? 'Sending...' : 'Test Notification'}
            </button>
            {stats.isLive && (
              <span className="flex items-center gap-1 bg-red-50 text-red-600 text-[10px] font-black px-2 py-1 rounded-full uppercase animate-pulse">
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full" /> Live
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 rounded-3xl bg-white border border-gray-100 p-5 space-y-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-12" />
              </div>
            ))
          ) : (
            <>
              <div className="bg-blue-600 p-5 rounded-3xl text-white shadow-lg shadow-blue-200">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total Members</p>
                <p className="text-3xl font-black mt-1">{stats.members}</p>
              </div>
              <div className="bg-primary p-5 rounded-3xl text-white shadow-lg shadow-primary/20">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Prayer Requests</p>
                <p className="text-3xl font-black mt-1">{stats.prayers}</p>
              </div>
              <div className="bg-amber-500 p-5 rounded-3xl text-white shadow-lg shadow-amber-200">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Ministries</p>
                <p className="text-3xl font-black mt-1">{stats.pendingMinistries}</p>
              </div>
              <div className="bg-emerald-600 p-5 rounded-3xl text-white shadow-lg shadow-emerald-200">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total RSVPs</p>
                <p className="text-3xl font-black mt-1">{stats.totalRsvps}</p>
              </div>
            </>
          )}
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Member Growth Chart */}
          <div className="md:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Member Growth
              </h3>
            </div>
            <div className="h-64 w-full">
              {loading ? (
                <div className="h-full w-full flex flex-col justify-end gap-2 px-1 pb-4">
                   <div className="flex items-end gap-4 h-full">
                     {[1,2,3,4,5,6].map(i => (
                       <Skeleton key={i} className="flex-1" style={{ height: `${Math.random() * 60 + 20}%` }} />
                     ))}
                   </div>
                   <div className="flex justify-between">
                     {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-2 w-8" />)}
                   </div>
                </div>
              ) : growthData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      labelStyle={{ fontWeight: 900, color: '#111827' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#8B5CF6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorCount)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <TrendingUp className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs font-medium">No growth data available yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Content Card */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Content Insights</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Eye className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Most Viewed Sermon</span>
                </div>
                <p className="font-bold text-gray-900 truncate">{stats.mostViewedSermon?.title || 'N/A'}</p>
                <p className="text-xs text-gray-500">{stats.mostViewedSermon?.views || 0} views</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Active RSVPs</span>
                </div>
                <p className="font-bold text-gray-900">{stats.totalRsvps} Members</p>
                <p className="text-xs text-gray-500">Across all upcoming events</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between ml-2">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Management Tools</h2>
            <div className="h-px flex-1 bg-gray-100 mx-4" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {adminModules.map((module, idx) => (
              <Link
                key={module.label}
                to={module.path}
                className={cn(
                  "bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center gap-4 text-center group hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all relative overflow-hidden",
                  idx === 0 && "md:col-span-2 md:flex-row md:text-left",
                  idx === 1 && "md:row-span-2 md:justify-center"
                )}
              >
                {/* Visual Accent */}
                <div className={cn(
                  "absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.03] group-hover:opacity-[0.07] transition-opacity",
                  module.color.split(' ')[0]
                )} />

                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner flex-shrink-0 relative z-10",
                  module.color
                )}>
                  <module.icon className="w-7 h-7" />
                </div>
                <div className="relative z-10 space-y-1">
                  <span className="text-xs font-black text-gray-900 uppercase tracking-widest block">{module.label}</span>
                  {(module as any).subtitle && (
                    <p className="text-[10px] text-gray-400 font-medium leading-tight group-hover:text-gray-500 transition-colors">
                      {(module as any).subtitle}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
