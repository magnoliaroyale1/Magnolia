import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Clinic } from '../types';

export const useClinics = (status?: 'pending' | 'approved' | 'rejected') => {
  const [clinics, setClinics] = useState<Clinic[]>([]);  // ✅ Corrigido: << para <
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        setLoading(true);
        let q;
        
        if (status) {
          q = query(
            collection(db, 'clinics'), 
            where('status', '==', status),
            orderBy('createdAt', 'desc'),
            limit(100)
          );
        } else {
          q = query(
            collection(db, 'clinics'), 
            where('status', '==', 'approved'),
            orderBy('rating', 'desc'),
            limit(100)
          );
        }
        
        const snapshot = await getDocs(q);
        const clinicsData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Clinic));
        
        setClinics(clinicsData);
      } catch (err: any) {
        console.error('Error fetching clinics:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClinics();
  }, [status]);

  return { clinics, loading, error };
};