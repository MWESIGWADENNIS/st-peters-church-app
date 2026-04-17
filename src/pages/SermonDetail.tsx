import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Share2, User, Calendar, BookOpen, Eye, RotateCcw, RotateCw, Maximize, Play, MessageCircle, Layers } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion } from 'motion/react';

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

// Google Drive ID extraction
const getGoogleDriveId = (url: string) => {
  const match = url.match(/\/d\/([-\w]{25,})/) || url.match(/id=([-\w]{25,})/);
  return match ? match[1] : null;
};

export default function SermonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sermon, setSermon] = useState<any>(null);
  const [relatedSermons, setRelatedSermons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = React.useRef<any>(null);

  const playerContainerRef = React.useRef<HTMLDivElement>(null);

  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = getYoutubeId(sermon?.youtube_url || sermon?.media_url || '');
  const googleDriveId = getGoogleDriveId(sermon?.youtube_url || sermon?.media_url || '');
  const directUrl = sermon?.media_url && isDirectVideo(sermon.media_url) ? sermon.media_url : null;

  const handleSkip = (seconds: number) => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(currentTime + seconds);
    }
  };

  const toggleFullScreen = () => {
    if (playerContainerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        playerContainerRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
      }
    }
  };

  useEffect(() => {
    const fetchSermon = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const fetchPromise = supabase
          .from('sermons')
          .select('*, sermon_series(id, title)')
          .eq('id', id)
          .single();

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 60000)
        );

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
        
        if (error) {
          console.error('Error fetching sermon:', error);
          toast.error('Could not load sermon');
        } else if (data) {
          setSermon(data);
          // Increment views
          const currentViews = typeof data.views === 'number' && !isNaN(data.views) ? data.views : 0;
          await supabase.from('sermons').update({ views: currentViews + 1 }).eq('id', id);

          // Fetch related sermons (same series or recent)
          let relatedQuery = supabase
            .from('sermons')
            .select('*, sermon_series(title)')
            .neq('id', id)
            .order('sermon_date', { ascending: false })
            .limit(5);

          if (data.series_id) {
            relatedQuery = relatedQuery.eq('series_id', data.series_id);
          }

          const { data: relatedData } = await relatedQuery;
          if (relatedData) setRelatedSermons(relatedData);
        }
      } catch (err: any) {
        console.error('Unexpected error:', err);
        toast.error(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchSermon();
  }, [id]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: sermon.title,
          text: `Listen to this sermon: ${sermon.title} by ${sermon.preacher || 'Church Minister'}`,
          url: window.location.href,
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Share error:', error);
          toast.error('Could not share content');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy link');
      }
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`*Sermon: ${sermon.title}*\n\nPreached by: ${sermon.preacher || 'Church Minister'}\n\nWatch/Listen here: ${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (loading) return <div className="p-12 text-center animate-pulse">Loading sermon...</div>;
  if (!sermon) return <div className="p-12 text-center">Sermon not found.</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white pb-12"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex items-center gap-1">
          <button onClick={handleWhatsAppShare} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-full transition-colors">
            <MessageCircle className="w-5 h-5 fill-emerald-500" />
          </button>
          <button onClick={handleShare} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Media Player */}
      <div ref={playerContainerRef} className="aspect-video bg-black w-full relative group overflow-hidden shadow-2xl">
        {!isPlaying && (youtubeId || directUrl || googleDriveId) ? (
          <div 
            className="absolute inset-0 cursor-pointer group z-10"
            onClick={() => setIsPlaying(true)}
          >
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-black flex items-center justify-center">
              <Play className="w-12 h-12 text-white/20" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-primary/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20 group-hover:scale-110 transition-transform duration-300">
                <Play className="w-10 h-10 text-white fill-white ml-1" />
              </div>
            </div>
          </div>
        ) : null}

        {youtubeId ? (
          <div className="w-full h-full relative">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?modestbranding=1&rel=0&showinfo=0&autoplay=${isPlaying ? 1 : 0}`}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title={sermon.title}
            ></iframe>
          </div>
        ) : googleDriveId ? (
          <div className="w-full h-full relative">
            <iframe
              src={`https://drive.google.com/file/d/${googleDriveId}/preview`}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={sermon.title}
            ></iframe>
          </div>
        ) : directUrl ? (
          <video
            src={directUrl}
            className="w-full h-full"
            controls
            autoPlay={isPlaying}
            playsInline
          />
        ) : sermon.audio_url ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary to-primary/80 relative">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm shadow-xl">
              <User className="w-10 h-10 text-white" />
            </div>
            
            <div className="w-full max-w-xs space-y-6">
              <audio 
                src={sermon.audio_url} 
                controls 
                className="w-full h-10 rounded-full shadow-lg"
              />
              
              <div className="flex justify-center gap-8">
                <button 
                  onClick={() => {
                    const audio = document.querySelector('audio');
                    if (audio) audio.currentTime -= 10;
                  }}
                  className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors"
                >
                  <RotateCcw className="w-6 h-6" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">-10s</span>
                </button>
                <button 
                  onClick={() => {
                    const audio = document.querySelector('audio');
                    if (audio) audio.currentTime += 10;
                  }}
                  className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors"
                >
                  <RotateCw className="w-6 h-6" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">+10s</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            No media available
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-tighter">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(sermon.sermon_date), 'MMM dd, yyyy')}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {sermon.views} Views</span>
          </div>
          <h1 className="text-2xl font-display font-black text-gray-900 leading-tight">
            {sermon.title}
          </h1>
          <div className="flex flex-wrap gap-2">
            {sermon.bible_reference && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-lavender text-primary rounded-lg text-sm font-bold">
                <BookOpen className="w-4 h-4" /> {sermon.bible_reference}
              </div>
            )}
            {sermon.sermon_series && (
              <button 
                onClick={() => navigate(`/sermons/series/${sermon.sermon_series.id}`)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-sm font-bold"
              >
                <Layers className="w-4 h-4" /> {sermon.sermon_series.title}
              </button>
            )}
          </div>
        </div>

        {/* Preacher Info */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-primary/10">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{sermon.preacher || 'Church Minister'}</h3>
            <p className="text-xs text-gray-500 font-medium">Minister</p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-3">
          <h2 className="font-bold text-gray-900">About this Sermon</h2>
          <p className="text-gray-600 leading-relaxed text-sm">
            {sermon.description || 'No description provided for this sermon.'}
          </p>
        </div>

        {/* Related Sermons */}
        {relatedSermons.length > 0 && (
          <div className="pt-6 space-y-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-gray-900 uppercase text-xs tracking-widest">
                {sermon.series_id ? 'More from this Series' : 'Recent Sermons'}
              </h2>
            </div>
            <div className="space-y-3">
              {relatedSermons.map((related) => (
                <button
                  key={related.id}
                  onClick={() => {
                    navigate(`/sermons/${related.id}`);
                    window.scrollTo(0, 0);
                  }}
                  className="w-full flex gap-3 p-2 bg-gray-50 rounded-2xl border border-transparent hover:border-primary/10 transition-all text-left group"
                >
                  <div className="w-24 aspect-video bg-gray-200 rounded-xl overflow-hidden flex-shrink-0 relative">
                    <img 
                      src={related.thumbnail_url || `https://picsum.photos/seed/${related.id}/200/120`}
                      alt={related.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <h3 className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                      {related.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                      <span>{format(new Date(related.sermon_date), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <button 
          onClick={() => navigate('/sermons')}
          className="w-full py-4 border-2 border-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-all"
        >
          Back to Sermons
        </button>
      </div>
    </motion.div>
  );
}
