import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Review } from '../types';

export const useProfessionalReviews = (professionalId: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!professionalId) return;
    const fetch = async () => {
      try {
        const q = query(
          collection(db, 'reviews'),
          where('professionalId', '==', professionalId),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        setReviews(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
      } catch (err) {
        console.error('Erro ao buscar avaliações. Crie o índice composto no Firebase Console:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [professionalId]);

  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  return { reviews, loading, avgRating, reviewCount: reviews.length };
};
