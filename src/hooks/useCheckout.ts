import { useState } from 'react';
import { collection, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

export const useCheckout = () => {
  const [processing, setProcessing] = useState(false);

  const createCheckoutSession = async (clinicId: string, plan: 'basic' | 'professional' | 'premium', price: number) => {
    setProcessing(true);
    try {
      const ref = await addDoc(collection(db, 'clinics', clinicId, 'checkouts'), {
        clinicId,
        plan,
        price,
        paymentMethod: null,
        status: 'pending',
        createdAt: Timestamp.now()
      });
      return ref.id;
    } catch (error) {
      console.error('Erro ao criar sessão de checkout:', error);
      return null;
    } finally {
      setProcessing(false);
    }
  };

  const completeCheckout = async (clinicId: string, sessionId: string, method: 'credit_card' | 'boleto' | 'pix') => {
    setProcessing(true);
    try {
      await updateDoc(doc(db, 'clinics', clinicId, 'checkouts', sessionId), {
        paymentMethod: method,
        status: 'completed',
        paidAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Erro ao completar checkout:', error);
      return false;
    } finally {
      setProcessing(false);
    }
  };

  return { createCheckoutSession, completeCheckout, processing };
};
