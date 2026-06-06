import type { Timestamp } from 'firebase/firestore';

export const toDate = (value: Timestamp | Date | undefined | null): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  return value.toDate();
};

export const formatDateBR = (value: Timestamp | Date | undefined | null): string => {
  const date = toDate(value);
  if (!date) return '';
  return date.toLocaleDateString('pt-BR');
};

export const formatTimeBR = (value: Timestamp | Date | undefined | null): string => {
  const date = toDate(value);
  if (!date) return '';
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};
