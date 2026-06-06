import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export interface ClientPreferences {
  procedures: string[];
  cities: string[];
  verifiedOnly: boolean;
  minRating: number;
}

export const usePreferences = (userId: string) => {
  const [preferences, setPreferences] = useState<ClientPreferences>({
    procedures: [],
    cities: [],
    verifiedOnly: false,
    minRating: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', userId));
        const data = snap.data();
        if (data?.preferences) {
          setPreferences(data.preferences as ClientPreferences);
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [userId]);

  const savePreferences = useCallback(async (prefs: ClientPreferences) => {
    try {
      await setDoc(doc(db, 'users', userId), { preferences: prefs }, { merge: true });
      setPreferences(prefs);
      return true;
    } catch (error) {
      console.error('Error saving preferences:', error);
      return false;
    }
  }, [userId]);

  return { preferences, loading, savePreferences };
};
