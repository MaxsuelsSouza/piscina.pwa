'use client';

/**
 * Página de administração de usuários
 * Permite ao admin criar, visualizar e gerenciar usuários
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useUsers } from './_hooks/useUsers';
import type { CreateUserFormData } from './_types';

export default function UsuariosPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  const {
    users,
    loading: loadingUsers,
    isCreating,
    error,
    success,
    loadUsers,
    createUser,
    handleToggleStatus: toggleStatus,
    handleResetPassword: resetPassword,
  } = useUsers();

  // Formulário simplificado
  const [formData, setFormData] = useState<CreateUserFormData>({
    email: '',
    password: '',
    displayName: '',
    businessName: '',
    role: 'client',
  });

  // Redireciona se não for admin
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [user, isAdmin, loading, router]);

  // Carrega lista de usuários
  useEffect(() => {
    if (user && isAdmin) {
      loadUsers();
    }
  }, [user, isAdmin, loadUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUser(formData);

    // Limpa o formulário apenas se sucesso
    if (!error) {
      setFormData({
        email: '',
        password: '',
        displayName: '',
        businessName: '',
        role: 'client',
      });
    }
  };

  const handleToggleStatus = async (uid: string, currentStatus: boolean) => {
    const action = currentStatus ? 'desativar' : 'ativar';
    if (!confirm(`Deseja ${action} este usuário?`)) {
      return;
    }
    await toggleStatus(uid, currentStatus);
  };

  const handleResetPassword = async (email: string) => {
    if (!confirm(`Enviar email de redefinição de senha para ${email}?`)) {
      return;
    }
    await resetPassword(email);
  };

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Gerenciar Usuários
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Crie e gerencie usuários do sistema
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/painel')}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Voltar ao Painel
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Grid: Formulário + Lista */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário de criação - 1 coluna */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                Novo Usuário
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-lg">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Função *
                  </label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'client' | 'admin' })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 transition-colors"
                  >
                    <option value="client">Cliente (Espaço de Festa)</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Pessoa
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 transition-colors"
                    placeholder="João Silva"
                  />
                </div>

                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Estabelecimento *
                  </label>
                  <input
                    type="text"
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 transition-colors"
                    placeholder="Muca Fest, Max Fest, etc."
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 transition-colors"
                    placeholder="usuario@exemplo.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Senha (mín. 6 caracteres) *
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 transition-colors"
                    placeholder="••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreating ? 'Criando...' : 'Criar Usuário'}
                </button>

                <p className="text-xs text-gray-500 mt-2">
                  * O usuário poderá completar as demais informações no primeiro acesso
                </p>
              </form>
            </div>
          </div>

          {/* Lista de usuários - 2 colunas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-lg font-medium text-gray-900">
                  Usuários Cadastrados
                </h2>
                <button
                  onClick={loadUsers}
                  disabled={loadingUsers}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {loadingUsers ? 'Carregando...' : 'Atualizar'}
                </button>
              </div>

              {loadingUsers ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-gray-500">Carregando usuários...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Nenhum usuário cadastrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Nome</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Estabelecimento</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Função</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map((u) => (
                        <tr key={u.uid} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4 text-sm text-gray-900">
                            {u.email}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {u.displayName || '—'}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-900 font-medium">
                            {u.businessName || '—'}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {u.role === 'admin' ? 'Admin' : 'Cliente'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              u.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {u.isActive ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleResetPassword(u.email)}
                                className="px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Enviar email de redefinição de senha"
                              >
                                Redefinir Senha
                              </button>
                              <button
                                onClick={() => handleToggleStatus(u.uid, u.isActive)}
                                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                                  u.isActive
                                    ? 'text-red-600 hover:bg-red-50'
                                    : 'text-green-600 hover:bg-green-50'
                                }`}
                              >
                                {u.isActive ? 'Desativar' : 'Ativar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
