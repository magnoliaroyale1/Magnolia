import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, orderBy, limit } from 'firebase/firestore';
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
          orderBy('date', 'asc'),
          limit(100)
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
          orderBy('date', 'asc'),
          limit(200)
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

export const useCancelAppointment = () => {
  const [cancelling, setCancelling] = useState(false);

  const cancelAppointment = useCallback(async (appointmentId: string, reason?: string) => {
    setCancelling(true);
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: 'cancelled_by_client',
        cancelReason: reason || '',
        cancelledAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      return false;
    } finally {
      setCancelling(false);
    }
  }, []);

  return { cancelAppointment, cancelling };
};

export const useRescheduleAppointment = () => {
  const [rescheduling, setRescheduling] = useState(false);

  const rescheduleAppointment = useCallback(async (appointmentId: string, newDate: Date, newTime: string) => {
    setRescheduling(true);
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        date: newDate,
        time: newTime,
        status: 'pending',
        notes: 'Reagendado pelo cliente'
      });
      return true;
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      return false;
    } finally {
      setRescheduling(false);
    }
  }, []);

  return { rescheduleAppointment, rescheduling };
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
          orderBy('date', 'asc'),
          limit(200)
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
          orderBy('date', 'asc'),
          limit(200)
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
