import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useClinicSchedule, generateTimeSlots, isBlockedDate } from './useClinicSchedule';
import type { Appointment } from '../types';

export const useProfessionalAvailability = (clinicId: string, professionalId: string, date: string) => {
  const { schedule } = useClinicSchedule(clinicId);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId || !professionalId || !date) { setLoading(false); return; }

    const calc = async () => {
      try {
        const selectedDate = new Date(date + 'T12:00:00');
        if (isBlockedDate(schedule, selectedDate)) {
          setAvailableSlots([]);
          return;
        }

        const q = query(
          collection(db, 'appointments'),
          where('professionalId', '==', professionalId),
          where('date', '==', selectedDate)
        );
        const snapshot = await getDocs(q);
        const occupiedTimes = snapshot.docs
          .map(d => d.data() as Appointment)
          .filter(a => a.status !== 'cancelled')
          .map(a => a.time);

        const allSlots = generateTimeSlots(schedule);
        setAvailableSlots(allSlots.filter(s => !occupiedTimes.includes(s)));
      } catch (err) {
        console.error('Error calculating availability:', err);
        setAvailableSlots([]);
      } finally {
        setLoading(false);
      }
    };
    calc();
  }, [clinicId, professionalId, date, schedule]);

  return { availableSlots, loading };
};
