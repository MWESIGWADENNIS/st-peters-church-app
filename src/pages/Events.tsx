import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin, Clock, ChevronRight, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

import { useDataStore } from '../store/dataStore';

export default function Events() {
  const { events: cachedEvents, setEvents, isCacheValid } = useDataStore();
  const [events, setLocalEvents] = useState<any[]>(cachedEvents);
  const [loading, setLoading] = useState(!isCacheValid('events'));
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchEvents = async () => {
      const cacheValid = isCacheValid('events');
      if (!cacheValid) setLoading(true);

      try {
        const fetchPromise = supabase
          .from('events')
          .select('*')
          .order('event_date', { ascending: true });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 60000)
        );

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
        
        if (error) throw error;
        
        if (data) {
          setEvents(data);
          setLocalEvents(data);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const categories = ['All', 'General', 'Youth', 'Women', 'Men', 'Children'];
  
  const filteredEvents = events.filter(e => {
    const eventDate = new Date(e.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Only show today and future events
    const isUpcoming = eventDate >= today;
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || e.category === filter;
    
    return isUpcoming && matchesSearch && matchesFilter;
  });

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-primary">Events & Calendar</h1>
        <p className="text-sm text-gray-500 font-medium">Join our community in these upcoming activities.</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 focus:ring-2 focus:ring-primary outline-none font-bold"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filter === cat ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 pb-8">
        {loading ? (
          Array(4).fill(0).map((_, i) => <div key={i} className="h-48 bg-gray-50 rounded-3xl animate-pulse" />)
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="block bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group"
            >
              <div className="relative h-40">
                {event.image_url ? (
                  <img 
                    src={event.image_url} 
                    alt={event.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-lavender flex items-center justify-center text-primary/20">
                    <Calendar className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-xl shadow-sm flex flex-col items-center">
                  <span className="text-[10px] font-black text-primary uppercase leading-none">{format(new Date(event.event_date), 'MMM')}</span>
                  <span className="text-lg font-black text-gray-900 leading-none">{format(new Date(event.event_date), 'dd')}</span>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <h3 className="text-xl font-display font-black text-gray-900 leading-tight group-hover:text-primary transition-colors">
                  {event.title}
                </h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <Clock className="w-3.5 h-3.5 text-primary" /> {event.start_time.slice(0, 5)}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <MapPin className="w-3.5 h-3.5 text-primary" /> {event.location}
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium italic">No events found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
