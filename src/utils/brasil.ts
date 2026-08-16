/**
 * Utilitários brasileiros: máscaras, validação e formatação
 * CPF, CNPJ, telefone, CEP
 */

// Remove tudo que não for dígito
export const onlyDigits = (value: string): string => value.replace(/\D/g, '');

// ============================================
// CPF
// ============================================
export const formatCPF = (value: string): string => {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

export const validateCPF = (value: string): boolean => {
  const digits = onlyDigits(value);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false; // todos iguais

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rev = (sum * 10) % 11;
  if (rev === 10) rev = 0;
  if (rev !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rev = (sum * 10) % 11;
  if (rev === 10) rev = 0;
  return rev === parseInt(digits[10]);
};

// ============================================
// CNPJ
// ============================================
export const formatCNPJ = (value: string): string => {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
};

export const validateCNPJ = (value: string): boolean => {
  const digits = onlyDigits(value);
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(digits[i]) * weights1[i];
  let rev = sum % 11;
  rev = rev < 2 ? 0 : 11 - rev;
  if (rev !== parseInt(digits[12])) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(digits[i]) * weights2[i];
  rev = sum % 11;
  rev = rev < 2 ? 0 : 11 - rev;
  return rev === parseInt(digits[13]);
};

// ============================================
// Telefone / Celular
// ============================================
export const formatPhone = (value: string): string => {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

export const validatePhone = (value: string): boolean => {
  const digits = onlyDigits(value);
  // (DD) 9xxxx-xxxx ou (DD) xxxx-xxxx
  return digits.length === 10 || digits.length === 11;
};

// ============================================
// CEP
// ============================================
export const formatCEP = (value: string): string => {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

export const validateCEP = (value: string): boolean => {
  const digits = onlyDigits(value);
  return digits.length === 8;
};

// ============================================
// Hook reutilizável para inputs mascarados
// ============================================
import { useState, useCallback, type ChangeEvent } from 'react';

type MaskFormatter = (value: string) => string;
type Validator = (value: string) => boolean;

interface UseMaskedInputOptions {
  formatter: MaskFormatter;
  validator?: Validator;
  maxLength?: number;
  placeholder?: string;
}

interface UseMaskedInputReturn {
  value: string;
  formattedValue: string;
  isValid: boolean | null;
  error: string | null;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleBlur: () => void;
  setValue: (value: string) => void;
  reset: () => void;
}

export const useMaskedInput = ({
  formatter,
  validator,
  maxLength,
  placeholder,
}: UseMaskedInputOptions): UseMaskedInputReturn => {
  const [value, setValueState] = useState('');
  const [touched, setTouched] = useState(false);

  const formattedValue = formatter(value);
  const isValid = touched && validator ? validator(formattedValue) : null;
  const error = touched && validator && !validator(formattedValue) ? 'Formato inválido' : null;

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.slice(0, maxLength);
    }
    setValueState(newValue);
  }, [maxLength]);

  const handleBlur = useCallback(() => {
    setTouched(true);
  }, []);

  const setValue = useCallback((newValue: string) => {
    setValueState(newValue);
    setTouched(false);
  }, []);

  const reset = useCallback(() => {
    setValueState('');
    setTouched(false);
  }, []);

  return {
    value,
    formattedValue,
    isValid,
    error,
    handleChange,
    handleBlur,
    setValue,
    reset,
  };
};

// ============================================
// Hooks prontos para cada tipo
// ============================================
export const useCPFInput = (maxLength = 14) =>
  useMaskedInput({ formatter: formatCPF, validator: validateCPF, maxLength, placeholder: '000.000.000-00' });

export const useCNPJInput = (maxLength = 18) =>
  useMaskedInput({ formatter: formatCNPJ, validator: validateCNPJ, maxLength, placeholder: '00.000.000/0000-00' });

export const usePhoneInput = (maxLength = 15) =>
  useMaskedInput({ formatter: formatPhone, validator: validatePhone, maxLength, placeholder: '(00) 00000-0000' });

export const useCEPInput = (maxLength = 9) =>
  useMaskedInput({ formatter: formatCEP, validator: validateCEP, maxLength, placeholder: '00000-000' });