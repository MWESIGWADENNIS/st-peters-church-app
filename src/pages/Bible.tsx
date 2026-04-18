import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Book, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  Settings, 
  Type, 
  ArrowLeft,
  BookOpen,
  Languages,
  Loader2,
  Menu,
  ChevronDown
} from 'lucide-react';
import { 
  getBibles, 
  getBibleBooks, 
  getBibleChapters, 
  getChapterContent, 
  BibleVersion, 
  BibleBook, 
  BibleChapter
} from '../services/bibleService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

type ViewMode = 'bibles' | 'books' | 'chapters' | 'reader';

export default function Bible() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('bibles');
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  
  // Selection State
  const [bibles, setBibles] = useState<BibleVersion[]>([]);
  const [selectedBible, setSelectedBible] = useState<BibleVersion | null>(null);
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [chapters, setChapters] = useState<{ id: string; number: string }[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<{ id: string; number: string } | null>(null);
  const [content, setContent] = useState<BibleChapter | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [showSettings, setShowSettings] = useState(false);
  const readerRef = useRef<HTMLDivElement>(null);

  // Major versions filter
  const MAJOR_VERSIONS = ['NIV', 'GNT', 'KJV', 'AMP', 'ESV'];
  const MAJOR_LANGUAGES = ['Luganda'];

  useEffect(() => {
    loadBiblesAndHandleDeepLink();
  }, [searchParams]);

  const loadBiblesAndHandleDeepLink = async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      const data = await getBibles();
      setBibles(data);

      // Handle deep linking
      const vId = searchParams.get('v');
      const bId = searchParams.get('b');
      const cId = searchParams.get('c');

      if (vId && data.length > 0) {
        const bible = data.find(b => b.id === vId || b.abbreviation === vId);
        if (bible) {
          setSelectedBible(bible);
          const bookData = await getBibleBooks(bible.id);
          setBooks(bookData);

          if (bId) {
            const book = bookData.find(b => b.id === bId || b.abbreviation === bId);
            if (book) {
              setSelectedBook(book);
              const chapterData = await getBibleChapters(bible.id, book.id);
              setChapters(chapterData);

              if (cId) {
                const chapter = chapterData.find(c => c.number === cId || c.id === cId);
                if (chapter) {
                  setSelectedChapter(chapter);
                  const contentData = await getChapterContent(bible.id, chapter.id);
                  if (contentData) {
                    setContent(contentData);
                    setViewMode('reader');
                  }
                } else {
                  setViewMode('chapters');
                }
              } else {
                setViewMode('chapters');
              }
            } else {
              setViewMode('books');
            }
          } else {
            setViewMode('books');
          }
        }
      } else if (!vId && !loading && data.length > 0) {
        // Handle offline/default fallback: show last read chapter
        const lastVId = localStorage.getItem('last_read_bible_id');
        const lastCId = localStorage.getItem('last_read_chapter_id');

        if (lastVId && lastCId) {
          const bible = data.find(b => b.id === lastVId);
          if (bible) {
            setSelectedBible(bible);
            const bookData = await getBibleBooks(bible.id);
            setBooks(bookData);
            
            // Note: In a real app we'd need the book ID too, 
            // but chapterId in api.bible is often specific enough or contains the book ID.
            // For now, let's just fetch the chapter content as that's what's cached.
            const contentData = await getChapterContent(bible.id, lastCId);
            if (contentData) {
              setContent(contentData);
              // Find book and chapter metadata to keep UI consistent
              const book = bookData.find(b => b.id === contentData.bookId);
              if (book) {
                setSelectedBook(book);
                const chapterData = await getBibleChapters(bible.id, book.id);
                setChapters(chapterData);
                const chapter = chapterData.find(c => c.id === lastCId);
                if (chapter) setSelectedChapter(chapter);
              }
              setViewMode('reader');
            }
          }
        }
      }
    } catch (e: any) {
      if (e.response?.status === 401 || e.response?.status === 403) {
        setErrorStatus(e.response.status);
      } else {
        console.error('Bible load error:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBibleSelect = async (bible: BibleVersion) => {
    setSelectedBible(bible);
    setSearchQuery('');
    setLoading(true);
    try {
      const bookData = await getBibleBooks(bible.id);
      setBooks(bookData);
      setViewMode('books');
    } catch (e) {
      toast.error('Could not load books for this version.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSelect = async (book: BibleBook) => {
    setSelectedBook(book);
    setSearchQuery(''); // Reset search for the next view
    setLoading(true);
    const chapterData = await getBibleChapters(selectedBible!.id, book.id);
    setChapters(chapterData);
    setViewMode('chapters');
    setLoading(false);
  };

  const handleChapterSelect = async (chapter: { id: string; number: string }) => {
    setSelectedChapter(chapter);
    setLoading(true);
    const data = await getChapterContent(selectedBible!.id, chapter.id);
    if (data) {
      setContent(data);
      setViewMode('reader');
      if (readerRef.current) readerRef.current.scrollTop = 0;
    } else {
      toast.error('Could not load chapter. Please check your API key.');
    }
    setLoading(false);
  };

  const goBack = () => {
    setSearchQuery(''); // Clear search when moving between different navigation levels
    if (viewMode === 'reader') setViewMode('chapters');
    else if (viewMode === 'chapters') setViewMode('books');
    else if (viewMode === 'books') setViewMode('bibles');
    else navigate(-1);
  };

  const majorBibles = bibles.filter(b => 
    MAJOR_VERSIONS.some(v => b.abbreviation?.toUpperCase().includes(v)) || 
    MAJOR_LANGUAGES.some(l => b.language.name.toLowerCase().includes(l.toLowerCase())) ||
    b.name.toLowerCase().includes('luganda')
  );

  const otherBibles = bibles.filter(b => !majorBibles.find(m => m.id === b.id));

  const filteredBibles = searchQuery || showAll
    ? bibles.filter(b => 
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        b.language.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.abbreviation?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : majorBibles;

  const filteredBooks = books.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <h1 className="text-lg font-black text-primary leading-tight">
                {viewMode === 'bibles' && 'Select Version'}
                {viewMode === 'books' && selectedBible?.abbreviation}
                {viewMode === 'chapters' && selectedBook?.name}
                {viewMode === 'reader' && `${selectedBook?.abbreviation} ${selectedChapter?.number}`}
              </h1>
              {viewMode !== 'bibles' && (
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {selectedBible?.name}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {viewMode === 'reader' && (
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-400 hover:text-primary transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={() => {
                setSelectedBible(null);
                setSelectedBook(null);
                setSelectedChapter(null);
                setViewMode('bibles');
                setSearchQuery('');
              }}
              className="p-2 text-gray-400 hover:text-primary transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 overflow-y-auto" ref={readerRef}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-[60vh] gap-3"
            >
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Opening Scripture...</p>
            </motion.div>
          ) : errorStatus === 401 || errorStatus === 403 ? (
            <motion.div 
              key="auth-error"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="p-8 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <Settings className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-gray-900">
                  {errorStatus === 401 ? 'Key Unauthorized' : 'Access Forbidden'}
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {errorStatus === 401 ? (
                    "The Bible API is rejecting your key. Please check for typos and ensure you copied the entire key."
                  ) : (
                    "Your key is valid, but you don't have permission for this content. You may need to 'Request Access' for specific Bible versions in the portal."
                  )}
                </p>
              </div>
              
              <div className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Next Steps:</p>
                <ol className="text-xs text-gray-600 space-y-2 ml-4 list-decimal">
                  <li>In your <a href="https://scripture.api.bible" target="_blank" className="text-primary underline">portal</a>, click on <strong>Bibles</strong> (or <strong>Translations</strong>).</li>
                  <li>Search for <strong>Luganda</strong> or <strong>Lumasaaba</strong>.</li>
                  <li>If it says <strong>"Request Access"</strong>, click it and wait for approval.</li>
                  <li>KJV should work instantly—try searching for that first.</li>
                </ol>
              </div>

              <button 
                onClick={() => loadBiblesAndHandleDeepLink()}
                className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
              >
                Refresh Connection
              </button>
            </motion.div>
          ) : viewMode === 'bibles' ? (
            <motion.div 
              key="bibles"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-6"
            >
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search Bible or Language..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                />
              </div>

              {/* All Versions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                    {searchQuery ? 'Search Results' : showAll ? 'All Versions' : 'Major Versions'}
                  </h3>
                  {!searchQuery && !showAll && (
                    <button 
                      onClick={() => setShowAll(true)}
                      className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                    >
                      Show All
                    </button>
                  )}
                  {(searchQuery || showAll) && (
                    <span className="text-[10px] font-bold text-primary/40 bg-primary/5 px-2 py-1 rounded-md">
                      {filteredBibles.length} Versions
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {filteredBibles.length > 0 ? (
                    filteredBibles.map((bible) => (
                      <button
                        key={bible.id}
                        onClick={() => handleBibleSelect(bible)}
                        className="w-full bg-white p-5 rounded-[2rem] border border-gray-100 flex items-center justify-between hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all group active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-4 text-left">
                          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                            <BookOpen className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors">{bible.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{bible.language.name}</span>
                              {bible.abbreviation && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-gray-200" />
                                  <span className="text-[10px] font-black text-primary/50 uppercase tracking-widest">{bible.abbreviation}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
                      </button>
                    ))
                  ) : (
                    <div className="py-20 text-center space-y-3">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                        <Search className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No versions found</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : viewMode === 'books' ? (
            <motion.div 
              key="books"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder={`Search in ${selectedBible?.name}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-2">
                {filteredBooks.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => handleBookSelect(book)}
                    className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-50 hover:border-primary hover:bg-primary/5 transition-all group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-lavender flex items-center justify-center text-primary font-black text-xs group-hover:bg-primary group-hover:text-white transition-all">
                        {book.abbreviation}
                      </div>
                      <span className="font-bold text-gray-800 text-sm">{book.name}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            </motion.div>
          ) : viewMode === 'chapters' ? (
            <motion.div 
              key="chapters"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              <h3 className="text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-10">Select Chapter</h3>
              <div className="grid grid-cols-4 gap-4 max-w-sm mx-auto">
                {chapters.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => handleChapterSelect(ch)}
                    className="aspect-square flex items-center justify-center font-black text-lg bg-gray-50 text-gray-400 rounded-2xl border border-transparent hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-90"
                  >
                    {ch.number}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="reader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "p-6 pb-20 prose prose-slate max-w-none bible-content",
                fontSize === 'sm' && "text-sm",
                fontSize === 'base' && "text-base",
                fontSize === 'lg' && "text-lg",
                fontSize === 'xl' && "text-xl font-medium"
              )}
            >
              <div 
                dangerouslySetInnerHTML={{ __html: content?.content || '' }} 
                className="leading-relaxed"
              />
              
              {/* Navigation at bottom of chapter */}
              <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between gap-4">
                <button 
                  disabled={!content?.previous}
                  onClick={() => content?.previous && handleChapterSelect(content.previous)}
                  className="flex-1 flex items-center justify-center gap-2 p-4 bg-gray-50 rounded-2xl font-bold text-gray-400 disabled:opacity-30"
                >
                  <ChevronLeft className="w-5 h-5" /> Previous
                </button>
                <button 
                  disabled={!content?.next}
                  onClick={() => content?.next && handleChapterSelect(content.next)}
                  className="flex-1 flex items-center justify-center gap-2 p-4 bg-primary text-white rounded-2xl font-black disabled:opacity-30"
                >
                  Next <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Settings Overlay */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-0 bottom-0 z-50 p-6 bg-white rounded-t-[2.5rem] shadow-2xl border-t border-gray-100"
          >
            <div className="max-w-md mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Reading Settings</h3>
                <button onClick={() => setShowSettings(false)} className="p-2 bg-gray-50 rounded-full">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Font Size</label>
                <div className="flex p-1 bg-gray-50 rounded-2xl">
                  {['sm', 'base', 'lg', 'xl'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size as any)}
                      className={cn(
                        "flex-1 py-3 rounded-xl font-black uppercase text-[10px] transition-all",
                        fontSize === size ? "bg-white text-primary shadow-sm" : "text-gray-400"
                      )}
                    >
                      {size === 'base' ? 'Normal' : size.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setShowSettings(false)}
                className="w-full py-4 bg-primary text-white font-black rounded-2xl uppercase tracking-widest text-xs"
              >
                Close Settings
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Global Style for Bible Content */}
      <style>{`
        .bible-content h3 { font-family: var(--font-display); font-weight: 900; margin-bottom: 1rem; color: var(--color-primary); }
        .bible-content p { margin-bottom: 1.5rem; line-height: 1.8; }
        .bible-content .v { font-weight: 900; color: var(--color-primary); font-size: 0.7em; margin-right: 0.5em; vertical-align: super; opacity: 0.5; }
        .bible-content .s1 { font-family: var(--font-display); font-weight: 900; font-size: 1.25em; margin: 2rem 0 1rem; color: #111; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.5rem; }
      `}</style>
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
