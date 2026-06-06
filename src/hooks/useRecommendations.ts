import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Clinic } from '../types';
import type { ClientPreferences } from './usePreferences';

export const useRecommendations = (preferences: ClientPreferences | null) => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        let q = query(
          collection(db, 'clinics'),
          where('status', '==', 'approved'),
          orderBy('score', 'desc'),
          limit(6)
        );

        // If user has preferences with verified only
        if (preferences?.verifiedOnly) {
          q = query(
            collection(db, 'clinics'),
            where('status', '==', 'approved'),
            where('verified', '==', true),
            orderBy('score', 'desc'),
            limit(6)
          );
        }

        const snapshot = await getDocs(q);
        let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Clinic));

        // Filter by preferred procedures
        const procLen = preferences?.procedures?.length ?? 0;
        if (procLen > 0) {
          results = results.filter(c =>
            c.procedures?.some(p => preferences!.procedures!.includes(p))
          );
        }

        // Filter by preferred cities
        const citiesLen = preferences?.cities?.length ?? 0;
        if (citiesLen > 0) {
          results = results.filter(c =>
            preferences!.cities!.includes(c.address?.city)
          );
        }

        // Filter by min rating
        if (preferences?.minRating && preferences.minRating > 0) {
          results = results.filter(c => (c.rating || 0) >= preferences.minRating);
        }

        setClinics(results);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [preferences]);

  return { clinics, loading };
};
