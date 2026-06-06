import { useState } from 'react';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

export interface AssessmentData {
  documentacao: {
    cnpjFile?: string;
    alvaraFile?: string;
    licencaSanitaria?: string;
    registroVigilancia?: string;
  };
  profissionais: {
    quantidade: number;
    lista: { nome: string; certificacao: string; certificadoFile?: string }[];
  };
  estrutura: {
    fotos: string[];
    equipamentos: string[];
    metragem: string;
  };
  horarios: {
    diasSemana: string[];
    abertura: string;
    fechamento: string;
    atendeFimSemana: boolean;
    horarioFimSemana?: string;
  };
  status: 'pending' | 'completed';
}

const INITIAL_ASSESSMENT: AssessmentData = {
  documentacao: { cnpjFile: '', alvaraFile: '', licencaSanitaria: '', registroVigilancia: '' },
  profissionais: { quantidade: 1, lista: [{ nome: '', certificacao: '', certificadoFile: '' }] },
  estrutura: { fotos: [], equipamentos: [], metragem: '' },
  horarios: { diasSemana: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'], abertura: '08:00', fechamento: '18:00', atendeFimSemana: false },
  status: 'pending'
};

export const useClinicAssessment = (clinicId: string) => {
  const [saving, setSaving] = useState(false);

  const saveAssessment = async (data: AssessmentData) => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'clinics', clinicId, 'assessment', 'main'), {
        ...data,
        updatedAt: Timestamp.now()
      });
      await setDoc(doc(db, 'clinics', clinicId), {
        assessmentCompleted: true,
        assessmentSubmittedAt: Timestamp.now()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('Error saving assessment:', error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const getAssessment = async (): Promise<AssessmentData | null> => {
    try {
      const snap = await getDoc(doc(db, 'clinics', clinicId, 'assessment', 'main'));
      if (snap.exists()) {
        const data = snap.data() as AssessmentData;
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching assessment:', error);
      return null;
    }
  };

  return { saveAssessment, getAssessment, saving };
};

export { INITIAL_ASSESSMENT };
