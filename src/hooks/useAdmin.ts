import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Clinic, User, DashboardStats } from '../types';

export const useAdminStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalClinics: 0,
    approvedClinics: 0,
    pendingClinics: 0,
    totalClients: 0,
    estimatedRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const clinicsSnapshot = await getDocs(collection(db, 'clinics'));
        const clientsSnapshot = await getDocs(
          query(collection(db, 'users'), where('role', '==', 'client'))
        );
        
        const allClinics = clinicsSnapshot.docs.map(d => d.data() as Clinic);
        const approved = allClinics.filter(c => c.status === 'approved');
        const pending = allClinics.filter(c => c.status === 'pending');
        
        setStats({
          totalClinics: allClinics.length,
          approvedClinics: approved.length,
          pendingClinics: pending.length,
          totalClients: clientsSnapshot.docs.length,
          estimatedRevenue: approved.length * 20
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
};

export const usePendingClinics = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);  // ✅ Corrigido: << para <
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const q = query(collection(db, 'clinics'), where('status', '==', 'pending'));
        const snapshot = await getDocs(q);
        setClinics(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Clinic)));
      } catch (error) {
        console.error('Error fetching pending clinics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPending();
  }, []);

  const approveClinic = async (clinicId: string, feedback?: string) => {
    const clinicRef = doc(db, 'clinics', clinicId);
    await updateDoc(clinicRef, {
      status: 'approved',
      approved: true,
      adminFeedback: feedback || '',
      reviewedAt: Timestamp.now()
    });
    setClinics(prev => prev.filter(c => c.id !== clinicId));
  };

  const rejectClinic = async (clinicId: string, feedback: string) => {
    const clinicRef = doc(db, 'clinics', clinicId);
    await updateDoc(clinicRef, {
      status: 'rejected',
      approved: false,
      adminFeedback: feedback,
      reviewedAt: Timestamp.now()
    });
    setClinics(prev => prev.filter(c => c.id !== clinicId));
  };

  const requestInfo = async (clinicId: string, feedback: string) => {
    const clinicRef = doc(db, 'clinics', clinicId);
    await updateDoc(clinicRef, {
      status: 'pending',
      adminFeedback: feedback,
      reviewedAt: Timestamp.now()
    });
  };

  return { clinics, loading, approveClinic, rejectClinic, requestInfo };
};

export const useApprovedClinics = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApproved = async () => {
      try {
        const q = query(
          collection(db, 'clinics'),
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        setClinics(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Clinic)));
      } catch (error) {
        console.warn('Firestore query com filtro falhou, usando fallback client-side:', error);
        try {
          const all = await getDocs(collection(db, 'clinics'));
          const approved = all.docs
            .map(d => ({ id: d.id, ...d.data() } as Clinic))
            .filter(c => c.status === 'approved')
            .sort((a, b) => ((b.createdAt as any)?.toMillis?.() || 0) - ((a.createdAt as any)?.toMillis?.() || 0));
          setClinics(approved);
        } catch (fallbackError) {
          console.error('Fallback também falhou:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchApproved();
  }, []);

  return { clinics, loading };
};

export const useClients = () => {
  const [clients, setClients] = useState<User[]>([]);  // ✅ Corrigido
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'client'));
        const snapshot = await getDocs(q);
        setClients(snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as User)));
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  return { clients, loading };
};