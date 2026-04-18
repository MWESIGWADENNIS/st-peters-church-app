import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Share2, BookOpen, Quote, Heart, Bell, BellOff, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { getBibleLink } from '../utils/bibleLinkUtils';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { persistenceService } from '../services/persistenceService';

export default function DailyBreadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [devotion, setDevotion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reminderTime, setReminderTime] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const isOnline = useNetworkStatus();

  useEffect(() => {
    const fetchDevotion = async () => {
      if (!id) return;
      setLoading(true);

      // Check cache first
      const cached = await persistenceService.get('daily_bread');
      const found = cached?.find((d: any) => d.id === id);
      if (found) {
        setDevotion(found);
        setLoading(false);
      }

      if (!isOnline) return;

      try {
        const { data, error } = await supabase.from('daily_bread').select('*').eq('id', id).single();
        if (error) throw error;
        setDevotion(data);
        
        // Sync single item to cache if not already part of today's fetch
        if (data) {
          const allCached = await persistenceService.get('daily_bread') || [];
          if (!allCached.find((d: any) => d.id === data.id)) {
            await persistenceService.set('daily_bread', [...allCached, data]);
          }
        }

        if (user) {
          const { data: profile } = await supabase.from('users').select('reminder_time').eq('id', user.id).single();
          setReminderTime(profile?.reminder_time || null);
        }
      } catch (err) {
        console.error('Error fetching devotion:', err);
        toast.error('Could not load devotion');
      } finally {
        setLoading(false);
      }
    };
    fetchDevotion();
  }, [id, user]);

  const handleShare = async () => {
    const shareData = {
      title: `Daily Bread: ${devotion.title}`,
      text: `Read today's devotion: ${devotion.title}\n\n"${devotion.bible_verse}"\n\nRead more on St. Peter's App:`,
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

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`*Daily Bread: ${devotion.title}*\n\n_"${devotion.bible_verse}"_\n\nRead today's devotion here: ${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const toggleReminder = async () => {
    if (!user) {
      toast.error('Please login to set reminders');
      return;
    }

    if (reminderTime) {
      // Turn off
      const { error } = await supabase.from('users').update({ reminder_time: null }).eq('id', user.id);
      if (!error) {
        setReminderTime(null);
        toast.success('Reminder turned off');
      }
    } else {
      setShowTimePicker(true);
    }
  };

  const saveReminderTime = async (time: string) => {
    if (!user) return;

    // Request notification permission
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Please enable notifications in your browser settings');
        return;
      }
    }

    const { error } = await supabase.from('users').update({ reminder_time: time }).eq('id', user.id);
    if (!error) {
      setReminderTime(time);
      setShowTimePicker(false);
      toast.success(`Reminder set for ${time}`);
    } else {
      toast.error('Failed to save reminder');
    }
  };

  if (loading) return <div className="p-12 text-center animate-pulse">Loading devotion...</div>;
  if (!devotion) return <div className="p-12 text-center">Devotion not found.</div>;

  return (
    <div className="min-h-screen bg-white pb-12">
      <div className="p-4 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex items-center gap-1">
          <button 
            onClick={toggleReminder} 
            className={cn(
              "p-2 rounded-full transition-colors",
              reminderTime ? "bg-primary/10 text-primary" : "text-gray-400 hover:bg-gray-50"
            )}
            title={reminderTime ? `Reminder set for ${reminderTime}` : "Set daily reminder"}
          >
            {reminderTime ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </button>
          <button onClick={handleWhatsAppShare} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-full transition-colors">
            <MessageCircle className="w-5 h-5 fill-emerald-500" />
          </button>
          <button onClick={handleShare} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {showTimePicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-xs text-center space-y-4"
          >
            <h3 className="font-black text-primary text-lg">Set Reminder Time</h3>
            <p className="text-gray-500 text-xs font-medium">Choose when you'd like to receive your daily bread.</p>
            <input 
              type="time" 
              className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold text-center text-xl focus:border-primary outline-none"
              defaultValue="07:00"
              id="reminder-time-input"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowTimePicker(false)}
                className="flex-1 py-3 font-bold text-gray-400"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const val = (document.getElementById('reminder-time-input') as HTMLInputElement).value;
                  saveReminderTime(val);
                }}
                className="flex-1 py-3 bg-primary text-white font-black rounded-xl shadow-lg"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="p-6 space-y-8">
        <div className="space-y-4">
          <span className="inline-block px-3 py-1 bg-lavender text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
            {format(new Date(devotion.devotion_date), 'EEEE, MMMM dd, yyyy')}
          </span>
          <h1 className="text-3xl font-display font-black text-gray-900 leading-tight">
            {devotion.title}
          </h1>
        </div>

        <div className="bg-gray-50 rounded-3xl p-6 relative overflow-hidden">
          <Quote className="absolute -top-2 -left-2 w-16 h-16 text-primary/5 -rotate-12" />
          <div className="relative space-y-3">
            <p className="text-primary font-black text-lg italic leading-relaxed">
              {devotion.verse_text || `"${devotion.bible_verse}"`}
            </p>
            <button 
              onClick={() => navigate(getBibleLink(devotion.bible_verse))}
              className="w-full flex items-center justify-end gap-2 text-xs font-black text-primary/60 uppercase tracking-widest hover:text-primary transition-colors"
            >
              Read in Bible — {devotion.bible_verse} <BookOpen className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">
          {devotion.devotion_body}
        </div>

        {devotion.prayer && (
          <div className="bg-primary/5 rounded-3xl p-6 space-y-3 border border-primary/10">
            <div className="flex items-center gap-2 text-primary">
              <Heart className="w-5 h-5 fill-primary" />
              <h3 className="font-black uppercase text-xs tracking-widest">Closing Prayer</h3>
            </div>
            <p className="text-gray-700 italic font-medium leading-relaxed">
              {devotion.prayer}
            </p>
          </div>
        )}

        <div className="pt-8 text-center">
          <div className="w-12 h-1 bg-gray-100 mx-auto mb-6 rounded-full" />
          <button 
            onClick={() => navigate(-1)}
            className="text-primary font-bold flex items-center gap-2 mx-auto"
          >
            <BookOpen className="w-4 h-4" /> Back to Daily Bread
          </button>
        </div>
      </div>
    </div>
  );
}
