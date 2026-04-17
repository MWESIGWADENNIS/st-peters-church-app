import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Calendar, Clock, MapPin, Share2, Info, Bell, Users, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpCount, setRsvpCount] = useState(0);
  const [isRsvped, setIsRsvped] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
        if (error) throw error;
        setEvent(data);

        // Fetch RSVP count
        const { count } = await supabase.from('event_rsvp').select('*', { count: 'exact', head: true }).eq('event_id', id);
        setRsvpCount(count || 0);

        // Check if user is RSVPed
        if (user) {
          console.log('[EventDetail] Checking RSVP for user:', user.id);
          const { data: rsvp, error: rsvpError } = await supabase.from('event_rsvp').select('*').eq('event_id', id).eq('user_id', user.id).maybeSingle();
          if (rsvpError) console.error('[EventDetail] RSVP Check Error:', rsvpError);
          setIsRsvped(!!rsvp);
        }
      } catch (err: any) {
        console.error('Error fetching event:', err);
        toast.error('Could not load event');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, user]);

  const handleRsvp = async () => {
    if (!user) {
      toast.error('Please login to RSVP');
      return;
    }

    setRsvpLoading(true);
    console.log('[EventDetail] Handling RSVP. Current state:', isRsvped);
    try {
      if (isRsvped) {
        const { error } = await supabase.from('event_rsvp').delete().eq('event_id', id).eq('user_id', user.id);
        if (error) throw error;
        setIsRsvped(false);
        setRsvpCount(prev => prev - 1);
        toast.success('RSVP cancelled');
      } else {
        const { error } = await supabase.from('event_rsvp').insert({ event_id: id, user_id: user.id });
        if (error) throw error;
        setIsRsvped(true);
        setRsvpCount(prev => prev + 1);
        toast.success('See you there!');
      }
    } catch (err) {
      console.error('[EventDetail] RSVP error:', err);
      toast.error('Failed to update RSVP');
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: event.title,
      text: `Join us for ${event.title} at St. Peter's Church!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error: any) {
        if (error.name !== 'AbortError') toast.error('Could not share');
      }
    } else {
      await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      toast.success('Link copied!');
    }
  };

  if (loading) return <div className="p-12 text-center animate-pulse">Loading event...</div>;
  if (!event) return <div className="p-12 text-center">Event not found.</div>;

  return (
    <div className="min-h-screen bg-white pb-12">
      <div className="relative h-72">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Attending</p>
              <p className="font-black text-primary">{rsvpCount} people</p>
            </div>
          </div>
          <button 
            onClick={handleRsvp}
            disabled={rsvpLoading}
            className={cn(
              "px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-sm",
              isRsvped 
                ? "bg-white text-emerald-600 border-2 border-emerald-100" 
                : "bg-primary text-white hover:bg-primary/90"
            )}
          >
            {rsvpLoading ? '...' : isRsvped ? 'Going' : 'Join Event'}
          </button>
        </div>

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
          className="w-full py-4 border-2 border-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
        >
          <Bell className="w-5 h-5" /> Set Reminder
        </button>
      </div>
    </div>
  );
}
