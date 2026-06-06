import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Appointment, MonthlyRevenue, RevenueByProfessional, ProcedureCount } from '../types';

export const useClinicReports = (clinicId: string) => {
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [revenueByProfessional, setRevenueByProfessional] = useState<RevenueByProfessional[]>([]);
  const [procedureCounts, setProcedureCounts] = useState<ProcedureCount[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [averageTicket, setAverageTicket] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) return;
    const fetch = async () => {
      try {
        const q = query(
          collection(db, 'appointments'),
          where('clinicId', '==', clinicId),
          where('status', '==', 'completed')
        );
        const snapshot = await getDocs(q);
        const appointments = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
        const completed = appointments.filter(a => a.status === 'completed' && a.valor);

        setCompletedCount(completed.length);
        setTotalRevenue(completed.reduce((sum, a) => sum + (a.valor || 0), 0));
        setAverageTicket(completed.length > 0
          ? completed.reduce((sum, a) => sum + (a.valor || 0), 0) / completed.length
          : 0
        );

        const byMonth = new Map<string, { revenue: number; count: number }>();
        const byProf = new Map<string, { revenue: number; count: number }>();
        const byProc = new Map<string, { count: number; revenue: number }>();

        for (const a of completed) {
          const date = a.date instanceof Date ? a.date : a.date?.toDate();
          if (!date) continue;
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

          const mData = byMonth.get(monthKey) || { revenue: 0, count: 0 };
          mData.revenue += a.valor || 0;
          mData.count += 1;
          byMonth.set(monthKey, mData);

          const profName = a.professionalName || 'Não atribuído';
          const pData = byProf.get(profName) || { revenue: 0, count: 0 };
          pData.revenue += a.valor || 0;
          pData.count += 1;
          byProf.set(profName, pData);

          const prData = byProc.get(a.procedure) || { count: 0, revenue: 0 };
          prData.count += 1;
          prData.revenue += a.valor || 0;
          byProc.set(a.procedure, prData);
        }

        const sortedMonths = [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0]));
        setMonthlyRevenue(sortedMonths.map(([month, data]) => ({ month, ...data })));

        const sortedProf = [...byProf.entries()].sort((a, b) => b[1].revenue - a[1].revenue);
        setRevenueByProfessional(sortedProf.map(([name, data]) => ({ name, ...data })));

        const sortedProc = [...byProc.entries()].sort((a, b) => b[1].count - a[1].count);
        setProcedureCounts(sortedProc.map(([name, data]) => ({ name, ...data })));
      } catch (error) {
        console.error('Error fetching clinic reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [clinicId]);

  return { monthlyRevenue, revenueByProfessional, procedureCounts, totalRevenue, averageTicket, completedCount, loading };
};
