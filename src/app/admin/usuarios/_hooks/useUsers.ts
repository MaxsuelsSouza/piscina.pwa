/**
 * Hook para gerenciamento de usuários
 */

import { useState, useCallback } from 'react';
import type { AppUser, CreateUserFormData } from '../_types';
import {
  fetchUsers,
  createNewUser,
  toggleStatus,
  resetUserPassword,
} from '../_services/users.admin.service';

export function useUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Carrega a lista de usuários
   */
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await fetchUsers();

    if (response.success && response.data) {
      setUsers(response.data);
    } else {
      setError(response.error || 'Erro ao carregar usuários');
    }

    setLoading(false);
  }, []);

  /**
   * Cria um novo usuário
   */
  const createUser = useCallback(
    async (data: CreateUserFormData) => {
      setError(null);
      setSuccess(null);
      setIsCreating(true);

      const response = await createNewUser(data);

      if (response.success) {
        setSuccess(`Usuário ${data.email} criado com sucesso!`);
        await loadUsers();
      } else {
        setError(response.error || 'Erro ao criar usuário');
      }

      setIsCreating(false);
    },
    [loadUsers]
  );

  /**
   * Alterna o status de um usuário
   */
  const handleToggleStatus = useCallback(
    async (uid: string, currentStatus: boolean) => {
      const action = currentStatus ? 'desativar' : 'ativar';

      setError(null);
      setSuccess(null);

      const response = await toggleStatus(uid, !currentStatus);

      if (response.success) {
        setSuccess(`Usuário ${action === 'ativar' ? 'ativado' : 'desativado'} com sucesso!`);
        await loadUsers();
      } else {
        setError(response.error || `Erro ao ${action} usuário`);
      }
    },
    [loadUsers]
  );

  /**
   * Envia email de redefinição de senha
   */
  const handleResetPassword = useCallback(async (email: string) => {
    setError(null);
    setSuccess(null);

    const response = await resetUserPassword(email);

    if (response.success) {
      setSuccess(`Email de redefinição de senha enviado para ${email}!`);
    } else {
      setError(response.error || 'Erro ao enviar email de redefinição');
    }
  }, []);

  /**
   * Limpa mensagens de erro e sucesso
   */
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    users,
    loading,
    isCreating,
    error,
    success,
    loadUsers,
    createUser,
    handleToggleStatus,
    handleResetPassword,
    clearMessages,
  };
}
