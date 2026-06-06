import type { Clinic } from '../types';

export const calculateClinicScore = (clinic: Partial<Clinic>): number => {
  const ratingWeight = (clinic.rating || 0) * 10;
  const reviewWeight = Math.min((clinic.reviewCount || 0) * 0.1, 20);

  const planBonus = clinic.plan === 'premium' ? 15 : clinic.plan === 'professional' ? 10 : 5;
  const verifiedBonus = clinic.verified ? 10 : 0;

  const hasDescription = clinic.description ? 5 : 0;
  const hasImages = (clinic.images?.length || 0) > 0 ? 5 : 0;
  const hasProcedures = (clinic.procedures?.length || 0) > 0 ? 5 : 0;
  const hasAddress = clinic.address?.city ? 3 : 0;
  const hasPhone = clinic.phone ? 2 : 0;

  const profileComplete = hasDescription + hasImages + hasProcedures + hasAddress + hasPhone;

  return Math.round(Math.min(ratingWeight + reviewWeight + planBonus + verifiedBonus + profileComplete, 100));
};
