import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Calendar, Clock, MapPin, Share2, Info, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const fetchPromise = supabase.from('events').select('*').eq('id', id).single();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 60000)
        );

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

        if (error) {
          console.error('Error fetching event:', error);
          toast.error('Could not load event');
        } else if (data) {
          setEvent(data);
        }
      } catch (err: any) {
        console.error('Unexpected error:', err);
        toast.error(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
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

  if (loading) return <div className="p-12 text-center animate-pulse">Loading event...</div>;
  if (!event) return <div className="p-12 text-center">Event not found.</div>;

  return (
    <div className="min-h-screen bg-white pb-12">
      <div className="relative h-72">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-primary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={handleShare}
          className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white"
        >
          <Share2 className="w-5 h-5" />
        </button>
        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <span className="px-3 py-1 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
            {event.category || 'General'}
          </span>
          <h1 className="text-3xl font-display font-black text-white leading-tight">{event.title}</h1>
        </div>
      </div>

      <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</p>
              <p className="font-bold text-gray-800">{format(new Date(event.event_date), 'EEEE, MMMM dd, yyyy')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time</p>
              <p className="font-bold text-gray-800">{event.start_time.slice(0, 5)} onwards</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</p>
              <p className="font-bold text-gray-800">{event.location}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Info className="w-5 h-5" />
            <h2 className="font-black uppercase text-xs tracking-widest">About the Event</h2>
          </div>
          <p className="text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
            {event.description}
          </p>
        </div>

        <button 
          onClick={() => toast.success('Reminder set! We\'ll notify you before the event.')}
          className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2"
        >
          <Bell className="w-5 h-5" /> Remind Me
        </button>
      </div>
    </div>
  );
}
