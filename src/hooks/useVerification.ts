import { useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { calculateClinicScore } from '../utils/score';
import type { Clinic } from '../types';

export interface VerificationCriteria {
  documentacaoValida: boolean;
  profissionaisQualificados: boolean;
  boasAvaliacoes: boolean;
  assessmentCompleto: boolean;
}

export const useVerification = () => {
  const [updating, setUpdating] = useState(false);

  const updateVerification = async (
    clinicId: string,
    criteria: VerificationCriteria,
    clinicData: Partial<Clinic>
  ) => {
    setUpdating(true);
    try {
      const allMet = criteria.documentacaoValida && criteria.profissionaisQualificados
        && criteria.boasAvaliacoes && criteria.assessmentCompleto;

      const updateData: any = {
        verified: allMet,
        verificationCriteria: criteria,
        verificationUpdatedAt: Timestamp.now()
      };

      if (allMet) {
        const updatedClinic = {
          ...clinicData,
          verified: true
        };
        const newScore = calculateClinicScore(updatedClinic);
        updateData.score = newScore;
      }

      await updateDoc(doc(db, 'clinics', clinicId), updateData);
      return true;
    } catch (error) {
      console.error('Error updating verification:', error);
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return { updateVerification, updating };
};
