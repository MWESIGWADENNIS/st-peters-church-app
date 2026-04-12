import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { ChevronLeft, User, Clock, MapPin, Heart, Youtube, Play } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export default function MinistryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [ministry, setMinistry] = useState<any>(null);
  const [choirVideos, setChoirVideos] = useState<any[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchPromise = supabase.from('ministries').select('*').eq('id', id).single();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 60000)
        );

        const { data: mData, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
        
        if (error) throw error;
        
        if (mData) {
        setMinistry(mData);
        
        // If choir, fetch videos
        if (mData.name.toLowerCase().includes('choir')) {
          const { data: vData } = await supabase.from('choir_videos').select('*').order('recorded_date', { ascending: false });
          if (vData) setChoirVideos(vData);
        }

        // Check if user is already a member
        if (user) {
          const { data: joinData } = await supabase
            .from('user_ministries')
            .select('*')
            .eq('user_id', user.id)
            .eq('ministry_id', id)
            .single();
          setIsJoined(!!joinData);
        }
        }
      } catch (err) {
        console.error('Error fetching ministry detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const handleJoin = async () => {
    if (!user) return;
    setJoining(true);
    try {
      if (isJoined) {
        await supabase.from('user_ministries').delete().eq('user_id', user.id).eq('ministry_id', id);
        setIsJoined(false);
        toast.success('You have left the ministry.');
      } else {
        await supabase.from('user_ministries').insert({ user_id: user.id, ministry_id: id });
        setIsJoined(true);
        toast.success(`Welcome to the ${ministry.name}!`);
      }
    } catch (error) {
      toast.error('Failed to update membership.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <div className="p-12 text-center animate-pulse">Loading ministry...</div>;
  if (!ministry) return <div className="p-12 text-center">Ministry not found.</div>;

  return (
    <div className="min-h-screen bg-white pb-12">
      {/* Hero */}
      <div className="relative h-64">
        {ministry.photo_url ? (
          <img src={ministry.photo_url} alt={ministry.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-primary" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-3xl font-display font-black text-white leading-tight">{ministry.name}</h1>
          <p className="text-white/80 text-sm font-bold uppercase tracking-widest mt-1">
            Led by {ministry.leader_name || 'Church Minister'}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-2xl space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <Clock className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Schedule</span>
            </div>
            <p className="text-sm font-bold text-gray-800">{ministry.practice_day || 'Weekly'}</p>
            <p className="text-xs text-gray-500">{ministry.practice_time || 'TBA'}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <MapPin className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Venue</span>
            </div>
            <p className="text-sm font-bold text-gray-800">{ministry.practice_venue || 'Church Hall'}</p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4">
          <h2 className="font-bold text-gray-900 text-lg">About the Ministry</h2>
          <p className="text-gray-600 leading-relaxed text-sm">
            {ministry.description || 'No description available for this ministry.'}
          </p>
          {ministry.encourage_text && (
            <div className="p-5 bg-lavender rounded-2xl border-l-4 border-primary italic text-sm text-primary font-medium">
              "{ministry.encourage_text}"
            </div>
          )}
        </div>

        {/* Join Button */}
        <button
          onClick={handleJoin}
          disabled={joining}
          className={`w-full py-4 rounded-xl font-black shadow-lg transition-all flex items-center justify-center gap-2 ${
            isJoined 
              ? 'bg-gray-100 text-gray-500' 
              : 'bg-primary text-white hover:bg-opacity-90'
          }`}
        >
          {joining ? (
            <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Heart className={`w-5 h-5 ${isJoined ? 'fill-gray-500' : ''}`} />
              {isJoined ? 'Member of Ministry' : 'Join This Ministry'}
            </>
          )}
        </button>

        {/* Choir Videos */}
        {choirVideos.length > 0 && (
          <div className="space-y-4 pt-4">
            <h2 className="font-bold text-gray-900 text-lg">Choir Performances</h2>
            <div className="space-y-4">
              {choirVideos.map((video) => (
                <a 
                  key={video.id}
                  href={video.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-4 p-3 bg-gray-50 rounded-2xl group"
                >
                  <div className="w-24 h-16 bg-gray-200 rounded-lg overflow-hidden relative flex-shrink-0">
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                      <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <h4 className="text-sm font-bold text-gray-800 line-clamp-1">{video.title}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">
                      Recorded {format(new Date(video.recorded_date), 'MMM yyyy')}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
