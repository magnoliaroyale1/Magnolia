import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { calculateClinicScore } from '../utils/score';
import type { Clinic } from '../types';

export const useClinicProfile = (clinicId: string) => {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClinic = async () => {
      try {
        const docRef = doc(db, 'clinics', clinicId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setClinic({ id: docSnap.id, ...docSnap.data() } as Clinic);
        }
      } catch (error) {
        console.error('Error fetching clinic:', error);
      } finally {
        setLoading(false);
      }
    };

    if (clinicId) {
      fetchClinic();
    }
  }, [clinicId]);

  const updateClinic = async (data: Partial<Clinic>) => {
    try {
      const clinicRef = doc(db, 'clinics', clinicId);
      const updatedData = { ...data };

      if (data.images || data.description || data.procedures || data.phone) {
        const current = clinic || {};
        const merged = { ...current, ...data };
        const newScore = calculateClinicScore(merged);
        updatedData.score = newScore;
      }

      await updateDoc(clinicRef, updatedData);
      setClinic(prev => prev ? { ...prev, ...updatedData } : null);
      return true;
    } catch (error) {
      console.error('Error updating clinic:', error);
      return false;
    }
  };

  const addImage = async (imageUrl: string) => {
    const currentImages = clinic?.images || [];
    return updateClinic({ images: [...currentImages, imageUrl] });
  };

  const removeImage = async (index: number) => {
    const currentImages = clinic?.images || [];
    const newImages = currentImages.filter((_, i) => i !== index);
    return updateClinic({ images: newImages });
  };

  return { clinic, loading, updateClinic, addImage, removeImage };
};