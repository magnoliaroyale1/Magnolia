import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, getDoc, doc, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Appointment, ClientSummary } from '../types';

export const useClinicClients = (clinicId: string) => {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) return;
    const fetch = async () => {
      try {
        const q = query(
          collection(db, 'appointments'),
          where('clinicId', '==', clinicId),
          limit(500)
        );
        const snapshot = await getDocs(q);
        const appointments = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));

        const grouped = new Map<string, Appointment[]>();
        for (const appt of appointments) {
          const existing = grouped.get(appt.clientId) || [];
          existing.push(appt);
          grouped.set(appt.clientId, existing);
        }

        const summaries: ClientSummary[] = [];
        for (const [clientId, appts] of grouped) {
          const userSnap = await getDoc(doc(db, 'users', clientId));
          const userData = userSnap.exists() ? userSnap.data() : null;

          const dates = appts.map(a => {
            const d = a.date instanceof Date ? a.date : a.date?.toDate();
            return d || new Date(0);
          });

          summaries.push({
            clientId,
            name: userData?.displayName || appts[0]?.clientName || 'Desconhecido',
            email: userData?.email || '',
            phone: userData?.phone || '',
            totalVisits: appts.length,
            totalSpent: appts.reduce((sum, a) => sum + (a.valor || 0), 0),
            firstVisit: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null,
            lastVisit: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null,
            procedures: [...new Set(appts.map(a => a.procedure).filter((p): p is string => !!p))],
            professionals: [...new Set(appts.map(a => a.professionalName).filter((p): p is string => !!p))],
            appointments: appts.sort((a, b) => {
              const da = a.date instanceof Date ? a.date : a.date?.toDate();
              const db_ = b.date instanceof Date ? b.date : b.date?.toDate();
              return (db_?.getTime() || 0) - (da?.getTime() || 0);
            })
          });
        }

        summaries.sort((a, b) => {
          if (!a.lastVisit || !b.lastVisit) return 0;
          return b.lastVisit.getTime() - a.lastVisit.getTime();
        });

        setClients(summaries);
      } catch (error) {
        console.error('Error fetching clinic clients:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [clinicId]);

  return { clients, loading };
};
