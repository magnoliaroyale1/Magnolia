import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { ProfessionalPortfolio } from '../types';

export const useProfessionalPortfolio = (professionalUid: string) => {
  const [portfolio, setPortfolio] = useState<ProfessionalPortfolio[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!professionalUid) return;
    try {
      const q = query(
        collection(db, 'professionals', professionalUid, 'portfolio'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setPortfolio(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ProfessionalPortfolio)));
    } catch (err) {
      console.error('Error fetching portfolio:', err);
    } finally {
      setLoading(false);
    }
  }, [professionalUid]);

  useEffect(() => { fetch(); }, [fetch]);

  return { portfolio, loading, refetch: fetch };
};

export const useAddPortfolioItem = () => {
  const [adding, setAdding] = useState(false);

  const addItem = async (professionalUid: string, data: { imageUrl: string; procedure: string; description: string }) => {
    setAdding(true);
    try {
      await addDoc(collection(db, 'professionals', professionalUid, 'portfolio'), {
        ...data,
        createdAt: Timestamp.now()
      });
      return true;
    } catch (err) {
      console.error('Error adding portfolio item:', err);
      return false;
    } finally {
      setAdding(false);
    }
  };

  return { addItem, adding };
};

export const useDeletePortfolioItem = () => {
  const [deleting, setDeleting] = useState(false);

  const deleteItem = async (professionalUid: string, itemId: string) => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'professionals', professionalUid, 'portfolio', itemId));
      return true;
    } catch (err) {
      console.error('Error deleting portfolio item:', err);
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return { deleteItem, deleting };
};
