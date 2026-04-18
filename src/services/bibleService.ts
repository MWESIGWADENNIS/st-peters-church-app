import axios from 'axios';
import { persistenceService } from './persistenceService';

const BIBLE_API_URL = 'https://rest.api.bible/v1';

const getApiKey = () => {
  const key = import.meta.env.VITE_BIBLE_API_KEY;
  if (!key) {
    console.warn('VITE_BIBLE_API_KEY is not defined in environment variables.');
  }
  return key;
};

const createBibleApi = () => {
  const key = getApiKey();
  return axios.create({
    baseURL: BIBLE_API_URL,
    headers: {
      'api-key': key || '',
      'Accept': 'application/json',
    },
  });
};

let bibleApi = createBibleApi();

// Helper to refresh API instance if key changes (useful for dev)
export const refreshBibleApi = () => {
  bibleApi = createBibleApi();
};

export interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  language: {
    id: string;
    name: string;
    script: string;
  };
  descriptionLocal?: string;
}

export interface BibleBook {
  id: string;
  name: string;
  nameLong: string;
  abbreviation: string;
}

export interface BibleChapter {
  id: string;
  bibleId: string;
  number: string;
  bookId: string;
  content: string;
  reference: string;
  next?: { id: string; number: string };
  previous?: { id: string; number: string };
}

export const getBibles = async (language?: string) => {
  const params = language ? { language } : {};
  const { data } = await bibleApi.get('/bibles', { params });
  return data.data as BibleVersion[];
};

export const getBibleBooks = async (bibleId: string) => {
  const { data } = await bibleApi.get(`/bibles/${bibleId}/books`);
  return data.data as BibleBook[];
};

export const getBibleChapters = async (bibleId: string, bookId: string) => {
  try {
    const { data } = await bibleApi.get(`/bibles/${bibleId}/books/${bookId}/chapters`);
    return data.data as { id: string; number: string }[];
  } catch (error) {
    console.error(`Error fetching chapters for book ${bookId}:`, error);
    return [];
  }
};

export const getChapterContent = async (bibleId: string, chapterId: string) => {
  try {
    // Check if we are offline and have cached content
    if (!navigator.onLine) {
      const cached = await persistenceService.getBibleChapter(chapterId);
      if (cached) return cached.content as BibleChapter;
    }

    // We request html format for better viewing
    const { data } = await bibleApi.get(`/bibles/${bibleId}/chapters/${chapterId}`, {
      params: {
        'content-type': 'html',
        'include-notes': false,
        'include-titles': true,
        'include-chapter-numbers': false,
        'include-verse-numbers': true,
        'include-verse-spans': false,
      },
    });

    const content = data.data as BibleChapter;
    
    // Save to cache for offline use
    await persistenceService.setBibleChapter(chapterId, content);
    localStorage.setItem('last_read_chapter_id', chapterId);
    localStorage.setItem('last_read_bible_id', bibleId);
    
    return content;
  } catch (error) {
    console.error(`Error fetching content for chapter ${chapterId}:`, error);
    // Try fallback to cache on error
    const cached = await persistenceService.getBibleChapter(chapterId);
    if (cached) return cached.content as BibleChapter;
    return null;
  }
};

export const searchBibleVersions = async (query: string) => {
  const allBibles = await getBibles();
  return allBibles.filter(b => 
    b.name.toLowerCase().includes(query.toLowerCase()) || 
    b.language.name.toLowerCase().includes(query.toLowerCase()) ||
    b.abbreviation.toLowerCase().includes(query.toLowerCase())
  );
};
