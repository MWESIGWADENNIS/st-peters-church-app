import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Video, Save, X, ArrowLeft, Youtube, Calendar, Tag, Upload, Image as ImageIcon, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';

const CATEGORIES = ['Choir', 'Testimony', 'Message', 'General'];

export default function AdminVideos() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtube_url: '',
    video_url: '',
    thumbnail_url: '',
    category: 'General',
    recorded_date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    return () => {
      toast.dismiss();
    };
  }, []);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('church_videos')
      .select('*')
      .order('recorded_date', { ascending: false });
    if (data) setVideos(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('church_videos')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Video updated!');
      } else {
        const { error } = await supabase
          .from('church_videos')
          .insert(formData);
        if (error) throw error;

        toast.success('Video added!');
        
        // Notify all users in background to avoid UI delay
        (async () => {
          try {
            const { error: notifError } = await supabase.rpc('notify_all_users', {
              notif_title: 'New Video Uploaded!',
              notif_body: `${formData.category}: ${formData.title}`,
              notif_type: 'video'
            });
            if (notifError) console.error('Notification error:', notifError);
          } catch (err) {
            console.error('Notification error:', err);
          }
        })();
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        youtube_url: '',
        video_url: '',
        thumbnail_url: '',
        category: 'General',
        recorded_date: format(new Date(), 'yyyy-MM-dd')
      });
      fetchVideos();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save video.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'thumbnail') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size validation
    const maxSize = type === 'video' ? 200 * 1024 * 1024 : 20 * 1024 * 1024; // 200MB for video, 20MB for thumbnail
    if (file.size > maxSize) {
      toast.error(`File too large. Max ${maxSize / (1024 * 1024)}MB allowed.`);
      return;
    }

    const toastId = toast.loading(`Preparing ${type}...`);

    try {
      setUploading(true);
      let uploadFile: File | Blob = file;

      if (type === 'thumbnail') {
        toast.loading('Compressing image...', { id: toastId });
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1200,
          useWebWorker: true
        };
        try {
          uploadFile = await imageCompression(file, options);
        } catch (err) {
          console.warn('Compression failed, using original', err);
        }
      }
      
      const fileExt = type === 'thumbnail' ? 'jpg' : file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      toast.loading(`Uploading ${type} (${(uploadFile.size / (1024 * 1024)).toFixed(2)}MB)...`, { id: toastId });

      const { error: uploadError } = await supabase.storage
        .from('church-assets')
        .upload(filePath, uploadFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('church-assets')
        .getPublicUrl(filePath);

      if (type === 'video') {
        setFormData(prev => ({ ...prev, video_url: publicUrl }));
      } else {
        setFormData(prev => ({ ...prev, thumbnail_url: publicUrl }));
      }
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded!`, { id: toastId });
    } catch (error: any) {
      console.error('Upload Error:', error);
      toast.error(error.message || 'Upload failed.', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (video: any) => {
    setFormData({
      title: video.title || '',
      description: video.description || '',
      youtube_url: video.youtube_url || '',
      video_url: video.video_url || '',
      thumbnail_url: video.thumbnail_url || '',
      category: video.category || 'General',
      recorded_date: video.recorded_date || format(new Date(), 'yyyy-MM-dd')
    });
    setEditingId(video.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('church_videos').delete().eq('id', id);
      if (error) throw error;
      toast.success('Video deleted.');
      setDeleteConfirmId(null);
      fetchVideos();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete.');
    }
  };

  return (
    <div className="p-4 space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/admin')}
          className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-primary">Church Videos</h1>
          <p className="text-xs text-gray-500 font-medium">Manage choir clips, testimonies, and messages.</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({
              title: '',
              description: '',
              youtube_url: '',
              video_url: '',
              thumbnail_url: '',
              category: 'General',
              recorded_date: format(new Date(), 'yyyy-MM-dd')
            });
          }}
          className="ml-auto w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">
              {editingId ? 'Edit Video' : 'Add New Video'}
            </h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                placeholder="e.g. Sunday Choir Special"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Video Link (YouTube/TikTok/Drive)</label>
              <div className="relative">
                <input
                  type="url"
                  value={formData.youtube_url}
                  onChange={e => setFormData({ ...formData, youtube_url: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Paste YouTube, TikTok, or Google Drive link here..."
                />
                <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              <p className="text-[9px] text-gray-400 italic mt-1 ml-1">Supports: youtube.com, tiktok.com, drive.google.com</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Direct Video Upload</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={e => handleFileUpload(e, 'video')}
                    className="hidden"
                    id="video-upload"
                  />
                  <label
                    htmlFor="video-upload"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors relative overflow-hidden"
                  >
                    {uploading && (
                      <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                    )}
                    <div className="relative flex items-center gap-2">
                      <Upload className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-bold text-gray-600 truncate">
                        {uploading ? 'Uploading...' : formData.video_url ? 'Video Uploaded' : 'Upload Video'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Thumbnail Image</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileUpload(e, 'thumbnail')}
                    className="hidden"
                    id="thumb-upload"
                  />
                  <label
                    htmlFor="thumb-upload"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors relative overflow-hidden"
                  >
                    {uploading && (
                      <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                    )}
                    <div className="relative flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-bold text-gray-600 truncate">
                        {uploading ? 'Uploading...' : formData.thumbnail_url ? 'Image Uploaded' : 'Upload Image'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Recorded Date</label>
                <input
                  type="date"
                  value={formData.recorded_date}
                  onChange={e => setFormData({ ...formData, recorded_date: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Description (Optional)</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none min-h-[100px]"
                placeholder="Briefly describe the video..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full py-4 bg-primary text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving || uploading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" /> {editingId ? 'Update Video' : 'Add Video'}
              </>
            )}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-24 bg-gray-50 rounded-2xl animate-pulse" />
          ))
        ) : videos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-bold">No videos added yet.</p>
          </div>
        ) : (
          videos.map((video) => (
            <div key={video.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-16 h-16 bg-lavender rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                <Video className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black uppercase rounded-full">
                    {video.category}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold">
                    {format(new Date(video.recorded_date), 'MMM dd, yyyy')}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {video.views || 0}
                  </span>
                </div>
                <h4 className="font-bold text-gray-800 truncate">{video.title}</h4>
                <p className="text-[10px] text-gray-400 truncate">{video.youtube_url}</p>
              </div>
              {deleteConfirmId === video.id ? (
                <div className="flex items-center gap-1 animate-in zoom-in-95 duration-200">
                  <button onClick={() => setDeleteConfirmId(null)} className="p-2 text-gray-400 bg-gray-50 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(video.id)} className="px-3 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg">
                    Delete
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(video)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteConfirmId(video.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
