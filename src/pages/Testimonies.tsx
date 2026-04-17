import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Heart, Plus, User, Send, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { PullToRefresh } from '../components/PullToRefresh';

import { useNavigate } from 'react-router-dom';

export default function Testimonies() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { testimonies, setTestimonies } = useDataStore();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', body: '', is_anonymous: false });
  const [userLikes, setUserLikes] = useState<string[]>([]);

  const fetchTestimonies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('testimonies')
        .select('*, users(full_name, avatar_url)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTestimonies(data || []);

      if (user) {
        const { data: likes } = await supabase
          .from('testimony_likes')
          .select('testimony_id')
          .eq('user_id', user.id);
        
        if (likes) setUserLikes(likes.map(l => l.testimony_id));
      }
    } catch (err) {
      console.error('Error fetching testimonies:', err);
      toast.error('Failed to load testimonies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonies();

    // Real-time subscription
    const subscription = supabase
      .channel('testimonies_changes')
      .on('postgres_changes' as any, { event: '*', table: 'testimonies' }, () => {
        fetchTestimonies();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const handleLike = async (testimonyId: string) => {
    if (!user) return;

    const isLiked = userLikes.includes(testimonyId);
    
    try {
      if (isLiked) {
        await supabase
          .from('testimony_likes')
          .delete()
          .eq('testimony_id', testimonyId)
          .eq('user_id', user.id);
        
        await supabase.rpc('decrement_testimony_likes', { testimony_id: testimonyId });
        setUserLikes(prev => prev.filter(id => id !== testimonyId));
      } else {
        await supabase
          .from('testimony_likes')
          .insert({ testimony_id: testimonyId, user_id: user.id });
        
        await supabase.rpc('increment_testimony_likes', { testimony_id: testimonyId });
        setUserLikes(prev => [...prev, testimonyId]);
      }
    } catch (err) {
      console.error('Error liking testimony:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to share your testimony');
      navigate('/login');
      return;
    }
    if (!formData.title || !formData.body) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('testimonies').insert({
        user_id: user.id,
        title: formData.title,
        body: formData.body,
        is_anonymous: formData.is_anonymous
      });

      if (error) throw error;
      
      toast.success('Testimony shared successfully!');
      setShowModal(false);
      setFormData({ title: '', body: '', is_anonymous: false });
      fetchTestimonies();
    } catch (err) {
      console.error('Error sharing testimony:', err);
      toast.error('Failed to share testimony');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-20">
      <div className="bg-primary text-white p-6 rounded-b-[3rem] shadow-lg mb-6">
        <h1 className="text-2xl font-black font-display flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          Testimony Wall
        </h1>
        <p className="text-white/80 text-sm mt-1">Share what God has done for you</p>
      </div>

      <PullToRefresh onRefresh={fetchTestimonies}>
        <div className="px-4 space-y-4">
          {testimonies.map((testimony) => (
            <motion.div
              key={testimony.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {testimony.is_anonymous || !testimony.users?.avatar_url ? (
                    <User className="w-6 h-6 text-primary" />
                  ) : (
                    <img 
                      src={testimony.users.avatar_url} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {testimony.is_anonymous ? 'Anonymous Member' : testimony.users?.full_name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {format(new Date(testimony.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              <h4 className="font-display font-bold text-lg text-primary mb-2">{testimony.title}</h4>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">{testimony.body}</p>

              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <button 
                  onClick={() => handleLike(testimony.id)}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    userLikes.includes(testimony.id) ? 'text-red-500' : 'text-gray-400'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${userLikes.includes(testimony.id) ? 'fill-current' : ''}`} />
                  <span>{testimony.likes || 0}</span>
                </button>
              </div>
            </motion.div>
          ))}

          {testimonies.length === 0 && !loading && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">No testimonies yet. Be the first to share!</p>
            </div>
          )}
        </div>
      </PullToRefresh>

      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-accent text-white rounded-full shadow-xl flex items-center justify-center z-40 hover:scale-110 active:scale-95 transition-transform"
      >
        <Plus className="w-8 h-8" />
      </button>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="bg-primary p-6 text-white flex justify-between items-center">
                <h2 className="text-xl font-black font-display">Share Testimony</h2>
                <button onClick={() => setShowModal(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. God healed me!"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Your Testimony</label>
                  <textarea
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    placeholder="Tell us what God has done..."
                    rows={5}
                    maxLength={500}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                  />
                  <p className="text-right text-[10px] text-gray-400 mt-1">
                    {formData.body.length}/500 characters
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={formData.is_anonymous}
                    onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <label htmlFor="anonymous" className="text-sm text-gray-600">Share anonymously</label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Post Testimony
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
