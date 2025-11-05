/**
 * Utilitários de sanitização e validação de inputs
 * Proteção contra XSS, Script Injection e outras vulnerabilidades
 */

/**
 * Remove caracteres perigosos que podem ser usados para XSS
 */
export function sanitizeString(input: string): string {
  if (!input) return '';

  return input
    .trim()
    // Remove tags HTML
    .replace(/<[^>]*>/g, '')
    // Remove scripts
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove data: protocol (pode ser usado para XSS)
    .replace(/data:text\/html/gi, '')
    // Limita o tamanho
    .slice(0, 1000);
}

/**
 * Sanitiza nome completo
 */
export function sanitizeName(name: string): string {
  if (!name) return '';

  return sanitizeString(name)
    // Remove números
    .replace(/[0-9]/g, '')
    // Remove caracteres especiais, mantendo apenas letras, espaços, acentos e hífens
    .replace(/[^a-zA-ZÀ-ÿ\s\-']/g, '')
    // Remove espaços múltiplos
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

/**
 * Sanitiza e valida telefone
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';

  // Remove tudo exceto números, parênteses, hífens e espaços
  return phone
    .replace(/[^0-9()\-\s+]/g, '')
    .trim()
    .slice(0, 20);
}

/**
 * Valida formato de telefone brasileiro
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;

  // Remove caracteres não numéricos
  const digitsOnly = phone.replace(/\D/g, '');

  // Telefone brasileiro: 10 ou 11 dígitos (com DDD)
  // Pode ter código internacional +55
  return digitsOnly.length >= 10 && digitsOnly.length <= 13;
}

/**
 * Sanitiza email
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';

  return email
    .trim()
    .toLowerCase()
    // Remove espaços
    .replace(/\s/g, '')
    // Remove caracteres perigosos mas mantém caracteres válidos de email
    .replace(/[<>]/g, '')
    .slice(0, 254); // Limite RFC 5321
}

/**
 * Valida formato de email
 */
export function validateEmail(email: string): boolean {
  if (!email) return true; // Email é opcional

  // Regex simplificado mas seguro para validação de email
  const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Sanitiza notas/observações
 */
export function sanitizeNotes(notes: string): string {
  if (!notes) return '';

  return sanitizeString(notes)
    // Permite apenas caracteres alfanuméricos, pontuação comum e quebras de linha
    .replace(/[^\w\s\-.,!?()áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\n]/g, '')
    // Remove quebras de linha excessivas
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 500);
}

/**
 * Valida número de pessoas
 */
export function validateNumberOfPeople(num: number): boolean {
  return Number.isInteger(num) && num >= 1 && num <= 100;
}

/**
 * Sanitiza número de pessoas
 */
export function sanitizeNumberOfPeople(num: number): number {
  const parsed = parseInt(String(num), 10);
  if (isNaN(parsed)) return 1;
  return Math.max(1, Math.min(100, parsed));
}

/**
 * Interface para dados do formulário validados
 */
export interface SanitizedBookingData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  numberOfPeople: number;
  notes: string;
}

/**
 * Valida e sanitiza todos os campos do formulário de agendamento
 */
export function sanitizeBookingFormData(data: {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  numberOfPeople: number;
  notes: string;
}): {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedData: SanitizedBookingData;
} {
  const errors: Record<string, string> = {};

  // Sanitiza os dados
  const sanitizedData: SanitizedBookingData = {
    customerName: sanitizeName(data.customerName),
    customerPhone: sanitizePhone(data.customerPhone),
    customerEmail: sanitizeEmail(data.customerEmail),
    numberOfPeople: sanitizeNumberOfPeople(data.numberOfPeople),
    notes: sanitizeNotes(data.notes),
  };

  // Validações
  if (!sanitizedData.customerName || sanitizedData.customerName.length < 3) {
    errors.customerName = 'Nome deve ter no mínimo 3 caracteres';
  }

  if (!sanitizedData.customerPhone || !validatePhone(sanitizedData.customerPhone)) {
    errors.customerPhone = 'Telefone inválido';
  }

  if (sanitizedData.customerEmail && !validateEmail(sanitizedData.customerEmail)) {
    errors.customerEmail = 'Email inválido';
  }

  if (!validateNumberOfPeople(sanitizedData.numberOfPeople)) {
    errors.numberOfPeople = 'Número de pessoas deve estar entre 1 e 100';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData,
  };
}

/**
 * Previne ataques de prototype pollution
 */
export function sanitizeObjectKeys(obj: Record<string, any>): Record<string, any> {
  const dangerous = ['__proto__', 'constructor', 'prototype'];
  const sanitized: Record<string, any> = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key) && !dangerous.includes(key.toLowerCase())) {
      sanitized[key] = obj[key];
    }
  }

  return sanitized;
}
