import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Image as ImageIcon, 
  Calendar, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Maximize2, 
  Search, 
  Heart, 
  Youtube, 
  Play,
  Filter
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useDataStore } from '../store/dataStore';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import { PullToRefresh } from '../components/PullToRefresh';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

export default function Gallery() {
  const { galleryAlbums, setGalleryAlbums } = useDataStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [viewerItemIndex, setViewerItemIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gallery_albums')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGalleryAlbums(data || []);
    } catch (err) {
      console.error('Error fetching albums:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async (albumId: string) => {
    try {
      const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .eq('album_id', albumId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setItems(data || []);

      if (user) {
        const { data: likes } = await supabase
          .from('gallery_likes')
          .select('item_id')
          .eq('user_id', user.id);
        
        if (likes) {
          setUserLikes(new Set(likes.map(l => l.item_id)));
        }
      }
    } catch (err) {
      console.error('Error fetching items:', err);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  const handleAlbumClick = (album: any) => {
    setSelectedAlbum(album);
    fetchItems(album.id);
  };

  const handleLike = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please login to like items');
      return;
    }

    const isLiked = userLikes.has(itemId);
    try {
      if (isLiked) {
        await supabase
          .from('gallery_likes')
          .delete()
          .eq('item_id', itemId)
          .eq('user_id', user.id);
        
        setUserLikes(prev => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
        setItems(prev => prev.map(item => 
          item.id === itemId ? { ...item, likes_count: (item.likes_count || 1) - 1 } : item
        ));
      } else {
        await supabase
          .from('gallery_likes')
          .insert([{ item_id: itemId, user_id: user.id }]);
        
        setUserLikes(prev => new Set([...prev, itemId]));
        setItems(prev => prev.map(item => 
          item.id === itemId ? { ...item, likes_count: (item.likes_count || 0) + 1 } : item
        ));
      }
    } catch (err) {
      console.error('Error liking item:', err);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'church-media.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const filteredAlbums = galleryAlbums.filter(album => 
    album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    album.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredItems = items.filter(item => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const getYoutubeId = (url: string) => {
    return url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^& \n]+)/)?.[1];
  };

  const getTikTokId = (url: string) => {
    // Handle standard: tiktok.com/@user/video/123
    // Handle mobile: m.tiktok.com/v/123
    const match = url.match(/video\/(\d+)/) || url.match(/v\/(\d+)/);
    return match ? match[1] : null;
  };

  const getGoogleDriveId = (url: string) => {
    const match = url.match(/\/d\/([-\w]{25,})/) || url.match(/id=([-\w]{25,})/);
    return match ? match[1] : null;
  };

  const getVideoEmbedUrl = (url: string) => {
    if (!url) return undefined;
    
    const ytId = getYoutubeId(url);
    if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;
    
    const ttId = getTikTokId(url);
    if (ttId) return `https://www.tiktok.com/embed/${ttId}`;

    const gdId = getGoogleDriveId(url);
    if (url.includes('drive.google.com') && gdId) {
      return `https://drive.google.com/file/d/${gdId}/preview`;
    }
    
    return url;
  };

  return (
    <div className="pb-20 min-h-screen bg-white">
      <div className="bg-primary text-white p-6 rounded-b-[3rem] shadow-lg mb-6 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {selectedAlbum && (
              <button 
                onClick={() => setSelectedAlbum(null)}
                className="bg-white/20 p-2 rounded-xl backdrop-blur-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-xl font-black font-display flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                {selectedAlbum ? selectedAlbum.title : 'Church Media Gallery'}
              </h1>
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
                {selectedAlbum ? 'Album View' : 'Capturing moments of faith'}
              </p>
            </div>
          </div>
        </div>

        {!selectedAlbum && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text"
              placeholder="Search albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:bg-white/20 transition-all"
            />
          </div>
        )}

        {selectedAlbum && (
          <div className="flex gap-2 mt-2">
            {(['all', 'image', 'video'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                  filterType === type ? "bg-white text-primary" : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        )}
      </div>

      <PullToRefresh onRefresh={fetchAlbums}>
        <div className="px-4">
          {!selectedAlbum ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAlbums.map((album) => (
                <motion.div
                  key={album.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => handleAlbumClick(album)}
                  className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-lg group cursor-pointer"
                >
                  <img 
                    src={album.cover_image_url || 'https://picsum.photos/seed/church/800/600'} 
                    alt={album.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-6 flex flex-col justify-end">
                    <h3 className="text-white font-black text-xl leading-tight">{album.title}</h3>
                    <div className="flex items-center gap-3 text-white/70 text-[10px] font-bold uppercase tracking-widest mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {album.created_at ? format(new Date(album.created_at), 'MMM yyyy') : 'Recent'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {selectedAlbum.description && (
                <p className="text-gray-500 text-sm px-2">{selectedAlbum.description}</p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setViewerItemIndex(index)}
                    className="relative aspect-square rounded-2xl overflow-hidden shadow-sm group cursor-pointer bg-gray-100"
                  >
                    <img 
                      src={(item.type === 'video' ? item.thumbnail_url : item.url) || 'https://picsum.photos/seed/church/400/400'} 
                      alt={item.title || 'Gallery Item'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    
                    {item.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                        <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                          <Play className="w-5 h-5 text-red-600 fill-red-600 ml-0.5" />
                        </div>
                      </div>
                    )}

                    <div className="absolute top-2 right-2 flex gap-1">
                      <button 
                        onClick={(e) => handleLike(item.id, e)}
                        className={cn(
                          "p-2 rounded-full backdrop-blur-md transition-all",
                          userLikes.has(item.id) ? "bg-rose-500 text-white" : "bg-black/20 text-white hover:bg-black/40"
                        )}
                      >
                        <Heart className={cn("w-4 h-4", userLikes.has(item.id) && "fill-current")} />
                      </button>
                    </div>

                    <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-[10px] font-bold truncate">{item.title}</p>
                      <p className="text-white/70 text-[8px]">{item.likes_count || 0} Likes</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Item Viewer Modal */}
      <AnimatePresence>
        {viewerItemIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col"
          >
            <div className="p-4 flex justify-between items-center text-white z-10">
              <div className="text-xs font-black uppercase tracking-widest">
                {viewerItemIndex + 1} / {filteredItems.length}
              </div>
              <div className="flex gap-3">
                {filteredItems[viewerItemIndex].type === 'image' && (
                  <button 
                    onClick={() => handleDownload(filteredItems[viewerItemIndex].url, `church-media-${viewerItemIndex}.jpg`)}
                    className="p-2 bg-white/10 rounded-xl"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={() => setViewerItemIndex(null)}
                  className="p-2 bg-white/10 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 relative flex items-center justify-center">
              <button 
                onClick={() => setViewerItemIndex(prev => prev! > 0 ? prev! - 1 : filteredItems.length - 1)}
                className="absolute left-4 p-3 bg-white/10 rounded-2xl text-white z-10 hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <div className="w-full h-full flex items-center justify-center p-4">
                {filteredItems[viewerItemIndex].type === 'video' ? (
                  <div className={cn(
                    "relative overflow-hidden shadow-2xl bg-black flex items-center justify-center",
                    filteredItems[viewerItemIndex].url?.includes('tiktok.com') 
                      ? "aspect-[9/16] h-[85vh] w-auto rounded-[2.5rem] border-[8px] border-white/10" 
                      : "w-full aspect-video max-w-4xl rounded-2xl"
                  )}>
                    <iframe
                      src={getVideoEmbedUrl(filteredItems[viewerItemIndex].url) || undefined}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <motion.img
                    key={filteredItems[viewerItemIndex].id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    src={filteredItems[viewerItemIndex].url || undefined}
                    alt="Full view"
                    className="max-w-full max-h-full object-contain rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

              <button 
                onClick={() => setViewerItemIndex(prev => prev! < filteredItems.length - 1 ? prev! + 1 : 0)}
                className="absolute right-4 p-3 bg-white/10 rounded-2xl text-white z-10 hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 bg-gradient-to-t from-black/90 to-transparent text-white">
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div>
                  <h3 className="font-black text-lg">{filteredItems[viewerItemIndex].title || 'Untitled'}</h3>
                  <p className="text-white/60 text-xs mt-1">{filteredItems[viewerItemIndex].likes_count || 0} Likes</p>
                </div>
                <button 
                  onClick={(e) => handleLike(filteredItems[viewerItemIndex].id, e)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all",
                    userLikes.has(filteredItems[viewerItemIndex].id) ? "bg-rose-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
                  )}
                >
                  <Heart className={cn("w-4 h-4", userLikes.has(filteredItems[viewerItemIndex].id) && "fill-current")} />
                  {userLikes.has(filteredItems[viewerItemIndex].id) ? 'Liked' : 'Like'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
