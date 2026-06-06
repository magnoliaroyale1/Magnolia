import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

export const useSubmitReport = () => {
  const [submitting, setSubmitting] = useState(false);

  const submitReport = async (
    clinicId: string,
    reporterId: string,
    reason: string,
    description: string
  ) => {
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        clinicId,
        reporterId,
        reason,
        description,
        createdAt: Timestamp.now(),
        status: 'open'
      });
      return true;
    } catch (error) {
      console.error('Error submitting report:', error);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { submitReport, submitting };
};
