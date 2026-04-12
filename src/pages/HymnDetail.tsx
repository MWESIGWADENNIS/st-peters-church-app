import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Share2, Music } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';

import { useDataStore } from '../store/dataStore';

export default function HymnDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { churchSettings } = useDataStore();
  const [hymn, setHymn] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHymn = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const fetchPromise = supabase.from('hymns').select('*').eq('id', id).single();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 60000)
        );

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

        if (error) {
          console.error('Error fetching hymn:', error);
          toast.error('Could not load hymn');
        } else if (data) {
          setHymn(data);
        }
      } catch (err: any) {
        console.error('Unexpected error:', err);
        toast.error(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchHymn();
  }, [id]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Hymn ${hymn.number}: ${hymn.title}`,
          text: `Check out this hymn from ${churchSettings?.church_name || "St. Peter's Church"}: ${hymn.title}`,
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

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-3/4 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-1/4 bg-gray-100 rounded animate-pulse" />
        <div className="space-y-2 pt-8">
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!hymn) return <div className="p-6 text-center">Hymn not found.</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <button onClick={handleShare} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
          <Share2 className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="p-6 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary text-white rounded-2xl text-2xl font-black shadow-lg mb-2">
            {hymn.number}
          </div>
          <h1 className="text-3xl font-display font-black text-gray-900 leading-tight">
            {hymn.title}
          </h1>
          <span className="inline-block px-4 py-1.5 bg-lavender text-primary text-xs font-bold rounded-full uppercase tracking-widest">
            {hymn.category}
          </span>
        </div>

        <div className="relative">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/10 rounded-full" />
          <div className="whitespace-pre-wrap text-lg leading-relaxed text-gray-700 font-medium font-sans pl-4">
            {hymn.lyrics}
          </div>
        </div>

        <div className="pt-12 pb-8 text-center">
          <div className="w-12 h-1 bg-gray-100 mx-auto mb-6 rounded-full" />
          <button 
            onClick={() => navigate(-1)}
            className="text-primary font-bold flex items-center gap-2 mx-auto"
          >
            <Music className="w-4 h-4" /> Back to Hymn Book
          </button>
        </div>
      </div>
    </motion.div>
  );
}
