import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Share2, BookOpen, Quote, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function DailyBreadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [devotion, setDevotion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDevotion = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const fetchPromise = supabase.from('daily_bread').select('*').eq('id', id).single();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 60000)
        );

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
        
        if (error) {
          console.error('Error fetching devotion:', error);
          toast.error('Could not load devotion');
        } else if (data) {
          setDevotion(data);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDevotion();
  }, [id]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Daily Bread: ${devotion.title}`,
          text: `Read today's devotion: ${devotion.title}`,
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

  if (loading) return <div className="p-12 text-center animate-pulse">Loading devotion...</div>;
  if (!devotion) return <div className="p-12 text-center">Devotion not found.</div>;

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
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-right">
              — {devotion.bible_verse}
            </p>
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
