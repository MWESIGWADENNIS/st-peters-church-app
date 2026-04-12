import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Share2, Megaphone, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function AnnouncementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Add a timeout to the request
        const fetchPromise = supabase
          .from('announcements')
          .select('*')
          .eq('id', id)
          .single();

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 60000)
        );

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
          
        if (error) {
          console.error('Error fetching announcement:', error);
          toast.error('Could not load announcement');
        } else if (data) {
          setAnnouncement(data);
        }
      } catch (err: any) {
        console.error('Unexpected error:', err);
        toast.error(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncement();
  }, [id]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: announcement.title,
          text: announcement.body,
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
        toast.success('Link copied!');
      } catch (err) {
        toast.error('Failed to copy link');
      }
    }
  };

  if (loading) return <div className="p-12 text-center animate-pulse">Loading news...</div>;
  if (!announcement) return <div className="p-12 text-center">Announcement not found.</div>;

  return (
    <div className="min-h-screen bg-white pb-12">
      <div className="p-4 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <button onClick={handleShare} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
          <Share2 className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="p-6 space-y-8">
        {announcement.image_url && (
          <div className="w-full h-72 rounded-3xl overflow-hidden shadow-xl relative group">
            <img 
              src={announcement.image_url} 
              alt={announcement.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
            <Megaphone className="w-3 h-3" /> Announcement
          </div>
          <h1 className="text-3xl font-display font-black text-gray-900 leading-tight">
            {announcement.title}
          </h1>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
            <Calendar className="w-4 h-4" />
            {format(new Date(announcement.created_at), 'MMMM dd, yyyy')}
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">
          {announcement.body}
        </div>

        <div className="pt-8 border-t border-gray-100">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">
            End of Announcement
          </p>
        </div>
      </div>
    </div>
  );
}
