import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  BookOpen, 
  Save, 
  X, 
  Upload, 
  Youtube, 
  Music, 
  Video,
  Image as ImageIcon,
  Play,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';

type MediaType = 'youtube' | 'audio_upload' | 'video_upload';

export default function AdminSermons() {
  const navigate = useNavigate();
  const [sermons, setSermons] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [mediaType, setMediaType] = useState<MediaType>('youtube');
  const [formData, setFormData] = useState({
    title: '',
    preacher: '',
    description: '',
    bible_reference: '',
    sermon_date: format(new Date(), 'yyyy-MM-dd'),
    media_url: '',
    thumbnail_url: '',
    youtube_url: '',
    audio_url: '',
    series_id: '',
  });

  useEffect(() => {
    return () => {
      toast.dismiss();
    };
  }, []);

  useEffect(() => {
    fetchSermons();
    fetchSeries();
  }, []);

  const fetchSermons = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('sermons')
      .select('*, sermon_series(title)')
      .order('sermon_date', { ascending: false });
    if (data) setSermons(data);
    setLoading(false);
  };

  const fetchSeries = async () => {
    const { data } = await supabase
      .from('sermon_series')
      .select('*')
      .order('title');
    if (data) setSeries(data);
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas to Blob failed'));
          }, 'image/jpeg', 0.7);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'thumbnail' | 'audio' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size validation
    const maxSize = type === 'thumbnail' ? 20 * 1024 * 1024 : 200 * 1024 * 1024; // 20MB for images, 200MB for media
    if (file.size > maxSize) {
      toast.error(`File is too large. Max size for ${type} is ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    const toastId = toast.loading(`Preparing ${type}...`);

    try {
      setUploading(true);
      console.log(`Starting upload for ${type}:`, {
        name: file.name,
        size: file.size,
        type: file.type
      });

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

      const rawExt = file.name.split('.').pop() || '';
      const fileExt = type === 'thumbnail' ? 'jpg' : (rawExt.length > 5 ? 'bin' : rawExt);
      const fileName = `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const filePath = `sermons/${fileName}`;

      toast.loading(`Uploading ${type} (${(uploadFile.size / (1024 * 1024)).toFixed(2)}MB)...`, { id: toastId });

      console.log(`Uploading to Supabase: ${filePath}`, {
        contentType: file.type || 'application/octet-stream'
      });

      const { error: uploadError } = await supabase.storage
        .from('church-assets')
        .upload(filePath, uploadFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || undefined
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('church-assets')
        .getPublicUrl(filePath);

      if (type === 'thumbnail') {
        setFormData(prev => ({ ...prev, thumbnail_url: publicUrl }));
      } else if (type === 'audio') {
        setFormData(prev => ({ ...prev, audio_url: publicUrl, media_url: publicUrl }));
      } else if (type === 'video') {
        setFormData(prev => ({ ...prev, media_url: publicUrl }));
      }
      
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded!`, { id: toastId });
    } catch (error: any) {
      console.error('Upload Error:', error);
      toast.error(error.message || 'Upload failed.', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const finalData = {
      title: formData.title,
      preacher: formData.preacher,
      description: formData.description,
      bible_reference: formData.bible_reference,
      sermon_date: formData.sermon_date,
      thumbnail_url: formData.thumbnail_url,
      media_url: mediaType === 'youtube' ? formData.youtube_url : formData.media_url,
      youtube_url: mediaType === 'youtube' ? formData.youtube_url : null,
      audio_url: mediaType === 'audio_upload' ? formData.audio_url : null,
      series_id: formData.series_id || null,
      views: editingId ? undefined : 0 // Initialize views for new sermons
    };

    const loadingToast = toast.loading(editingId ? 'Updating sermon...' : 'Posting sermon...');

    try {
      console.log('Saving sermon:', finalData);
      
      if (editingId) {
        const { error } = await supabase.from('sermons').update(finalData).eq('id', editingId);
        if (error) throw error;
        
        // Optimistic update
        setSermons(prev => prev.map(s => s.id === editingId ? { ...s, ...finalData } : s));
        toast.success('Sermon updated!', { id: loadingToast });
      } else {
        const { data, error } = await supabase.from('sermons').insert(finalData).select().single();
        if (error) {
          console.error('Sermon Insert Error:', error);
          throw error;
        }
        
        // Optimistic update
        if (data) setSermons(prev => [data, ...prev].sort((a, b) => 
          new Date(b.sermon_date).getTime() - new Date(a.sermon_date).getTime()
        ));

        // Notify all users
        const { error: notifError } = await supabase.rpc('notify_all_users', {
          notif_title: 'New Sermon Posted!',
          notif_body: `${finalData.title} by ${finalData.preacher || 'Church Minister'}`,
          notif_type: 'sermon'
        });
        if (notifError) console.error('Notification error:', notifError);

        toast.success('Sermon posted!', { id: loadingToast });
      }
      
      resetForm();
      // fetchSermons(); // No need to re-fetch if we update optimistically
    } catch (error: any) {
      console.error('Sermon Save Error:', error);
      toast.error(error.message || 'Failed to save sermon.', { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: '',
      preacher: '',
      description: '',
      bible_reference: '',
      sermon_date: format(new Date(), 'yyyy-MM-dd'),
      media_url: '',
      thumbnail_url: '',
      youtube_url: '',
      audio_url: '',
      series_id: '',
    });
    setMediaType('youtube');
  };

  const handleEdit = (sermon: any) => {
    setFormData({
      title: sermon.title,
      preacher: sermon.preacher || '',
      description: sermon.description || '',
      bible_reference: sermon.bible_reference || '',
      sermon_date: sermon.sermon_date,
      thumbnail_url: sermon.thumbnail_url || '',
      media_url: sermon.media_url || '',
      youtube_url: sermon.youtube_url || '',
      audio_url: sermon.audio_url || '',
      series_id: sermon.series_id || '',
    });
    
    if (sermon.youtube_url) setMediaType('youtube');
    else if (sermon.audio_url) setMediaType('audio_upload');
    else setMediaType('video_upload');
    
    setEditingId(sermon.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sermon?')) return;
    try {
      const { error } = await supabase.from('sermons').delete().eq('id', id);
      if (error) throw error;
      toast.success('Deleted.');
      fetchSermons();
    } catch (error: any) {
      toast.error(error.message || 'Delete failed.');
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
          <h1 className="text-2xl font-black text-primary">Sermons</h1>
          <p className="text-xs text-gray-500 font-medium">Manage video and audio sermons.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="ml-auto w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 space-y-6 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">
              {editingId ? 'Edit Sermon' : 'New Sermon'}
            </h3>
            <button type="button" onClick={resetForm} className="text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Date</label>
                <input
                  type="date"
                  value={formData.sermon_date}
                  onChange={e => setFormData({ ...formData, sermon_date: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Preacher Name</label>
                <input
                  type="text"
                  value={formData.preacher}
                  onChange={e => setFormData({ ...formData, preacher: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. Rev. John Doe"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Sermon Series (Optional)</label>
                <select
                  value={formData.series_id}
                  onChange={e => setFormData({ ...formData, series_id: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="">No Series</option>
                  {series.map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Sermon Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. The Power of Grace"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Bible Reference</label>
              <input
                type="text"
                value={formData.bible_reference}
                onChange={e => setFormData({ ...formData, bible_reference: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                placeholder="e.g. John 3:16"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none min-h-[100px]"
                placeholder="Brief summary of the sermon..."
              />
            </div>

            {/* Media Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Media Type</label>
                <div className="text-[9px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full animate-pulse">
                  Tip: Use YouTube for fastest posting
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'youtube', icon: Youtube, label: 'YouTube' },
                  { id: 'audio_upload', icon: Music, label: 'Audio' },
                  { id: 'video_upload', icon: Video, label: 'Video' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setMediaType(type.id as MediaType)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all ${
                      mediaType === type.id 
                        ? 'bg-primary border-primary text-white shadow-md' 
                        : 'bg-gray-50 border-gray-100 text-gray-400'
                    }`}
                  >
                    <type.icon className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Media Input based on type */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              {mediaType === 'youtube' ? (
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Video Link (YouTube/TikTok/Drive)</label>
                  <input
                    type="url"
                    value={formData.youtube_url}
                    onChange={e => setFormData({ ...formData, youtube_url: e.target.value })}
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Paste YouTube, TikTok, or Google Drive link here..."
                  />
                  <p className="text-[9px] text-gray-400 italic">Supports: youtube.com, tiktok.com, drive.google.com</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {mediaType === 'audio_upload' ? 'Upload Audio File' : 'Upload Video File'}
                  </label>
                  <div className="flex items-center gap-4">
                    {formData.media_url && (
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        {mediaType === 'audio_upload' ? <Music className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                      </div>
                    )}
                    <label className="flex-1 px-4 py-3 bg-white rounded-xl border border-gray-100 flex items-center justify-center gap-2 cursor-pointer text-xs font-bold text-gray-500 hover:border-primary transition-colors relative overflow-hidden">
                      {uploading && (
                        <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                      )}
                      <div className="relative flex items-center gap-2">
                        <Upload className="w-4 h-4" /> 
                        {uploading ? 'Uploading...' : formData.media_url ? 'Change File' : 'Select File'}
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept={mediaType === 'audio_upload' ? 'audio/*, .mp3, .wav, .m4a, .aac, .ogg' : 'video/*, .mp4, .mov, .webm'} 
                        onChange={(e) => handleFileUpload(e, mediaType === 'audio_upload' ? 'audio' : 'video')}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Thumbnail Image</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center text-gray-300">
                  {formData.thumbnail_url ? (
                    <img src={formData.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6" />
                  )}
                </div>
                <label className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center gap-2 cursor-pointer text-xs font-bold text-gray-500 relative overflow-hidden">
                  {uploading && (
                    <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                  )}
                  <div className="relative flex items-center gap-2">
                    <Upload className="w-4 h-4" /> 
                    {uploading ? 'Uploading...' : formData.thumbnail_url ? 'Change Thumbnail' : 'Upload Thumbnail'}
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'thumbnail')} disabled={uploading} />
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading || saving}
            className="w-full py-4 bg-primary text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving || uploading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" /> {editingId ? 'Update Sermon' : 'Post Sermon'}
              </>
            )}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {loading ? (
          Array(5).fill(0).map((_, i) => <div key={i} className="h-24 bg-gray-50 rounded-2xl animate-pulse" />)
        ) : sermons.length > 0 ? (
          sermons.map((sermon) => (
            <div key={sermon.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-20 h-14 bg-lavender rounded-xl overflow-hidden flex-shrink-0 relative group">
                {sermon.thumbnail_url ? (
                  <img src={sermon.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary/20">
                    <BookOpen className="w-6 h-6" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-4 h-4 text-white fill-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 truncate">{sermon.title}</h4>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{sermon.preacher || 'Church Minister'}</p>
                  {sermon.sermon_series?.title && (
                    <>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <p className="text-[10px] text-rose-600 font-bold uppercase tracking-widest">{sermon.sermon_series.title}</p>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">{format(new Date(sermon.sermon_date), 'MMM dd, yyyy')}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(sermon)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(sermon.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No sermons posted yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
