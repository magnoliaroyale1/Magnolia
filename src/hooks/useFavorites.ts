import { useState, useEffect } from 'react';
import { doc, setDoc, deleteDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Clinic } from '../types';

export const useFavorites = (userId: string) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetch = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'users', userId, 'favorites'));
        setFavorites(snapshot.docs.map(d => d.id));
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [userId]);

  const toggleFavorite = async (clinicId: string) => {
    try {
      if (favorites.includes(clinicId)) {
        await deleteDoc(doc(db, 'users', userId, 'favorites', clinicId));
        setFavorites(prev => prev.filter(id => id !== clinicId));
      } else {
        await setDoc(doc(db, 'users', userId, 'favorites', clinicId), { addedAt: new Date() });
        setFavorites(prev => [...prev, clinicId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const isFavorite = (clinicId: string) => favorites.includes(clinicId);

  return { favorites, loading, toggleFavorite, isFavorite };
};

export const useFavoriteClinics = (userId: string) => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetch = async () => {
      try {
        const favSnapshot = await getDocs(collection(db, 'users', userId, 'favorites'));
        const clinicIds = favSnapshot.docs.map(d => d.id);
        if (clinicIds.length === 0) {
          setLoading(false);
          return;
        }
        const q = query(collection(db, 'clinics'), where('__name__', 'in', clinicIds));
        const clinicSnapshot = await getDocs(q);
        setClinics(clinicSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Clinic)));
      } catch (error) {
        console.error('Error fetching favorite clinics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [userId]);

  return { clinics, loading };
};
