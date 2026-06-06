import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

const functions = getFunctions(app);

export const sendClinicEmail = async (
  clinicId: string,
  type: 'approved' | 'rejected' | 'pending_info',
  feedback?: string
) => {
  try {
    const sendEmailFn = httpsCallable(functions, 'sendClinicStatusEmail');
    const result = await sendEmailFn({ clinicId, type, feedback });
    return result.data;
  } catch (error) {
    console.error('Error sending email:', error);
    return null;
  }
};
