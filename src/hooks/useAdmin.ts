import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, Timestamp, limit } from 'firebase/firestore';
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
        const [approvedSnap, pendingSnap, clientsSnap] = await Promise.all([
          getDocs(query(collection(db, 'clinics'), where('status', '==', 'approved'))),
          getDocs(query(collection(db, 'clinics'), where('status', '==', 'pending'))),
          getDocs(query(collection(db, 'users'), where('role', '==', 'client')))
        ]);
        
        const approved = approvedSnap.docs.length;
        const pending = pendingSnap.docs.length;
        
        setStats({
          totalClinics: approved + pending,
          approvedClinics: approved,
          pendingClinics: pending,
          totalClients: clientsSnap.docs.length,
          estimatedRevenue: approved * 20
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
        const q = query(collection(db, 'clinics'), where('status', '==', 'pending'), limit(200));
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
          orderBy('createdAt', 'desc'),
          limit(200)
        );
        const snapshot = await getDocs(q);
        setClinics(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Clinic)));
      } catch (error) {
        console.error('Erro ao buscar clínicas aprovadas. Crie o índice composto no Firebase Console:', error);
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
        const q = query(collection(db, 'users'), where('role', '==', 'client'), limit(500));
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