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
}

const DB_NAME = 'vocabulary_flow';
const DB_VERSION = 1;

class VocabularyDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

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
      };
    });
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Wordbooks
  async getAllWordbooks(): Promise<Wordbook[]> {
    const store = await this.getStore('wordbooks');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getWordbook(id: string): Promise<Wordbook | undefined> {
    const store = await this.getStore('wordbooks');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
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
      request.onsuccess = () => resolve(newWordbook);
      request.onerror = () => reject(request.error);
    });
  }

  async updateWordbook(id: string, updates: Partial<Wordbook>): Promise<Wordbook> {
    const store = await this.getStore('wordbooks', 'readwrite');
    const existing = await this.getWordbook(id);
    if (!existing) throw new Error('Wordbook not found');
    
    const updated: Wordbook = {
      ...existing,
      ...updates,
      id,
      updated_at: new Date().toISOString(),
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(updated);
      request.onsuccess = () => resolve(updated);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteWordbook(id: string): Promise<void> {
    const store = await this.getStore('wordbooks', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Cards
  async getCardsByWordbook(wordbookId: string): Promise<Card[]> {
    const store = await this.getStore('cards');
    const index = store.index('wordbook_id');
    return new Promise((resolve, reject) => {
      const request = index.getAll(wordbookId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getCard(id: string): Promise<Card | undefined> {
    const store = await this.getStore('cards');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
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
      request.onsuccess = () => resolve(newCard);
      request.onerror = () => reject(request.error);
    });
  }

  async updateCard(id: string, updates: Partial<Card>): Promise<Card> {
    const store = await this.getStore('cards', 'readwrite');
    const existing = await this.getCard(id);
    if (!existing) throw new Error('Card not found');
    
    const updated: Card = {
      ...existing,
      ...updates,
      id,
      updated_at: new Date().toISOString(),
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(updated);
      request.onsuccess = () => resolve(updated);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCard(id: string): Promise<void> {
    const store = await this.getStore('cards', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Card Stats
  async getCardStats(cardId: string): Promise<CardStats | undefined> {
    const store = await this.getStore('card_stats');
    const index = store.index('card_id');
    return new Promise((resolve, reject) => {
      const request = index.get(cardId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
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
      request.onsuccess = () => resolve(stats);
      request.onerror = () => reject(request.error);
    });
  }

  // Card SRS
  async getCardSRS(cardId: string): Promise<CardSRS | undefined> {
    const store = await this.getStore('card_srs');
    const index = store.index('card_id');
    return new Promise((resolve, reject) => {
      const request = index.get(cardId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
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
      request.onsuccess = () => resolve(srs);
      request.onerror = () => reject(request.error);
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
      request.onerror = () => reject(request.error);
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
        };
        resolve(result);
      };
      request.onerror = () => reject(request.error);
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
      request.onsuccess = () => resolve(settings);
      request.onerror = () => reject(request.error);
    });
  }

  // Export all data
  async exportAllData(): Promise<string> {
    const data = {
      wordbooks: await this.getAllWordbooks(),
      cards: [],
      card_stats: [],
      card_srs: [],
      settings: await this.getUserSettings(),
      exported_at: new Date().toISOString(),
    };

    // Get all cards, stats, and SRS data
    const cardStore = await this.getStore('cards');
    const statsStore = await this.getStore('card_stats');
    const srsStore = await this.getStore('card_srs');

    data.cards = await new Promise((resolve, reject) => {
      const request = cardStore.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    data.card_stats = await new Promise((resolve, reject) => {
      const request = statsStore.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    data.card_srs = await new Promise((resolve, reject) => {
      const request = srsStore.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return JSON.stringify(data, null, 2);
  }

  // Import all data
  async importAllData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);

    // Clear existing data
    const stores = ['wordbooks', 'cards', 'card_stats', 'card_srs'];
    for (const storeName of stores) {
      const store = await this.getStore(storeName, 'readwrite');
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    // Import wordbooks
    if (data.wordbooks) {
      const store = await this.getStore('wordbooks', 'readwrite');
      for (const item of data.wordbooks) {
        await new Promise((resolve, reject) => {
          const request = store.add(item);
          request.onsuccess = () => resolve(item);
          request.onerror = () => reject(request.error);
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
          request.onerror = () => reject(request.error);
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
          request.onerror = () => reject(request.error);
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
          request.onerror = () => reject(request.error);
        });
      }
    }

    // Import settings
    if (data.settings) {
      await this.updateUserSettings(data.settings);
    }
  }
}

export const db = new VocabularyDB();
