/**
 * Componente para gerenciar barbeiros (Owner view)
 * Permite criar, ativar/desativar e excluir barbeiros
 */

'use client';

import { useState } from 'react';
import { useBarbers } from '../_hooks/useBarbers';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import type { CreateBarberData } from '@/services/barbers/barbers.service';

export function BarbersManager() {
  const { barbers, loading, addBarber, toggleBarberStatus, removeBarber } = useBarbers();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [barberToDelete, setBarberToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado do formulário
  const [formData, setFormData] = useState<CreateBarberData>({
    email: '',
    password: '',
    displayName: '',
    phone: '',
    specialties: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addBarber(formData);
      setIsCreateModalOpen(false);
      // Reseta o formulário
      setFormData({
        email: '',
        password: '',
        displayName: '',
        phone: '',
        specialties: [],
      });
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!barberToDelete) return;

    try {
      await removeBarber(barberToDelete);
      setBarberToDelete(null);
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Profissionais</h2>
        <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profissionais</h2>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            Adicionar Profissional
          </Button>
        </div>

        {barbers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Você ainda não cadastrou nenhum profissional
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Cadastrar Primeiro Profissional
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {barbers.map((barber) => (
              <div
                key={barber.uid}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {barber.displayName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{barber.email}</p>
                  {barber.phone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Tel: {barber.phone}
                    </p>
                  )}
                  {barber.specialties && barber.specialties.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {barber.specialties.map((specialty, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={barber.isActive}
                      onChange={() => toggleBarberStatus(barber.uid, !barber.isActive)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                      {barber.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </label>

                  <button
                    onClick={() => setBarberToDelete(barber.uid)}
                    className="ml-4 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    title="Excluir profissional"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Criação */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Cadastrar Novo Profissional"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ex: João Silva"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Senha Temporária *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Mínimo 6 caracteres"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              O profissional será solicitado a trocar a senha no primeiro login
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Criando...' : 'Criar Profissional'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={!!barberToDelete}
        onCancel={() => setBarberToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Profissional"
        message="Tem certeza que deseja excluir este profissional? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  );
}
