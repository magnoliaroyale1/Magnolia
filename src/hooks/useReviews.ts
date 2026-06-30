import { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, orderBy, Timestamp, doc, updateDoc, getDoc, where, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { calculateClinicScore } from '../utils/score';
import type { Review, Clinic } from '../types';

export const useReviews = (clinicId: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) return;
    const fetchReviews = async () => {
      try {
        const q = query(
          collection(db, 'clinics', clinicId, 'reviews'),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        const snapshot = await getDocs(q);
        setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [clinicId]);

  return { reviews, loading };
};

export const useCheckCanReview = () => {
  const checkCanReview = async (clinicId: string, clientId: string): Promise<{ canReview: boolean; reason: string }> => {
    try {
      const apptQ = query(
        collection(db, 'appointments'),
        where('clinicId', '==', clinicId),
        where('clientId', '==', clientId),
        where('status', '==', 'completed')
      );
      const apptSnap = await getDocs(apptQ);
      if (apptSnap.docs.length === 0) {
        return { canReview: false, reason: 'Você ainda não realizou nenhum procedimento nesta clínica.' };
      }

      const reviewQ = query(
        collection(db, 'clinics', clinicId, 'reviews'),
        where('clientId', '==', clientId)
      );
      const reviewSnap = await getDocs(reviewQ);
      if (reviewSnap.docs.length > 0) {
        return { canReview: false, reason: 'Você já avaliou esta clínica.' };
      }

      return { canReview: true, reason: '' };
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      return { canReview: false, reason: 'Erro ao verificar elegibilidade.' };
    }
  };

  return { checkCanReview };
};

export const useSubmitReview = () => {
  const [submitting, setSubmitting] = useState(false);

  const submitReview = async (
    clinicId: string,
    clientId: string,
    clientName: string,
    rating: number,
    comment: string,
    beforeAfterPhotos?: string[],
    professionalId?: string
  ) => {
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'clinics', clinicId, 'reviews'), {
        clinicId,
        professionalId: professionalId || null,
        clientId,
        clientName,
        rating,
        comment,
        images: beforeAfterPhotos || [],
        createdAt: Timestamp.now(),
        helpful: 0
      });

      const reviewsSnap = await getDocs(collection(db, 'clinics', clinicId, 'reviews'));
      const totalRating = reviewsSnap.docs.reduce((acc, r) => acc + r.data().rating, 0);
      const avgRating = Math.round((totalRating / reviewsSnap.docs.length) * 10) / 10;

      const clinicSnap = await getDoc(doc(db, 'clinics', clinicId));
      const clinicData = { id: clinicSnap.id, ...clinicSnap.data() } as Clinic;

      const updatedClinic = {
        ...clinicData,
        rating: avgRating,
        reviewCount: reviewsSnap.docs.length
      };
      const newScore = calculateClinicScore(updatedClinic);

      await updateDoc(doc(db, 'clinics', clinicId), {
        rating: avgRating,
        reviewCount: reviewsSnap.docs.length,
        score: newScore
      });

      return true;
    } catch (error) {
      console.error('Error submitting review:', error);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { submitReview, submitting };
};
