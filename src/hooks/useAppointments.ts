import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Appointment } from '../types';

export const useAppointmentsByClient = (clientId: string) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    const fetch = async () => {
      try {
        const q = query(
          collection(db, 'appointments'),
          where('clientId', '==', clientId),
          orderBy('date', 'asc')
        );
        const snapshot = await getDocs(q);
        setAppointments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)));
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [clientId]);

  return { appointments, loading };
};

export const useAppointmentsByClinic = (clinicId: string) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) return;
    const fetch = async () => {
      try {
        const q = query(
          collection(db, 'appointments'),
          where('clinicId', '==', clinicId),
          orderBy('date', 'asc')
        );
        const snapshot = await getDocs(q);
        setAppointments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)));
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [clinicId]);

  return { appointments, loading };
};

export const useCreateAppointment = () => {
  const [creating, setCreating] = useState(false);

  const createAppointment = async (data: Omit<Appointment, 'id'>) => {
    setCreating(true);
    try {
      await addDoc(collection(db, 'appointments'), {
        ...data,
        createdAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error creating appointment:', error);
      return false;
    } finally {
      setCreating(false);
    }
  };

  return { createAppointment, creating };
};

export const useUpdateAppointmentStatus = () => {
  const updateStatus = useCallback(async (appointmentId: string, status: Appointment['status']) => {
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), { status });
      return true;
    } catch (error) {
      console.error('Error updating appointment:', error);
      return false;
    }
  }, []);

  return { updateStatus };
};

export const useAppointmentsByProfessional = (professionalId: string) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!professionalId) return;
    const fetch = async () => {
      try {
        const q = query(
          collection(db, 'appointments'),
          where('professionalId', '==', professionalId),
          orderBy('date', 'asc')
        );
        const snapshot = await getDocs(q);
        setAppointments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)));
      } catch (error) {
        console.error('Error fetching appointments by professional:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [professionalId]);

  return { appointments, loading };
};

export const usePendingAppointments = (clinicId: string) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) return;
    const fetch = async () => {
      try {
        const q = query(
          collection(db, 'appointments'),
          where('clinicId', '==', clinicId),
          where('status', '==', 'pending'),
          orderBy('date', 'asc')
        );
        const snapshot = await getDocs(q);
        setAppointments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)));
      } catch (error) {
        console.error('Error fetching pending appointments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [clinicId]);

  return { appointments, loading };
};
