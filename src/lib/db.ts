/**
 * IndexedDB wrapper for local storage
 */

export interface Wordbook {
  id: string;
  name: string;
  description?: string;
  level?: string;
  created_at: string;
  updated_at: string;
}

export interface CardMeaning {
  part_of_speech: string;
  meaning_zh?: string;
  meaning_en?: string;
  synonyms: string[];
  antonyms: string[];
  examples: string[];
}

export interface Card {
  id: string;
  wordbook_id: string;
  headword: string;
  phonetic?: string;
  meanings: CardMeaning[];
  notes?: string;
  star: boolean;
  image_uri?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// Combined card with stats and SRS for app usage
export interface CardWithDetails extends Card {
  stats: {
    shown_count: number;
    wrong_count: number;
    right_count: number;
  };
  srs: {
    due_at: string;
    interval_days: number;
    ease: number;
    repetitions: number;
  };
}

export interface CardStats {
  id: string;
  card_id: string;
  shown_count: number;
  right_count: number;
  wrong_count: number;
  last_reviewed_at?: string;
}

export interface CardSRS {
  id: string;
  card_id: string;
  ease: number;
  interval_days: number;
  repetitions: number;
  due_at: string;
}

export interface UserSettings {
  id: string;
  daily_goal: number;
  theme: 'light' | 'dark' | 'system';
  tts_enabled: boolean;
  tts_voice?: string;
  tts_auto_play?: boolean;
  display_direction?: string;
  reminder_enabled?: boolean;
  reminder_time?: string;
  reminder_days?: string[];
  gemini_api_key?: string;
  review_mode?: 'traditional' | 'srs'; // Traditional = yesterday review, SRS = spaced repetition
  errorCardsFilterMode?: 'top-n' | 'min-errors' | 'min-error-rate';
  errorCardsTopN?: number;
  errorCardsMinErrors?: number;
  errorCardsMinErrorRate?: number;
  firebase_uid?: string;
  auto_backup_enabled?: boolean; // 確保這個也存在
  auto_backup_time?: string; // 例如 "HH:MM" 格式
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'review' | 'goal' | 'wordbook' | 'streak' | 'system';
  read: boolean;
  created_at: string;
  related_data?: any; // Optional data like wordbook_id, card count, etc.
}

export interface DailyReviewRecord {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  review_count: number;
  correct_count: number;
  wrong_count: number;
  card_ids: string[]; // List of card IDs reviewed that day
  created_at: string;
  updated_at: string;
}

function logIndexedDBError(operation: string, error: DOMException | null) {
  console.error(`IndexedDB Error in ${operation}:`, error);
  // TODO: Integrate with a global toast notification system if needed
}

import { db as firestoreDb, auth } from './firebase';
import { doc, setDoc, deleteDoc, collection, query, getDocs, writeBatch, QuerySnapshot, DocumentData, updateDoc, deleteField } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { ref, uploadString, getDownloadURL } from 'firebase/storage'; // Import Storage functions
import { storage } from './firebase'; // Import storage instance

const DB_NAME = 'vocabulary_flow';
const DB_VERSION = 3;

// Helper function to get Firestore document reference for a given path
const getFirestoreDocRef = (user: User, collectionName: string, docId: string) => {
  return doc(firestoreDb, `users/${user.uid}/${collectionName}/${docId}`);
};


function cleanupUndefined(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(v => cleanupUndefined(v));
  }
  if (typeof obj === 'object') {
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        newObj[key] = cleanupUndefined(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

class VocabularyDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        logIndexedDBError('init', request.error);
        reject(request.error);
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;

        // Wordbooks store
        if (!db.objectStoreNames.contains('wordbooks')) {
          const wordbookStore = db.createObjectStore('wordbooks', { keyPath: 'id' });
          wordbookStore.createIndex('created_at', 'created_at');
        }

        // Cards store
        if (!db.objectStoreNames.contains('cards')) {
          const cardStore = db.createObjectStore('cards', { keyPath: 'id' });
          cardStore.createIndex('wordbook_id', 'wordbook_id');
          cardStore.createIndex('headword', 'headword');
        }

        // Card stats store
        if (!db.objectStoreNames.contains('card_stats')) {
          const statsStore = db.createObjectStore('card_stats', { keyPath: 'id' });
          statsStore.createIndex('card_id', 'card_id');
        }

        // Card SRS store
        if (!db.objectStoreNames.contains('card_srs')) {
          const srsStore = db.createObjectStore('card_srs', { keyPath: 'id' });
          srsStore.createIndex('card_id', 'card_id');
          srsStore.createIndex('due_at', 'due_at');
        }

        // User settings store
        if (!db.objectStoreNames.contains('user_settings')) {
          db.createObjectStore('user_settings', { keyPath: 'id' });
        }

        // Daily review records store (Version 2)
        if (oldVersion < 2 && !db.objectStoreNames.contains('daily_review_records')) {
          const dailyStore = db.createObjectStore('daily_review_records', { keyPath: 'id' });
          dailyStore.createIndex('date', 'date', { unique: true });
        }

        // Notifications store (Version 3)
        if (oldVersion < 3 && !db.objectStoreNames.contains('notifications')) {
          const notifStore = db.createObjectStore('notifications', { keyPath: 'id' });
          notifStore.createIndex('created_at', 'created_at');
          notifStore.createIndex('read', 'read');
        }
      };
    });
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }


  // Wordbooks
  async getAllWordbooks(offset: number = 0, limit: number = Infinity): Promise<Wordbook[]> {
    const store = await this.getStore('wordbooks');
    return new Promise((resolve, reject) => {
      const results: Wordbook[] = [];
      let count = 0;
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (count >= offset && results.length < limit) {
            results.push(cursor.value);
          }
          count++;
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => {
        logIndexedDBError('getAllWordbooks', request.error);
        reject(request.error);
      };
    });
  }

  async getWordbook(id: string): Promise<Wordbook | undefined> {
    const store = await this.getStore('wordbooks');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        logIndexedDBError('getWordbook', request.error);
        reject(request.error);
      };
    });
  }

  async createWordbook(wordbook: Omit<Wordbook, 'id' | 'created_at' | 'updated_at'>): Promise<Wordbook> {
    const store = await this.getStore('wordbooks', 'readwrite');
    const now = new Date().toISOString();
    const newWordbook: Wordbook = {
      id: crypto.randomUUID(),
      ...wordbook,
      created_at: now,
      updated_at: now,
    };
    return new Promise((resolve, reject) => {
      const request = store.add(newWordbook);
      request.onsuccess = () => {
        resolve(newWordbook);
      };
      request.onerror = () => {
        logIndexedDBError('createWordbook', request.error);
        reject(request.error);
      };
    });
  }

  async updateWordbook(id: string, updates: Partial<Wordbook>): Promise<Wordbook> {
    const store = await this.getStore('wordbooks', 'readwrite');
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (!existing) {
          reject(new Error('Wordbook not found'));
          return;
        }
        
        const updated: Wordbook = {
          ...existing,
          ...updates,
          id,
          updated_at: new Date().toISOString(),
        };
        
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => {
          resolve(updated);
        };
        putRequest.onerror = () => {
          logIndexedDBError('updateWordbook.put', putRequest.error);
          reject(putRequest.error);
        };
      };
      
      getRequest.onerror = () => {
        logIndexedDBError('updateWordbook.get', getRequest.error);
        reject(getRequest.error);
      };
    });
  }

  async deleteWordbook(id: string): Promise<void> {
    const store = await this.getStore('wordbooks', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        logIndexedDBError('deleteWordbook', request.error);
        reject(request.error);
      };
    });
  }

  // Cards
  async getCardsByWordbook(wordbookId: string, offset: number = 0, limit: number = Infinity): Promise<Card[]> {
    const store = await this.getStore('cards');
    const index = store.index('wordbook_id');
    return new Promise((resolve, reject) => {
      const results: Card[] = [];
      let count = 0;
      const request = index.openCursor(IDBKeyRange.only(wordbookId));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (count >= offset && results.length < limit) {
            results.push(cursor.value);
          }
          count++;
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => {
        logIndexedDBError('getCardsByWordbook', request.error);
        reject(request.error);
      };
    });
  }

  async getCard(id: string): Promise<Card | undefined> {
    const store = await this.getStore('cards');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        logIndexedDBError('getCard', request.error);
        reject(request.error);
      };
    });
  }

  async createCard(card: Omit<Card, 'id' | 'created_at' | 'updated_at'>): Promise<Card> {
    const store = await this.getStore('cards', 'readwrite');
    const now = new Date().toISOString();
    const newCard: Card = {
      id: crypto.randomUUID(),
      star: false,
      tags: [],
      ...card,
      created_at: now,
      updated_at: now,
    };
    return new Promise((resolve, reject) => {
      const request = store.add(newCard);
      request.onsuccess = () => {
        resolve(newCard);
      };
      request.onerror = () => {
        logIndexedDBError('createCard', request.error);
        reject(request.error);
      };
    });
  }

  async updateCard(id: string, updates: Partial<Card>): Promise<Card> {
    const store = await this.getStore('cards', 'readwrite');
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (!existing) {
          reject(new Error('Card not found'));
          return;
        }
        
        const updated: Card = {
          ...existing,
          ...updates,
          id,
          updated_at: new Date().toISOString(),
        };
        
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => {
          resolve(updated);
        };
        putRequest.onerror = () => {
          logIndexedDBError('updateCard.put', putRequest.error);
          reject(putRequest.error);
        };
      };
      
      getRequest.onerror = () => {
        logIndexedDBError('updateCard.get', getRequest.error);
        reject(getRequest.error);
      };
    });
  }

  async deleteCard(id: string): Promise<void> {
    const store = await this.getStore('cards', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        logIndexedDBError('deleteCard', request.error);
        reject(request.error);
      };
    });
  }

  // Card Stats
  async getCardStats(cardId: string): Promise<CardStats | undefined> {
    const store = await this.getStore('card_stats');
    const index = store.index('card_id');
    return new Promise((resolve, reject) => {
      const request = index.get(cardId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        logIndexedDBError('getCardStats', request.error);
        reject(request.error);
      };
    });
  }

  async createOrUpdateCardStats(cardId: string, updates: Partial<CardStats>): Promise<CardStats> {
    const existing = await this.getCardStats(cardId);
    const store = await this.getStore('card_stats', 'readwrite');
    
    const stats: CardStats = existing 
      ? { ...existing, ...updates }
      : {
          id: crypto.randomUUID(),
          card_id: cardId,
          shown_count: 0,
          right_count: 0,
          wrong_count: 0,
          ...updates,
        };
    
    return new Promise((resolve, reject) => {
      const request = existing ? store.put(stats) : store.add(stats);
      request.onsuccess = () => {
        resolve(stats);
      };
      request.onerror = () => {
        logIndexedDBError('createOrUpdateCardStats', request.error);
        reject(request.error);
      };
    });
  }

  // Card SRS
  async getCardSRS(cardId: string): Promise<CardSRS | undefined> {
    const store = await this.getStore('card_srs');
    const index = store.index('card_id');
    return new Promise((resolve, reject) => {
      const request = index.get(cardId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        logIndexedDBError('getCardSRS', request.error);
        reject(request.error);
      };
    });
  }

  async createOrUpdateCardSRS(cardId: string, updates: Partial<CardSRS>): Promise<CardSRS> {
    const existing = await this.getCardSRS(cardId);
    const store = await this.getStore('card_srs', 'readwrite');
    
    const srs: CardSRS = existing 
      ? { ...existing, ...updates }
      : {
          id: crypto.randomUUID(),
          card_id: cardId,
          ease: 2.5,
          interval_days: 1,
          repetitions: 0,
          due_at: new Date().toISOString(),
          ...updates,
        };
    
    return new Promise((resolve, reject) => {
      const request = existing ? store.put(srs) : store.add(srs);
      request.onsuccess = () => {
        resolve(srs);
      };
      request.onerror = () => {
        logIndexedDBError('createOrUpdateCardSRS', request.error);
        reject(request.error);
      };
    });
  }

  async getDueCards(): Promise<CardSRS[]> {
    const store = await this.getStore('card_srs');
    const index = store.index('due_at');
    const now = new Date().toISOString();
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.upperBound(now));
      const results: CardSRS[] = [];
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => {
        logIndexedDBError('getDueCards', request.error);
        reject(request.error);
      };
    });
  }

  // User Settings
  async getUserSettings(): Promise<UserSettings> {
    const store = await this.getStore('user_settings');
    return new Promise((resolve, reject) => {
      const request = store.get('default');
      request.onsuccess = () => {
        const result = request.result || {
          id: 'default',
          daily_goal: 20,
          theme: 'system',
          tts_enabled: true,
          errorCardsFilterMode: 'top-n', // Default value
          errorCardsTopN: 20, // Default value
          errorCardsMinErrors: 3, // Default value
          errorCardsMinErrorRate: 50, // Default value
        };
        resolve(result);
      };
      request.onerror = () => {
        logIndexedDBError('getUserSettings', request.error);
        reject(request.error);
      };
    });
  }

  async updateUserSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    const existing = await this.getUserSettings();
    const store = await this.getStore('user_settings', 'readwrite');
    
    const settings: UserSettings = {
      ...existing,
      ...updates,
      id: 'default',
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(settings);
      request.onsuccess = () => {
        resolve(settings);
      };
      request.onerror = () => {
        logIndexedDBError('updateUserSettings', request.error);
        reject(request.error);
      };
    });
  }

  // Daily Review Records
  async getDailyReviewRecord(date: string): Promise<DailyReviewRecord | undefined> {
    const store = await this.getStore('daily_review_records');
    const index = store.index('date');
    return new Promise((resolve, reject) => {
      const request = index.get(date);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        logIndexedDBError('getDailyReviewRecord', request.error);
        reject(request.error);
      };
    });
  }

  async getAllDailyReviewRecords(): Promise<DailyReviewRecord[]> {
    const store = await this.getStore('daily_review_records');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        logIndexedDBError('getAllDailyReviewRecords', request.error);
        reject(request.error);
      };
    });
  }

  async createOrUpdateDailyReviewRecord(
    date: string,
    cardId: string,
    correct: boolean
  ): Promise<DailyReviewRecord> {
    const existing = await this.getDailyReviewRecord(date);
    const store = await this.getStore('daily_review_records', 'readwrite');
    const now = new Date().toISOString();

    const record: DailyReviewRecord = existing
      ? {
          ...existing,
          review_count: existing.review_count + 1,
          correct_count: existing.correct_count + (correct ? 1 : 0),
          wrong_count: existing.wrong_count + (correct ? 0 : 1),
          card_ids: existing.card_ids.includes(cardId)
            ? existing.card_ids
            : [...existing.card_ids, cardId],
          updated_at: now,
        }
      : {
          id: crypto.randomUUID(),
          date,
          review_count: 1,
          correct_count: correct ? 1 : 0,
          wrong_count: correct ? 0 : 1,
          card_ids: [cardId],
          created_at: now,
          updated_at: now,
        };

    return new Promise((resolve, reject) => {
      const request = store.put(record);
      request.onsuccess = () => {
        resolve(record);
      };
      request.onerror = () => {
        logIndexedDBError('createOrUpdateDailyReviewRecord', request.error);
        reject(request.error);
      };
    });
  }

  // Notifications
  async getAllNotifications(): Promise<Notification[]> {
    const store = await this.getStore('notifications');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const results = request.result;
        // Sort by created_at descending
        results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        resolve(results);
      };
      request.onerror = () => {
        logIndexedDBError('getAllNotifications', request.error);
        reject(request.error);
      };
    });
  }

  async getUnreadNotifications(): Promise<Notification[]> {
    const all = await this.getAllNotifications();
    return all.filter(n => !n.read);
  }

  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
    const store = await this.getStore('notifications', 'readwrite');
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      ...notification,
      created_at: new Date().toISOString(),
    };
    return new Promise((resolve, reject) => {
      const request = store.add(newNotification);
      request.onsuccess = () => {
        resolve(newNotification);
      };
      request.onerror = () => {
        logIndexedDBError('createNotification', request.error);
        reject(request.error);
      };
    });
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const store = await this.getStore('notifications', 'readwrite');
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const notification = getRequest.result;
        if (notification) {
          notification.read = true;
          const putRequest = store.put(notification);
          putRequest.onsuccess = () => {
            resolve();
          };
          putRequest.onerror = () => {
            logIndexedDBError('markNotificationAsRead.put', putRequest.error);
            reject(putRequest.error);
          };
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => {
        logIndexedDBError('markNotificationAsRead.get', getRequest.error);
        reject(getRequest.error);
      };
    });
  }

  async markAllNotificationsAsRead(): Promise<void> {
    const store = await this.getStore('notifications', 'readwrite');
    const all = await this.getAllNotifications();
    
    return new Promise((resolve, reject) => {
      const promises = all.map(notification => {
        notification.read = true;
        return new Promise<void>((res, rej) => {
          const request = store.put(notification);
          request.onsuccess = () => {
            res();
          };
          request.onerror = () => rej(request.error);
        });
      });
      
      Promise.all(promises)
        .then(() => resolve())
        .catch(error => {
          logIndexedDBError('markAllNotificationsAsRead', error);
          reject(error);
        });
    });
  }

  async deleteNotification(id: string): Promise<void> {
    const store = await this.getStore('notifications', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        logIndexedDBError('deleteNotification', request.error);
        reject(request.error);
      };
    });
  }

  // Export all data
  async exportAllData(isAutoBackup: boolean = false): Promise<{ downloadUrl: string, fileName: string }> {
    await this.init();
    
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated for cloud backup.");
    }

    // Open a single transaction for all reads to prevent transaction timeout
    const transaction = this.db!.transaction(
      ['wordbooks', 'cards', 'card_stats', 'card_srs', 'daily_review_records', 'notifications'],
      'readonly'
    );
    
    const wordbookStore = transaction.objectStore('wordbooks');
    const cardStore = transaction.objectStore('cards');
    const statsStore = transaction.objectStore('card_stats');
    const srsStore = transaction.objectStore('card_srs');
    const dailyStore = transaction.objectStore('daily_review_records');
    const notifStore = transaction.objectStore('notifications');

    // Get all data using the same transaction
    const [wordbooks, cards, cardStats, cardSrs, dailyRecords, notifications] = await Promise.all([
      new Promise<Wordbook[]>((resolve, reject) => {
        const request = wordbookStore.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          logIndexedDBError('exportAllData.wordbooks', request.error);
          reject(request.error);
        };
      }),
      new Promise<Card[]>((resolve, reject) => {
        const request = cardStore.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          logIndexedDBError('exportAllData.cards', request.error);
          reject(request.error);
        };
      }),
      new Promise<CardStats[]>((resolve, reject) => {
        const request = statsStore.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          logIndexedDBError('exportAllData.card_stats', request.error);
          reject(request.error);
        };
      }),
      new Promise<CardSRS[]>((resolve, reject) => {
        const request = srsStore.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          logIndexedDBError('exportAllData.card_srs', request.error);
          reject(request.error);
        };
      }),
      new Promise<DailyReviewRecord[]>((resolve, reject) => {
        const request = dailyStore.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          logIndexedDBError('exportAllData.daily_review_records', request.error);
          reject(request.error);
        };
      }),
      new Promise<Notification[]>((resolve, reject) => {
        const request = notifStore.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          logIndexedDBError('exportAllData.notifications', request.error);
          reject(request.error);
        };
      })
    ]);

    const data = {
      version: 3,
      wordbooks,
      cards,
      card_stats: cardStats,
      card_srs: cardSrs,
      daily_review_records: dailyRecords,
      notifications,
      settings: await this.getUserSettings(),
      exported_at: new Date().toISOString(),
    };

    const jsonData = JSON.stringify(data, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupType = isAutoBackup ? 'auto-backup' : 'manual-backup';
    const fileName = `vocabulary-flow-${backupType}-${timestamp}.json`;
    const storageRef = ref(storage, `users/${user.uid}/backups/${fileName}`);

    await uploadString(storageRef, jsonData, 'raw');
    const downloadUrl = await getDownloadURL(storageRef);

    return { downloadUrl, fileName };
  }

  // Import all data
  async importAllData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);

    // Clear existing data
    const stores = ['wordbooks', 'cards', 'card_stats', 'card_srs', 'daily_review_records', 'notifications'];
    for (const storeName of stores) {
      const store = await this.getStore(storeName, 'readwrite');
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => {
          logIndexedDBError(`importAllData.clear.${storeName}`, request.error);
          reject(request.error);
        };
      });
    }

    // Import wordbooks
    if (data.wordbooks) {
      const store = await this.getStore('wordbooks', 'readwrite');
      for (const item of data.wordbooks) {
        await new Promise((resolve, reject) => {
          const request = store.add(item);
          request.onsuccess = () => resolve(item);
          request.onerror = () => {
            logIndexedDBError('importAllData.add.wordbooks', request.error);
            reject(request.error);
          };
        });
      }
    }

    // Import cards
    if (data.cards) {
      const store = await this.getStore('cards', 'readwrite');
      for (const item of data.cards) {
        await new Promise((resolve, reject) => {
          const request = store.add(item);
          request.onsuccess = () => resolve(item);
          request.onerror = () => {
            logIndexedDBError('importAllData.add.cards', request.error);
            reject(request.error);
          };
        });
      }
    }

    // Import card stats
    if (data.card_stats) {
      const store = await this.getStore('card_stats', 'readwrite');
      for (const item of data.card_stats) {
        await new Promise((resolve, reject) => {
          const request = store.add(item);
          request.onsuccess = () => resolve(item);
          request.onerror = () => {
            logIndexedDBError('importAllData.add.card_stats', request.error);
            reject(request.error);
          };
        });
      }
    }

    // Import card SRS
    if (data.card_srs) {
      const store = await this.getStore('card_srs', 'readwrite');
      for (const item of data.card_srs) {
        await new Promise((resolve, reject) => {
          const request = store.add(item);
          request.onsuccess = () => resolve(item);
          request.onerror = () => {
            logIndexedDBError('importAllData.add.card_srs', request.error);
            reject(request.error);
          };
        });
      }
    }

    // Import daily review records
    if (data.daily_review_records) {
      const store = await this.getStore('daily_review_records', 'readwrite');
      for (const item of data.daily_review_records) {
        await new Promise((resolve, reject) => {
          const request = store.add(item);
          request.onsuccess = () => resolve(item);
          request.onerror = () => {
            logIndexedDBError('importAllData.add.daily_review_records', request.error);
            reject(request.error);
          };
        });
      }
    }

    // Import notifications
    if (data.notifications) {
      const store = await this.getStore('notifications', 'readwrite');
      for (const item of data.notifications) {
        await new Promise((resolve, reject) => {
          const request = store.add(item);
          request.onsuccess = () => resolve(item);
          request.onerror = () => {
            logIndexedDBError('importAllData.add.notifications', request.error);
            reject(request.error);
          };
        });
      }
    }

    // Import settings
    if (data.settings) {
      await this.updateUserSettings(data.settings);
    }
  }

  async uploadAllDataToFirestore(): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated for cloud sync.");
    }

    await this.init();

    const transaction = this.db!.transaction(
      ['wordbooks', 'cards', 'card_stats', 'card_srs', 'daily_review_records', 'notifications', 'user_settings'],
      'readonly'
    );

    const stores = {
      wordbooks: transaction.objectStore('wordbooks'),
      cards: transaction.objectStore('cards'),
      card_stats: transaction.objectStore('card_stats'),
      card_srs: transaction.objectStore('card_srs'),
      daily_review_records: transaction.objectStore('daily_review_records'),
      notifications: transaction.objectStore('notifications'),
      user_settings: transaction.objectStore('user_settings'),
    };

    const dataPromises = Object.entries(stores).map(([name, store]) => 
      new Promise<[string, any[]]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve([name, request.result]);
        request.onerror = () => reject(request.error);
      })
    );

    const allDataArray = await Promise.all(dataPromises);
    const allData = Object.fromEntries(allDataArray);

    const batch = writeBatch(firestoreDb);

    // Clear existing user data in Firestore before uploading
    for (const collectionName in stores) {
      const q = query(collection(firestoreDb, `users/${user.uid}/${collectionName}`));
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
    }
    await batch.commit();

    const newBatch = writeBatch(firestoreDb);

    for (const collectionName in allData) {
      for (const item of allData[collectionName]) {
        if (collectionName === 'user_settings') {
          const settingsToUpload = { ...item, id: user.uid };
          newBatch.set(getFirestoreDocRef(user, 'user_settings', 'default'), cleanupUndefined(settingsToUpload));
        } else {
          newBatch.set(getFirestoreDocRef(user, collectionName, item.id), cleanupUndefined(item));
        }
      }
    }

    await newBatch.commit();
    console.log("All data uploaded to Firestore successfully.");
  }

  async downloadAllDataFromFirestore(): Promise<any> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated for cloud sync.");
    }

    const collectionsToSync = [
      'wordbooks', 'cards', 'card_stats', 'card_srs', 
      'daily_review_records', 'notifications', 'user_settings'
    ];

    const data: { [key: string]: any[] } = {};

    for (const collectionName of collectionsToSync) {
      const q = query(collection(firestoreDb, `users/${user.uid}/${collectionName}`));
      const snapshot = await getDocs(q);
      data[collectionName] = snapshot.docs.map(doc => doc.data());
    }

    console.log("All data downloaded from Firestore successfully.");
    return data;
  }
}

export const db = new VocabularyDB();
