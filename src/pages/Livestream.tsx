import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Radio, Youtube, Clock, ExternalLink, Play, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

// Robust YouTube ID extraction
const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length >= 11) ? match[2].substring(0, 11) : null;
};

// Check if it's a direct file (mp4, etc.)
const isDirectVideo = (url: string) => {
  return url.toLowerCase().match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i);
};

export default function Livestream() {
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const youtubeId = liveData?.youtube_url ? getYoutubeId(liveData.youtube_url) : null;
  const directUrl = liveData?.youtube_url && isDirectVideo(liveData.youtube_url) ? liveData.youtube_url : null;

  useEffect(() => {
    const fetchLiveStatus = async () => {
      try {
        const fetchPromise = supabase.from('livestream').select('*').single();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 60000)
        );

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
        
        if (error) throw error;
        if (data) setLiveData(data);
      } catch (err) {
        console.error('Error fetching live status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveStatus();

    const subscription = supabase
      .channel('livestream_realtime')
      .on('postgres_changes' as any, { event: 'UPDATE', schema: 'public', table: 'livestream' }, (payload: any) => {
        setLiveData(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  if (loading) return <div className="p-12 text-center animate-pulse">Checking live status...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-[calc(100vh-140px)] flex flex-col"
    >
      {liveData?.is_live ? (
        <div className="flex-1 flex flex-col">
          <div className="aspect-video bg-black w-full relative overflow-hidden">
            {!isPlaying ? (
              <div 
                className="absolute inset-0 cursor-pointer group z-10"
                onClick={() => setIsPlaying(true)}
              >
                <div className="w-full h-full bg-gradient-to-br from-red-900/20 to-black flex items-center justify-center">
                  <Play className="w-12 h-12 text-white/10" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-red-600/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20 group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-10 h-10 text-white fill-white ml-1" />
                  </div>
                </div>
              </div>
            ) : null}

            {youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${isPlaying ? 1 : 0}&rel=0&modestbranding=1`}
                title={liveData.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : directUrl ? (
              <video
                src={directUrl}
                className="w-full h-full"
                controls
                autoPlay={isPlaying}
                playsInline
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white p-6 text-center">
                <Info className="w-12 h-12 text-gray-500 mb-4" />
                <p className="font-bold">Livestream link broken or format not supported</p>
              </div>
            )}
            
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse z-20">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
              Live Now
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <h1 className="text-2xl font-display font-black text-gray-900 leading-tight">
              {liveData.title || 'Sunday Service Livestream'}
            </h1>
            <div className="p-4 bg-lavender rounded-2xl border border-primary/5">
              <p className="text-sm text-primary font-medium leading-relaxed">
                "Welcome to our online service! Feel free to share your prayer requests in the chat and join us in worship from wherever you are."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                <Youtube className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Streaming on</p>
                <p className="text-sm font-bold text-gray-800">YouTube Live</p>
              </div>
              <a 
                href={liveData.youtube_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-primary transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center relative">
            <Radio className="w-12 h-12 text-gray-300" />
            <div className="absolute top-0 right-0 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-black text-gray-900">Offline</h2>
            <p className="text-gray-500 max-w-[240px] mx-auto text-sm">
              We are not live at the moment. Join us for our next scheduled service.
            </p>
          </div>

          <div className="w-full max-w-xs bg-gray-50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-tighter">
              <span>Next Service</span>
              <Clock className="w-3 h-3" />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-800">Sunday Main Service</p>
              <p className="text-xs text-primary font-bold">Sunday, 9:00 AM</p>
            </div>
          </div>

          <button 
            onClick={() => window.open('https://youtube.com/@stpeterschurchug', '_blank')}
            className="w-full max-w-xs py-4 bg-white border-2 border-gray-100 rounded-xl font-bold text-gray-600 flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
          >
            <Youtube className="w-5 h-5 text-red-600" />
            Visit YouTube Channel
          </button>
        </div>
      )}
    </motion.div>
  );
}
