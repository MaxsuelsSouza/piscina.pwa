/**
 * Hook para gerenciar autenticação por telefone
 */

'use client';

import { useState } from 'react';
import {
  sendVerificationCode,
  verifyCode,
  clearRecaptcha,
  type PhoneVerificationResult,
} from '@/lib/firebase/auth/phoneAuth';

export type AuthStep = 'phone' | 'code' | 'success';

export const usePhoneAuth = () => {
  const [step, setStep] = useState<AuthStep>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<PhoneVerificationResult | null>(null);

  /**
   * Envia código de verificação para o telefone
   */
  const sendCode = async (phone: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await sendVerificationCode(phone);
      setConfirmationResult(result);
      setPhoneNumber(phone);
      setStep('code');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar código');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verifica o código digitado pelo usuário
   */
  const confirmCode = async (code: string) => {
    if (!confirmationResult) {
      setError('Nenhum código foi enviado');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await verifyCode(confirmationResult, code);
      setStep('success');
      return user;
    } catch (err: any) {
      setError(err.message || 'Código inválido');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reenvia o código de verificação
   */
  const resendCode = async () => {
    if (!phoneNumber) {
      setError('Número de telefone não encontrado');
      return;
    }

    // Limpa o reCAPTCHA anterior
    clearRecaptcha();

    // Volta para a etapa de telefone
    setStep('phone');
    setConfirmationResult(null);

    // Envia novo código
    await sendCode(phoneNumber);
  };

  /**
   * Reseta o fluxo de autenticação
   */
  const reset = () => {
    setStep('phone');
    setLoading(false);
    setError(null);
    setPhoneNumber('');
    setConfirmationResult(null);
    clearRecaptcha();
  };

  return {
    step,
    loading,
    error,
    phoneNumber,
    sendCode,
    confirmCode,
    resendCode,
    reset,
    setError,
  };
};
