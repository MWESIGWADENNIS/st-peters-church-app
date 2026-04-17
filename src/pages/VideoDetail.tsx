import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { 
  ChevronLeft, 
  Play, 
  MessageCircle, 
  Eye, 
  Send, 
  Trash2, 
  User, 
  Calendar, 
  Tag,
  Share2,
  MoreVertical,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
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

// TikTok ID extraction
const getTikTokId = (url: string) => {
  const match = url.match(/video\/(\d+)/) || url.match(/v\/(\d+)/);
  return match ? match[1] : null;
};

// Google Drive ID extraction
const getGoogleDriveId = (url: string) => {
  const match = url.match(/\/d\/([-\w]{25,})/) || url.match(/id=([-\w]{25,})/);
  return match ? match[1] : null;
};

export default function VideoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [video, setVideo] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasIncrementedView, setHasIncrementedView] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbError, setThumbError] = useState(false);
  const commentEndRef = useRef<HTMLDivElement>(null);

  const youtubeId = video?.youtube_url ? getYoutubeId(video.youtube_url) : null;
  const tiktokId = video?.youtube_url ? getTikTokId(video.youtube_url) : null;
  const googleDriveId = video?.youtube_url ? getGoogleDriveId(video.youtube_url) : null;
  const directUrl = video?.video_url && isDirectVideo(video.video_url) ? video.video_url : null;

  useEffect(() => {
    if (id) {
      fetchVideo();
      fetchComments();
      const cleanup = subscribeToComments();
      return () => {
        cleanup();
      };
    }
  }, [id]);

  const fetchVideo = async () => {
    try {
      const { data, error } = await supabase
        .from('church_videos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setVideo(data);
    } catch (error: any) {
      toast.error('Failed to load video');
      navigate('/gallery');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from('video_comments')
      .select('*')
      .eq('video_id', id)
      .order('created_at', { ascending: true });
    if (data) setComments(data);
  };

  const subscribeToComments = () => {
    const channel = supabase
      .channel(`video_comments:${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'video_comments', filter: `video_id=eq.${id}` },
        () => fetchComments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleStart = async () => {
    if (!hasIncrementedView && id) {
      setHasIncrementedView(true);
      try {
        await supabase.rpc('increment_video_views', { video_id: id });
        setVideo((prev: any) => ({ ...prev, views: (prev?.views || 0) + 1 }));
      } catch (e) {
        console.error('Failed to increment views:', e);
      }
    }
  };

  const startVideo = () => {
    setIsPlaying(true);
    handleStart();
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('video_comments').insert({
        video_id: id,
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Member',
        user_photo: user.user_metadata?.avatar_url,
        comment: commentText.trim()
      });

      if (error) throw error;
      setCommentText('');
      toast.success('Comment posted!');
      
      // Manual refresh as fallback for Realtime
      fetchComments();
      
      setTimeout(() => {
        commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase.from('video_comments').delete().eq('id', commentId);
      if (error) throw error;
      toast.success('Comment deleted');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: video.description,
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
        toast.success('Link copied to clipboard');
      } catch (err) {
        toast.error('Failed to copy link');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!video) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white pb-48"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between sticky top-0 bg-white z-20 border-b border-gray-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-black text-primary truncate max-w-[200px]">
            {video.title}
          </h1>
        </div>
        <button onClick={handleShare} className="p-2 hover:bg-gray-50 rounded-full text-gray-400">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className={cn(
        "relative bg-black w-full shadow-2xl overflow-hidden mx-auto transition-all duration-500",
        tiktokId 
          ? "aspect-[9/16] max-w-[320px] rounded-[3rem] border-[12px] border-gray-900 my-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]" 
          : googleDriveId && video?.youtube_url?.includes('drive.google.com')
            ? "aspect-video"
            : "aspect-video"
      )}>
        {!isPlaying ? (
          <div 
            className="absolute inset-0 cursor-pointer group"
            onClick={startVideo}
          >
            {video.thumbnail_url && !thumbError ? (
              <img 
                src={video.thumbnail_url} 
                alt={video.title}
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
                onError={() => setThumbError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                <Play className="w-12 h-12 text-white/10" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-primary/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20 group-hover:scale-110 transition-transform duration-300">
                <Play className="w-10 h-10 text-white fill-white ml-1" />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full">
            {youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                title={video.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : tiktokId ? (
              <iframe
                src={`https://www.tiktok.com/embed/${tiktokId}`}
                title={video.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : googleDriveId && video?.youtube_url?.includes('drive.google.com') ? (
              <iframe
                src={`https://drive.google.com/file/d/${googleDriveId}/preview`}
                title={video.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : directUrl ? (
              <video
                src={directUrl}
                className="w-full h-full"
                controls
                autoPlay
                playsInline
                poster={video.thumbnail_url}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white p-6 text-center">
                <Info className="w-12 h-12 text-gray-500 mb-4" />
                <p className="font-bold">Format not supported or link broken</p>
                <p className="text-xs text-gray-400 mt-2">Please check the video URL in the dashboard</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
              {video.category}
            </span>
            <div className="flex items-center gap-1 text-gray-400 text-[10px] font-bold">
              <Calendar className="w-3 h-3" />
              {format(new Date(video.recorded_date), 'MMMM dd, yyyy')}
            </div>
          </div>
          <h2 className="text-2xl font-black text-gray-900 leading-tight">
            {video.title}
          </h2>
          <div className="flex items-center gap-4 text-gray-500 font-bold text-xs">
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {video.views || 0} views
            </div>
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" />
              {comments.length} comments
            </div>
          </div>
        </div>

        {video.description && (
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <p className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
              {video.description}
            </p>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="px-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            Comments
            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {comments.length}
            </span>
          </h3>
          <button 
            onClick={fetchComments}
            className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 px-2 py-1 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        <div className="space-y-6">
          {comments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
              <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-bold text-sm">No comments yet. Be the first!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-4 group">
                <div className="w-10 h-10 rounded-full bg-lavender flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                  {comment.user_photo ? (
                    <img src={comment.user_photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-gray-900">{comment.user_name}</span>
                      <span className="text-[10px] font-bold text-gray-400">
                        {format(new Date(comment.created_at), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    {(user?.id === comment.user_id || user?.email === 'dmwesigwa200@gmail.com') && (
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 font-medium leading-relaxed">
                    {comment.comment}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={commentEndRef} />
        </div>
      </div>

      {/* Comment Input */}
      <div className="fixed bottom-[72px] left-0 right-0 p-4 bg-white border-t border-gray-100 z-[60] shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <form onSubmit={handlePostComment} className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={user ? "Write a comment..." : "Sign in to comment"}
            disabled={!user || submitting}
            className="flex-1 px-5 py-3.5 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none font-medium text-sm"
          />
          <button
            type="submit"
            disabled={!user || submitting || !commentText.trim()}
            className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 disabled:opacity-50 transition-all active:scale-95"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
