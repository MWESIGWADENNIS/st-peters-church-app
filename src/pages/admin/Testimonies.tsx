import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  MessageSquare, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Clock,
  User,
  Heart,
  Search,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function AdminTestimonies() {
  const navigate = useNavigate();
  const [testimonies, setTestimonies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const fetchTestimonies = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('testimonies')
        .select(`
          *,
          users (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (filter === 'pending') query = query.eq('status', 'pending');
      if (filter === 'approved') query = query.eq('status', 'approved');

      const { data, error } = await query;
      if (error) throw error;
      setTestimonies(data || []);
    } catch (err) {
      console.error('Error fetching testimonies:', err);
      toast.error('Failed to load testimonies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonies();
  }, [filter]);

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('testimonies')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Testimony ${status}`);
      fetchTestimonies();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this testimony?')) return;
    try {
      const { error } = await supabase.from('testimonies').delete().eq('id', id);
      if (error) throw error;
      toast.success('Testimony deleted');
      fetchTestimonies();
    } catch (err) {
      toast.error('Failed to delete testimony');
    }
  };

  const filteredTestimonies = testimonies.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/admin')}
          className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Testimony Wall</h1>
          <p className="text-gray-500 text-sm">Moderate and manage member testimonies.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Search testimonies or members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-gray-100 rounded-xl focus:border-primary outline-none transition-all"
          />
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {(['all', 'pending', 'approved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                filter === f ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredTestimonies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredTestimonies.map((testimony) => (
              <motion.div
                key={testimony.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{testimony.users?.full_name || 'Anonymous'}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {format(new Date(testimony.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                    testimony.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                    testimony.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                    'bg-red-50 text-red-600'
                  )}>
                    {testimony.status}
                  </div>
                </div>

                <div>
                  <h4 className="font-black text-gray-900 mb-1">{testimony.title}</h4>
                  <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                    {testimony.body}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-4 text-gray-400">
                    <span className="flex items-center gap-1 text-xs font-bold">
                      <Heart className="w-4 h-4" /> {testimony.likes}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {testimony.status === 'pending' && (
                      <button 
                        onClick={() => handleStatusChange(testimony.id, 'approved')}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Approve"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(testimony.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No testimonies found</h3>
          <p className="text-gray-500">Try adjusting your search or filter.</p>
        </div>
      )}
    </div>
  );
}
