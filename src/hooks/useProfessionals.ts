import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../services/firebase';
import type { Professional } from '../types';

export const useProfessionalsByClinic = (clinicId: string) => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!clinicId) return;
    try {
      const q = query(
        collection(db, 'professionals'),
        where('clinicId', '==', clinicId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setProfessionals(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Professional)));
    } catch (err) {
      console.warn('Erro ao buscar profissionais. Crie o índice composto no Firebase Console:', err);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { professionals, loading, refetch: fetch };
};

export const useProfessional = (uid: string) => {
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const fetch = async () => {
      try {
        const q = query(
          collection(db, 'professionals'),
          where('uid', '==', uid)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setProfessional({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Professional);
        }
      } catch (err) {
        console.error('Error fetching professional:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [uid]);

  return { professional, loading };
};

export const useCreateProfessional = () => {
  const [creating, setCreating] = useState(false);

  const createProfessional = async (data: {
    clinicId: string;
    name: string;
    email: string;
    password: string;
    bio: string;
    procedures: string[];
  }) => {
    setCreating(true);
    try {
      const functions = getFunctions();
      const createUser = httpsCallable(functions, 'createProfessionalUser');
      const result = await createUser({
        email: data.email,
        password: data.password,
        name: data.name,
        clinicId: data.clinicId,
      });
      const { uid } = result.data as { uid: string };

      await addDoc(collection(db, 'professionals'), {
        uid,
        clinicId: data.clinicId,
        name: data.name,
        email: data.email,
        bio: data.bio,
        procedures: data.procedures,
        photoURL: '',
        createdAt: Timestamp.now()
      });
      return true;
    } catch (err: any) {
      const message = err?.details?.message || err?.message || 'Erro ao criar profissional';
      console.error('Error creating professional:', message);
      return false;
    } finally {
      setCreating(false);
    }
  };

  return { createProfessional, creating };
};

export const useUpdateProfessional = () => {
  const [updating, setUpdating] = useState(false);

  const updateProfessional = async (id: string, data: Partial<Professional>) => {
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'professionals', id), data);
      return true;
    } catch (err) {
      console.error('Error updating professional:', err);
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return { updateProfessional, updating };
};

export const useDeleteProfessional = () => {
  const [deleting, setDeleting] = useState(false);

  const deleteProfessional = async (id: string) => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'professionals', id));
      return true;
    } catch (err) {
      console.error('Error deleting professional:', err);
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return { deleteProfessional, deleting };
};
