import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { ClinicSchedule } from '../types';

const DEFAULT_SCHEDULE: ClinicSchedule = {
  daysOfWeek: [1, 2, 3, 4, 5],
  startTime: '09:00',
  endTime: '17:00',
  slotDuration: 60,
  blockedDates: []
};

export const useClinicSchedule = (clinicId: string) => {
  const [schedule, setSchedule] = useState<ClinicSchedule>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) return;
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, 'clinics', clinicId, 'schedule', 'main'));
        if (snap.exists()) {
          setSchedule(snap.data() as ClinicSchedule);
        }
      } catch (err) {
        console.error('Error fetching schedule:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [clinicId]);

  return { schedule, loading };
};

export const useUpdateSchedule = () => {
  const [updating, setUpdating] = useState(false);

  const updateSchedule = useCallback(async (clinicId: string, data: ClinicSchedule) => {
    setUpdating(true);
    try {
      await setDoc(doc(db, 'clinics', clinicId, 'schedule', 'main'), data);
      return true;
    } catch (err) {
      console.error('Error updating schedule:', err);
      return false;
    } finally {
      setUpdating(false);
    }
  }, []);

  return { updateSchedule, updating };
};

export const generateTimeSlots = (schedule: ClinicSchedule): string[] => {
  const slots: string[] = [];
  const [startH, startM] = schedule.startTime.split(':').map(Number);
  const [endH, endM] = schedule.endTime.split(':').map(Number);
  const startMinutes = startH * 60 + (startM || 0);
  const endMinutes = endH * 60 + (endM || 0);

  if (isNaN(startMinutes) || isNaN(endMinutes)) return slots;

  let current = startMinutes;
  while (current + schedule.slotDuration <= endMinutes) {
    const h = Math.floor(current / 60).toString().padStart(2, '0');
    const m = (current % 60).toString().padStart(2, '0');
    slots.push(`${h}:${m}`);
    current += schedule.slotDuration;
  }
  return slots;
};

export const isBlockedDate = (schedule: ClinicSchedule, date: Date): boolean => {
  const day = date.getDay();
  if (!schedule.daysOfWeek.includes(day)) return true;
  const dateStr = date.toISOString().split('T')[0];
  return schedule.blockedDates.includes(dateStr);
};
