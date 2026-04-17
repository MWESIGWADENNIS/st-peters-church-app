import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Share2, Music, Copy, Check, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

import { useDataStore } from '../store/dataStore';

export default function HymnDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { churchSettings } = useDataStore();
  const [hymn, setHymn] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchHymn = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase.from('hymns').select('*').eq('id', id).single();

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

  const handleCopyLyrics = async () => {
    try {
      await navigator.clipboard.writeText(`${hymn.title}\n\n${hymn.lyrics}`);
      setCopied(true);
      toast.success('Lyrics copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy lyrics');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
          <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <div className="space-y-4 text-center">
          <div className="h-16 w-16 bg-gray-100 rounded-2xl mx-auto animate-pulse" />
          <div className="h-8 w-3/4 bg-gray-100 rounded-xl mx-auto animate-pulse" />
          <div className="h-4 w-1/4 bg-gray-100 rounded-full mx-auto animate-pulse" />
        </div>
        <div className="space-y-3 pt-8">
          {Array(15).fill(0).map((_, i) => (
            <div key={i} className="h-4 bg-gray-50 rounded-full animate-pulse" style={{ width: `${Math.random() * 40 + 60}%` }} />
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
      className="min-h-screen bg-[#FAFAFA] pb-20"
    >
      {/* Premium Header */}
      <div className="bg-white px-6 pt-12 pb-12 rounded-b-[3.5rem] shadow-sm border-b border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full -ml-24 -mb-24 blur-3xl" />
        
        <div className="relative z-10 flex items-center justify-between mb-10">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)} 
            className="p-3 bg-gray-50 rounded-2xl text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
          <div className="flex gap-2">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={handleCopyLyrics}
              className="p-3 bg-gray-50 rounded-2xl text-gray-600 hover:bg-gray-100 transition-colors relative"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                  >
                    <Check className="w-5 h-5 text-green-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                  >
                    <Copy className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={handleShare} 
              className="p-3 bg-gray-50 rounded-2xl text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        <div className="relative z-10 text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex flex-col items-center justify-center w-20 h-20 bg-primary text-white rounded-[2rem] shadow-2xl shadow-primary/30 relative"
          >
            <Hash className="w-4 h-4 opacity-30 absolute top-3 left-3" />
            <span className="text-3xl font-display font-black">{hymn.number}</span>
          </motion.div>
          
          <h1 className="text-3xl font-display font-black text-gray-900 leading-tight px-4">
            {hymn.title}
          </h1>
          
          <div className="flex items-center justify-center gap-2">
            <span className="px-4 py-1.5 bg-lavender text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-primary/10">
              {hymn.category}
            </span>
          </div>
        </div>
      </div>

      {/* Lyrics Section */}
      <div className="px-6 -mt-6 relative z-10">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[3rem] p-10 shadow-xl shadow-gray-200/50 border border-gray-50"
        >
          <div className="whitespace-pre-wrap text-xl leading-[1.8] text-gray-700 font-medium font-sans text-center">
            {hymn.lyrics}
          </div>
        </motion.div>

        <div className="mt-12 text-center">
          <div className="w-16 h-1 bg-gray-200 mx-auto mb-8 rounded-full" />
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 transition-all"
          >
            <Music className="w-5 h-5" /> Back to Hymn Book
          </motion.button>
        </div>
      </div>

      {/* Footer Note */}
      <div className="pt-12 pb-8 text-center">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">
          {churchSettings?.church_name || "St. Peter's Church"}
        </p>
      </div>
    </motion.div>
  );
}
