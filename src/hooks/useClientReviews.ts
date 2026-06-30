import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Review } from '../types';

export const useClientReviews = (clientId: string) => {
  const [reviews, setReviews] = useState<(Review & { clinicName?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    const fetch = async () => {
      try {
        const q = query(
          collection(db, 'clinics'),
          where('status', '==', 'approved'),
          limit(200)
        );
        const clinicsSnap = await getDocs(q);
        const allReviews: (Review & { clinicName?: string })[] = [];

        for (const clinicDoc of clinicsSnap.docs) {
          const reviewQ = query(
            collection(db, 'clinics', clinicDoc.id, 'reviews'),
            where('clientId', '==', clientId),
            orderBy('createdAt', 'desc')
          );
          const reviewSnap = await getDocs(reviewQ);
          reviewSnap.docs.forEach(doc => {
            allReviews.push({
              id: doc.id,
              ...doc.data(),
              clinicName: clinicDoc.data().name
            } as Review & { clinicName?: string });
          });
        }

        setReviews(allReviews);
      } catch (error) {
        console.error('Error fetching client reviews:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [clientId]);

  return { reviews, loading };
};

export const useEditReview = () => {
  const [editing, setEditing] = useState(false);

  const editReview = async (clinicId: string, reviewId: string, data: { rating?: number; comment?: string }) => {
    setEditing(true);
    try {
      await updateDoc(doc(db, 'clinics', clinicId, 'reviews', reviewId), data);
      return true;
    } catch (error) {
      console.error('Error editing review:', error);
      return false;
    } finally {
      setEditing(false);
    }
  };

  return { editReview, editing };
};
