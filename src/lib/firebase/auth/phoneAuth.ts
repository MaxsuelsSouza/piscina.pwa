/**
 * Serviço de Autenticação por Telefone usando Firebase
 */

import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  PhoneAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { auth } from '../config';

// Tipo para o resultado da verificação
export type PhoneVerificationResult = ConfirmationResult;

/**
 * Configura o reCAPTCHA para verificação do telefone
 * @param containerId - ID do elemento HTML que vai conter o reCAPTCHA
 */
export const setupRecaptcha = (containerId: string = 'recaptcha-container'): RecaptchaVerifier => {
  // Limpa qualquer reCAPTCHA existente
  if ((window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
    } catch (e) {
      console.log('Erro ao limpar reCAPTCHA:', e);
    }
    (window as any).recaptchaVerifier = null;
  }

  // Limpa o container do DOM
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
  }

  const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: (response: any) => {
      // reCAPTCHA resolvido, pode enviar o SMS
      console.log('reCAPTCHA resolvido');
    },
    'expired-callback': () => {
      // reCAPTCHA expirou, usuário precisa resolver novamente
      console.log('reCAPTCHA expirou');
    },
  });

  // Armazena globalmente para reutilização
  (window as any).recaptchaVerifier = recaptchaVerifier;

  return recaptchaVerifier;
};

/**
 * Envia código de verificação para o telefone
 * @param phoneNumber - Número de telefone no formato internacional (+55...)
 * @returns Resultado da confirmação para verificar o código
 */
export const sendVerificationCode = async (
  phoneNumber: string
): Promise<PhoneVerificationResult> => {
  try {
    // Garante que o telefone está no formato internacional
    let formattedPhone = phoneNumber.replace(/\D/g, '');

    // Adiciona +55 se não tiver código do país
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = `55${formattedPhone}`;
    }

    // Adiciona o + no início
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+${formattedPhone}`;
    }

    console.log('Enviando código para:', formattedPhone);

    // Configura o reCAPTCHA
    const recaptchaVerifier = setupRecaptcha();

    // Envia o código de verificação
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      formattedPhone,
      recaptchaVerifier
    );

    console.log('Código enviado com sucesso');
    return confirmationResult;
  } catch (error: any) {
    console.error('Erro ao enviar código:', error);

    // Limpa o reCAPTCHA em caso de erro
    if ((window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier.clear();
      (window as any).recaptchaVerifier = null;
    }

    throw new Error(getErrorMessage(error.code));
  }
};

/**
 * Verifica o código digitado pelo usuário
 * @param confirmationResult - Resultado retornado por sendVerificationCode
 * @param code - Código de 6 dígitos digitado pelo usuário
 */
export const verifyCode = async (
  confirmationResult: PhoneVerificationResult,
  code: string
): Promise<any> => {
  try {
    const result = await confirmationResult.confirm(code);
    console.log('Código verificado com sucesso:', result.user);
    return result.user;
  } catch (error: any) {
    console.error('Erro ao verificar código:', error);
    throw new Error(getErrorMessage(error.code));
  }
};

/**
 * Formata número de telefone brasileiro para exibição
 * @param phone - Telefone com apenas números
 */
export const formatPhoneDisplay = (phone: string): string => {
  const numbers = phone.replace(/\D/g, '');

  if (numbers.length === 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  } else if (numbers.length === 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }

  return phone;
};

/**
 * Traduz códigos de erro do Firebase para mensagens amigáveis
 */
const getErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    'auth/invalid-phone-number': 'Número de telefone inválido',
    'auth/missing-phone-number': 'Informe o número de telefone',
    'auth/quota-exceeded': 'Limite de SMS excedido. Tente novamente mais tarde',
    'auth/user-disabled': 'Este usuário foi desabilitado',
    'auth/invalid-verification-code': 'Código de verificação inválido',
    'auth/invalid-verification-id': 'Código expirado. Solicite um novo código',
    'auth/code-expired': 'Código expirado. Solicite um novo código',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
    'auth/operation-not-allowed': 'Autenticação por telefone não está habilitada',
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet',
  };

  return errorMessages[errorCode] || 'Erro ao autenticar. Tente novamente';
};

/**
 * Limpa o reCAPTCHA da memória
 */
export const clearRecaptcha = () => {
  if ((window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
    } catch (e) {
      console.log('Erro ao limpar reCAPTCHA:', e);
    }
    (window as any).recaptchaVerifier = null;
  }

  // Limpa o container do DOM
  const container = document.getElementById('recaptcha-container');
  if (container) {
    container.innerHTML = '';
  }
};
