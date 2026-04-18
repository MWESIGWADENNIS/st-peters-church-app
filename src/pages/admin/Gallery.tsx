import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Folder,
  Upload,
  X,
  ChevronRight,
  MoreVertical,
  ArrowLeft,
  Youtube,
  Video,
  Play
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function AdminGallery() {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAlbum, setShowAddAlbum] = useState(false);
  const [showAddMedia, setShowAddMedia] = useState(false);
  const [showManageItems, setShowManageItems] = useState(false);
  const [selectedAlbumForItems, setSelectedAlbumForItems] = useState<any>(null);
  const [albumItems, setAlbumItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [newAlbum, setNewAlbum] = useState({ title: '', description: '', cover_image_url: '' });
  const [mediaData, setMediaData] = useState({ 
    album_id: '', 
    type: 'image' as 'image' | 'video',
    title: '', 
    url: '', 
    thumbnail_url: '' 
  });
  const [uploading, setUploading] = useState(false);
  const [deleteAlbumId, setDeleteAlbumId] = useState<string | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gallery_albums')
        .select(`
          *,
          gallery_items (count)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAlbums(data || []);
    } catch (err) {
      console.error('Error fetching albums:', err);
      toast.error('Failed to load albums');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbumItems = async (albumId: string) => {
    setLoadingItems(true);
    try {
      const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .eq('album_id', albumId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlbumItems(data || []);
    } catch (err) {
      toast.error('Failed to fetch items');
    } finally {
      setLoadingItems(false);
    }
  };

  const handleDeleteItem = async (itemId: string, albumId: string) => {
    try {
      const { error } = await supabase
        .from('gallery_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      toast.success('Item deleted');
      setDeleteItemId(null);
      fetchAlbumItems(albumId);
      fetchAlbums();
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('gallery_albums').insert([newAlbum]);
      if (error) throw error;
      toast.success('Album created!');
      setShowAddAlbum(false);
      setNewAlbum({ title: '', description: '', cover_image_url: '' });
      fetchAlbums();
    } catch (err) {
      toast.error('Failed to create album');
    }
  };

  const handleDeleteAlbum = async (id: string) => {
    try {
      // First delete all items in the album
      const { error: itemsError } = await supabase
        .from('gallery_items')
        .delete()
        .eq('album_id', id);
      
      if (itemsError) throw itemsError;

      // Then delete the album
      const { error } = await supabase.from('gallery_albums').delete().eq('id', id);
      if (error) throw error;
      
      toast.success('Album deleted');
      setDeleteAlbumId(null);
      fetchAlbums();
    } catch (err) {
      toast.error('Failed to delete album');
    }
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaData.album_id) {
      toast.error('Please select an album');
      return;
    }

    try {
      if (mediaData.type === 'video') {
        if (!mediaData.url) return;

        let finalUrl = mediaData.url;
        let finalThumbnail = mediaData.thumbnail_url;
        let finalTitle = mediaData.title || 'Video';

        if (mediaData.url.includes('tiktok.com')) {
          const loadingToast = toast.loading('Processing TikTok link...');
          try {
            const res = await fetch(`/api/tiktok-info?url=${encodeURIComponent(mediaData.url)}`);
            if (!res.ok) throw new Error('Failed to resolve');
            const data = await res.json();
            
            if (data.video_id) {
              finalUrl = `https://www.tiktok.com/video/${data.video_id}`;
              if (!mediaData.title) finalTitle = data.title;
              if (!finalThumbnail) finalThumbnail = data.thumbnail_url;
            }
            toast.dismiss(loadingToast);
          } catch (err) {
            toast.dismiss(loadingToast);
            toast.error('Failed to process TikTok link. Please ensure it is a valid video link.');
            // Don't return, let it try to use the original URL as a fallback
          }
        }

        if (mediaData.url.includes('drive.google.com')) {
          if (!finalThumbnail) {
            finalThumbnail = 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png'; // Google Drive icon
          }
          if (!mediaData.title) finalTitle = 'Google Drive Video';
        }

        // Auto-generate YouTube thumbnail if not provided
        if (!finalThumbnail) {
          const youtubeId = finalUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^& \n]+)/)?.[1];
          if (youtubeId) {
            finalThumbnail = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
          }
        }

        const { error } = await supabase.from('gallery_items').insert([{
          album_id: mediaData.album_id,
          url: finalUrl,
          title: finalTitle,
          type: 'video',
          thumbnail_url: finalThumbnail
        }]);

        if (error) throw error;

        // Notify all users
        await supabase.rpc('notify_all_users', {
          notif_title: 'New Video in Gallery!',
          notif_body: `A new video "${finalTitle}" has been added to the gallery.`,
          notif_type: 'gallery'
        });

        toast.success('Video added!');
      }
      
      setShowAddMedia(false);
      setMediaData({ album_id: '', type: 'image', title: '', url: '', thumbnail_url: '' });
      fetchAlbums();
    } catch (err) {
      toast.error('Failed to add media');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, albumId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${albumId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('gallery')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('gallery')
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase.from('gallery_items').insert([{
          album_id: albumId,
          url: publicUrl,
          title: file.name,
          type: 'image'
        }]);

        if (dbError) throw dbError;
      }

      // Notify all users
      await supabase.rpc('notify_all_users', {
        notif_title: 'New Photos in Gallery!',
        notif_body: `New photos have been uploaded to the gallery.`,
        notif_type: 'gallery'
      });

      toast.success('Photos uploaded!');
      setShowAddMedia(false);
      setMediaData({ album_id: '', type: 'image', title: '', url: '', thumbnail_url: '' });
      fetchAlbums();
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin')}
            className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Media Gallery</h1>
            <p className="text-gray-500 text-sm">Manage albums with photos and YouTube videos.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAddAlbum(true)}
            className="bg-white text-primary border-2 border-primary/10 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all"
          >
            <Plus className="w-4 h-4" /> New Album
          </button>
          <button 
            onClick={() => setShowAddMedia(true)}
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            <Upload className="w-4 h-4" /> Add Media
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : albums.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {albums.map((album) => (
            <div 
              key={album.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group"
            >
              <div className="aspect-[4/3] bg-gray-100 relative">
                {album.cover_image_url ? (
                  <img 
                    src={album.cover_image_url || undefined} 
                    alt={album.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Folder className="w-12 h-12" />
                  </div>
                )}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center gap-3">
                    <button 
                      onClick={() => {
                        setSelectedAlbumForItems(album);
                        fetchAlbumItems(album.id);
                        setShowManageItems(true);
                      }}
                      className="p-3 bg-white text-primary rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                    >
                      Manage Items
                    </button>
                    {deleteAlbumId === album.id ? (
                      <div className="absolute top-2 right-2 flex items-center gap-1 animate-in zoom-in-95 duration-200">
                        <button onClick={() => setDeleteAlbumId(null)} className="p-2 bg-white/90 backdrop-blur-sm rounded-lg text-gray-400">
                          <X className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteAlbum(album.id)} className="px-3 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg">
                          Confirm
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setDeleteAlbumId(album.id)}
                        className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-lg text-gray-600 hover:text-red-600 transition-colors"
                        title="Delete Album"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900">{album.title}</h3>
                  <span className="text-[10px] font-black bg-gray-100 px-2 py-1 rounded text-gray-500">
                    {album.gallery_items?.[0]?.count || 0} ITEMS
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1">{album.description}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No albums yet</h3>
          <p className="text-gray-500">Create an album to start sharing photos.</p>
        </div>
      )}

      {/* Manage Items Modal */}
      <AnimatePresence>
        {showManageItems && selectedAlbumForItems && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-8 w-full max-w-4xl max-h-[80vh] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Manage Items</h2>
                  <p className="text-xs text-gray-500 font-bold">{selectedAlbumForItems.title}</p>
                </div>
                <button onClick={() => setShowManageItems(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2">
                {loadingItems ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : albumItems.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {albumItems.map((item) => (
                      <div key={item.id} className="relative aspect-square rounded-2xl overflow-hidden group bg-gray-100">
                        <img 
                          src={item.type === 'video' ? (item.thumbnail_url || 'https://picsum.photos/seed/video/400/400') : item.url} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        {item.type === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Play className="w-8 h-8 text-white fill-white" />
                          </div>
                        )}
                          <div className="absolute top-2 right-2 flex flex-col gap-1">
                            {deleteItemId === item.id ? (
                              <div className="flex items-center gap-1 animate-in zoom-in-95 duration-200">
                                <button onClick={() => setDeleteItemId(null)} className="p-2 bg-white/90 backdrop-blur-sm rounded-lg text-gray-400 shadow-sm">
                                  <X className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteItem(item.id, selectedAlbumForItems.id)} className="px-3 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg">
                                  Yes
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setDeleteItemId(item.id)}
                                className="p-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                    <ImageIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-bold">No items in this album yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Album Modal */}
      <AnimatePresence>
        {showAddAlbum && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Create Album</h2>
                <button onClick={() => setShowAddAlbum(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAlbum} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Album Title</label>
                  <input 
                    required
                    type="text"
                    value={newAlbum.title}
                    onChange={(e) => setNewAlbum({ ...newAlbum, title: e.target.value })}
                    className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-all font-bold"
                    placeholder="e.g., Easter Sunday 2024"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                  <textarea 
                    rows={2}
                    value={newAlbum.description}
                    onChange={(e) => setNewAlbum({ ...newAlbum, description: e.target.value })}
                    className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-all font-medium"
                    placeholder="Brief description..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cover Image URL</label>
                  <input 
                    type="url"
                    value={newAlbum.cover_image_url}
                    onChange={(e) => setNewAlbum({ ...newAlbum, cover_image_url: e.target.value })}
                    className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-all font-bold"
                    placeholder="https://..."
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 uppercase tracking-widest text-xs mt-4"
                >
                  Create Album
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Media Modal */}
      <AnimatePresence>
        {showAddMedia && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Add Media</h2>
                <button onClick={() => setShowAddMedia(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMedia} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Album</label>
                  <select 
                    required
                    value={mediaData.album_id}
                    onChange={(e) => setMediaData({ ...mediaData, album_id: e.target.value })}
                    className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-all font-bold"
                  >
                    <option value="">Choose an album...</option>
                    {albums.map(album => (
                      <option key={album.id} value={album.id}>{album.title}</option>
                    ))}
                  </select>
                </div>

                <div className="flex p-1 bg-gray-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setMediaData({ ...mediaData, type: 'image' })}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                      mediaData.type === 'image' ? "bg-white text-primary shadow-sm" : "text-gray-500"
                    )}
                  >
                    Photos
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaData({ ...mediaData, type: 'video' })}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                      mediaData.type === 'video' ? "bg-white text-red-600 shadow-sm" : "text-gray-500"
                    )}
                  >
                    Video
                  </button>
                </div>

                {mediaData.type === 'image' ? (
                  <div className="space-y-4">
                    <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center relative overflow-hidden">
                      {uploading && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest">Uploading...</p>
                        </div>
                      )}
                      <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500 font-bold mb-4">Select one or more photos</p>
                      <label className={cn(
                        "bg-primary text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-primary/90 transition-colors",
                        uploading && "opacity-50 cursor-not-allowed"
                      )}>
                        {uploading ? 'Processing...' : 'Browse Files'}
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          className="hidden" 
                          disabled={uploading}
                          onChange={(e) => {
                            if (mediaData.album_id) {
                              handlePhotoUpload(e, mediaData.album_id);
                            } else {
                              toast.error('Please select an album first');
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Video Title</label>
                      <input 
                        type="text"
                        value={mediaData.title}
                        onChange={(e) => setMediaData({ ...mediaData, title: e.target.value })}
                        className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-all font-bold"
                        placeholder="e.g., Sunday Worship"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Video URL (YouTube or TikTok)</label>
                      <input 
                        required
                        type="url"
                        value={mediaData.url}
                        onChange={(e) => setMediaData({ ...mediaData, url: e.target.value })}
                        className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-all font-bold"
                        placeholder="https://..."
                      />
                      <p className="text-[9px] text-gray-400 font-bold ml-1">
                        * Use full TikTok URLs (e.g. tiktok.com/@user/video/...) for best results.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Thumbnail URL (Optional)</label>
                      <input 
                        type="url"
                        value={mediaData.thumbnail_url}
                        onChange={(e) => setMediaData({ ...mediaData, thumbnail_url: e.target.value })}
                        className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-all font-bold"
                        placeholder="https://..."
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full py-4 bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-200 uppercase tracking-widest text-xs mt-4"
                    >
                      Add Video
                    </button>
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
