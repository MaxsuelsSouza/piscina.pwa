/**
 * Painel Administrativo - Visão Geral do Sistema
 * Acesso exclusivo para administradores
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAdminData } from '../_hooks/useAdminData';
import { calculateMonthlyStats } from '../_utils/calculations';
import { toggleUserStatus, listUsers, updateSubscriptionDueDate } from '@/services/users.service';
import type { AppUser } from '@/types/user';

function PainelAdminContent() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [currentDate] = useState(new Date());
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showDueDateModal, setShowDueDateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [newDueDate, setNewDueDate] = useState('');

  // Busca TODOS os dados (sem filtro de ownerId)
  const {
    bookings,
    blockedDates,
  } = useAdminData({
    isAdmin: true,
    ownerId: undefined // Sem filtro - pega tudo
  });

  const stats = calculateMonthlyStats(bookings, currentDate);

  // Carrega usuários
  useEffect(() => {
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    setLoadingUsers(true);
    const response = await listUsers();
    if (response.success && response.users) {
      setUsers(response.users);
    }
    setLoadingUsers(false);
  };

  const handleToggleStatus = async (uid: string, currentStatus: boolean) => {
    const action = currentStatus ? 'desativar' : 'ativar';
    if (!confirm(`Deseja ${action} este usuário?`)) {
      return;
    }

    try {
      const response = await toggleUserStatus(uid, !currentStatus);
      if (response.success) {
        await loadAllUsers();
      } else {
        alert(response.error || `Erro ao ${action} usuário`);
      }
    } catch (err) {
      alert(`Erro ao ${action} usuário. Tente novamente.`);
    }
  };

  const openDueDateModal = (user: AppUser) => {
    setSelectedUser(user);
    // Define a data atual de vencimento ou 30 dias no futuro
    const defaultDate = user.subscriptionDueDate
      ? new Date(user.subscriptionDueDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    setNewDueDate(defaultDate.toISOString().split('T')[0]);
    setShowDueDateModal(true);
  };

  const handleQuickRenew = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setNewDueDate(date.toISOString().split('T')[0]);
  };

  const handleSaveDueDate = async () => {
    if (!selectedUser || !newDueDate) return;

    try {
      const dueDate = new Date(newDueDate + 'T00:00:00');
      const response = await updateSubscriptionDueDate(selectedUser.uid, dueDate);

      if (response.success) {
        alert(`Data de vencimento atualizada para ${dueDate.toLocaleDateString('pt-BR')}!`);
        setShowDueDateModal(false);
        setSelectedUser(null);
        setNewDueDate('');
        await loadAllUsers();
      } else {
        alert(response.error || 'Erro ao atualizar data de vencimento');
      }
    } catch (err) {
      alert('Erro ao atualizar data de vencimento. Tente novamente.');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Estatísticas gerais
  const totalClients = new Set(bookings.map(b => b.ownerId).filter(Boolean)).size;
  const totalBookingsAllTime = bookings.length;
  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + 400, 0);

  // Análise de Clientes
  const clientAnalysis = useMemo(() => {
    // Clientes com agendamentos
    const clientBookings = bookings.reduce((acc, booking) => {
      if (!booking.ownerId) return acc;
      if (!acc[booking.ownerId]) {
        acc[booking.ownerId] = [];
      }
      acc[booking.ownerId].push(booking);
      return acc;
    }, {} as Record<string, typeof bookings>);

    // Clientes mais ativos (top 5)
    const mostActive = Object.entries(clientBookings)
      .map(([ownerId, clientBookings]) => {
        const user = users.find(u => u.uid === ownerId);
        return {
          user,
          totalBookings: clientBookings.length,
          confirmedBookings: clientBookings.filter(b => b.status === 'confirmed').length,
        };
      })
      .filter(c => c.user)
      .sort((a, b) => b.totalBookings - a.totalBookings)
      .slice(0, 5);

    // Clientes inativos (sem agendamentos há mais de 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const inactiveClients = users.filter(u => {
      if (u.role === 'admin') return false;
      const userBookings = clientBookings[u.uid] || [];
      if (userBookings.length === 0) return true;

      const lastBooking = userBookings
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      return new Date(lastBooking.date) < thirtyDaysAgo;
    }).slice(0, 5);

    // Novos clientes (últimos 30 dias)
    const newClients = users.filter(u => {
      if (u.role === 'admin') return false;
      const createdAt = new Date(u.createdAt);
      return createdAt >= thirtyDaysAgo;
    }).slice(0, 5);

    return { mostActive, inactiveClients, newClients };
  }, [bookings, users]);

  // Gestão de Assinaturas
  const subscriptionManagement = useMemo(() => {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // Clientes inadimplentes (isActive: false)
    const delinquentClients = users.filter(u => u.role === 'client' && !u.isActive);

    // Clientes com vencimento próximo (próximos 7 dias)
    const dueSoonClients = users.filter(u => {
      if (u.role === 'admin' || !u.isActive || !u.subscriptionDueDate) return false;
      const dueDate = new Date(u.subscriptionDueDate);
      return dueDate > today && dueDate <= sevenDaysFromNow;
    });

    // Clientes vencidos (mas ainda ativos)
    const expiredClients = users.filter(u => {
      if (u.role === 'admin' || !u.isActive || !u.subscriptionDueDate) return false;
      const dueDate = new Date(u.subscriptionDueDate);
      return dueDate < today;
    });

    return { delinquentClients, dueSoonClients, expiredClients };
  }, [users]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Painel Administrativo
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Visão geral do sistema
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/admin/usuarios')}
                className="flex items-center gap-2 px-2.5 md:px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span className="hidden md:inline">Usuários</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-2.5 md:px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden md:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total de Clientes */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-semibold text-gray-900 mb-1">{totalClients}</p>
            <p className="text-sm text-gray-600">Clientes Ativos</p>
          </div>

          {/* Total de Agendamentos */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-semibold text-gray-900 mb-1">{totalBookingsAllTime}</p>
            <p className="text-sm text-gray-600">Total de Agendamentos</p>
          </div>

          {/* Agendamentos do Mês */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-semibold text-gray-900 mb-1">{stats.confirmedBookings}</p>
            <p className="text-sm text-gray-600">Confirmados este Mês</p>
          </div>

          {/* Receita Total */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-semibold text-gray-900 mb-1">
              {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <p className="text-sm text-gray-600">Receita Total</p>
          </div>
        </div>

        {/* Grid: Gestão de Assinaturas + Análise de Clientes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gestão de Assinaturas */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-medium text-gray-900">
                  Gestão de Assinaturas
                </h2>
              </div>
              <div className="flex gap-2">
                {subscriptionManagement.expiredClients.length > 0 && (
                  <span className="px-2.5 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                    {subscriptionManagement.expiredClients.length} venc.
                  </span>
                )}
                {subscriptionManagement.dueSoonClients.length > 0 && (
                  <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                    {subscriptionManagement.dueSoonClients.length} próx.
                  </span>
                )}
              </div>
            </div>

            {loadingUsers ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-gray-500">Carregando...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Assinaturas Vencidas */}
                {subscriptionManagement.expiredClients.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-red-600 uppercase mb-2">Vencidas</h3>
                    <div className="space-y-2">
                      {subscriptionManagement.expiredClients.map((client) => (
                        <div key={client.uid} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{client.displayName || client.email}</p>
                            <p className="text-xs text-red-600">
                              Venceu em {new Date(client.subscriptionDueDate!).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <button
                            onClick={() => openDueDateModal(client)}
                            className="px-3 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                          >
                            Renovar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vencimento Próximo */}
                {subscriptionManagement.dueSoonClients.length > 0 && (
                  <div className={subscriptionManagement.expiredClients.length > 0 ? 'pt-4 border-t border-gray-100' : ''}>
                    <h3 className="text-xs font-medium text-yellow-600 uppercase mb-2">Vence em até 7 dias</h3>
                    <div className="space-y-2">
                      {subscriptionManagement.dueSoonClients.map((client) => (
                        <div key={client.uid} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{client.displayName || client.email}</p>
                            <p className="text-xs text-yellow-600">
                              Vence em {new Date(client.subscriptionDueDate!).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <button
                            onClick={() => openDueDateModal(client)}
                            className="px-3 py-1 text-xs text-yellow-700 bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors"
                          >
                            Renovar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inativos (sem assinatura) */}
                {subscriptionManagement.delinquentClients.length > 0 && (
                  <div className={(subscriptionManagement.expiredClients.length > 0 || subscriptionManagement.dueSoonClients.length > 0) ? 'pt-4 border-t border-gray-100' : ''}>
                    <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Inativos</h3>
                    <div className="space-y-2">
                      {subscriptionManagement.delinquentClients.map((client) => (
                        <div key={client.uid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{client.displayName || client.email}</p>
                            <p className="text-xs text-gray-500">Conta desativada</p>
                          </div>
                          <button
                            onClick={() => handleToggleStatus(client.uid, false)}
                            className="px-3 py-1 text-xs text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            Ativar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tudo OK */}
                {subscriptionManagement.expiredClients.length === 0 &&
                 subscriptionManagement.dueSoonClients.length === 0 &&
                 subscriptionManagement.delinquentClients.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">Todas as assinaturas em dia!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Análise de Clientes */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-medium text-gray-900">
                  Análise de Clientes
                </h2>
              </div>
            </div>

            {loadingUsers ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-gray-500">Carregando...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Clientes Mais Ativos */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase mb-3">Top 5 Clientes Ativos</h3>
                  {clientAnalysis.mostActive.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Nenhum dado ainda</p>
                  ) : (
                    <div className="space-y-2">
                      {clientAnalysis.mostActive.map((client, idx) => (
                        <div key={client.user?.uid} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="text-sm text-gray-900">{client.user?.displayName || client.user?.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{client.totalBookings}</p>
                            <p className="text-xs text-gray-500">agendamentos</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Novos Clientes */}
                {clientAnalysis.newClients.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-xs font-medium text-gray-500 uppercase mb-3">Novos Clientes (30 dias)</h3>
                    <div className="space-y-2">
                      {clientAnalysis.newClients.map((client) => (
                        <div key={client.uid} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          <p className="text-sm text-gray-900">{client.displayName || client.email}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Edição de Data de Vencimento */}
      {showDueDateModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Atualizar Vencimento
              </h3>
              <p className="text-sm text-gray-600">
                {selectedUser.displayName || selectedUser.email}
              </p>
              {selectedUser.subscriptionDueDate && (
                <p className="text-xs text-gray-500 mt-1">
                  Vencimento atual: {new Date(selectedUser.subscriptionDueDate).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>

            {/* Botões Rápidos */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Renovação Rápida
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleQuickRenew(30)}
                  className="px-3 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  +30 dias
                </button>
                <button
                  onClick={() => handleQuickRenew(60)}
                  className="px-3 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  +60 dias
                </button>
                <button
                  onClick={() => handleQuickRenew(90)}
                  className="px-3 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  +90 dias
                </button>
              </div>
            </div>

            {/* Seleção de Data Manual */}
            <div className="mb-6">
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                Ou escolha uma data específica
              </label>
              <input
                type="date"
                id="dueDate"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {newDueDate && (
                <p className="text-xs text-gray-500 mt-2">
                  Nova data: {new Date(newDueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDueDateModal(false);
                  setSelectedUser(null);
                  setNewDueDate('');
                }}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveDueDate}
                disabled={!newDueDate}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Página do Painel Admin com proteção de rota
 */
export default function PainelAdminPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <PainelAdminContent />
    </ProtectedRoute>
  );
}
