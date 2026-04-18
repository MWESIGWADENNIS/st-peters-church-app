import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'st_peters_cache';
const DB_VERSION = 1;

export interface AppCache {
  daily_bread: any[];
  announcements: any[];
  sermons: any[];
  hymns: any[];
  schedule: any[];
  leadership: any[];
  settings: any;
  notices: any[];
  bible_chapters: { id: string; content: any }[];
}

let dbPromise: Promise<IDBPDatabase<any>> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('daily_bread', { keyPath: 'id' });
        db.createObjectStore('announcements', { keyPath: 'id' });
        db.createObjectStore('sermons', { keyPath: 'id' });
        db.createObjectStore('hymns', { keyPath: 'id' });
        db.createObjectStore('schedule', { keyPath: 'id' });
        db.createObjectStore('leadership', { keyPath: 'id' });
        db.createObjectStore('settings', { keyPath: 'id' });
        db.createObjectStore('notices', { keyPath: 'id' });
        db.createObjectStore('bible_chapters', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
};

export const persistenceService = {
  async set(storeName: keyof AppCache, data: any) {
    const db = await getDB();
    if (Array.isArray(data)) {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      await store.clear();
      for (const item of data) {
        await store.put(item);
      }
      await tx.done;
    } else {
      await db.put(storeName, { ...data, id: 'current' });
    }
  },

  async get(storeName: keyof AppCache): Promise<any> {
    const db = await getDB();
    if (storeName === 'settings') {
      return db.get(storeName, 'current');
    }
    return db.getAll(storeName);
  },

  async setBibleChapter(id: string, content: any) {
    const db = await getDB();
    await db.put('bible_chapters', { id, content });
  },

  async getBibleChapter(id: string) {
    const db = await getDB();
    return db.get('bible_chapters', id);
  }
};
