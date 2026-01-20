/**
 * Configuracao do Admin da Lista de Casa Nova
 */

// Telefone do admin (apenas digitos)
export const ADMIN_PHONE = '81994625990';

/**
 * Verifica se o telefone e do admin
 */
export function isAdmin(phone: string | undefined): boolean {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone === ADMIN_PHONE;
}
