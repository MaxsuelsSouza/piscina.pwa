/**
 * Configuração de Usuários Administradores
 *
 * Este arquivo contém os UIDs dos usuários que têm permissões de administrador.
 * Estes UIDs devem corresponder aos usuários criados no Firebase Authentication.
 */

export const ADMIN_UIDS = [
  'X7aWBsKSpkTQr25mAigi9DkGULG3', // maxsuelsouza238@gmail.com
] as const;

/**
 * Verifica se um UID pertence a um administrador
 */
export function isAdmin(uid: string | undefined | null): boolean {
  if (!uid) return false;
  return ADMIN_UIDS.includes(uid as any);
}

/**
 * Informações dos administradores
 */
export const ADMIN_INFO = {
  'X7aWBsKSpkTQr25mAigi9DkGULG3': {
    email: 'maxsuelsouza238@gmail.com',
    name: 'Admin Principal',
  },
} as const;
