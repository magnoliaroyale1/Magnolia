import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, Timestamp, limit } from 'firebase/firestore';
import { db } from '../services/firebase';

interface SearchEntry {
  term: string;
  filters: Record<string, string>;
  createdAt: Timestamp;
}

export const useSearchHistory = (userId: string) => {
  const [history, setHistory] = useState<SearchEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetch = async () => {
      try {
        const q = query(
          collection(db, 'users', userId, 'searchHistory'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(q);
        setHistory(snapshot.docs.map(d => d.data() as SearchEntry));
      } catch (error) {
        console.error('Error fetching search history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [userId]);

  const saveSearch = async (term: string, filters: Record<string, string>) => {
    try {
      await addDoc(collection(db, 'users', userId, 'searchHistory'), {
        term,
        filters,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  return { history, loading, saveSearch };
};
