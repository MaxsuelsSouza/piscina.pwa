'use client';

/**
 * Página de Perfil do Usuário
 * Permite gerenciar todos os dados do estabelecimento
 */

import { useRouter } from 'next/navigation';
import { ProfileCompleteness } from './_components/ProfileCompleteness';
import { ProfileForm, BarbershopConfig, BarbersManager } from './_components';
import { useProfileForm, useBarbershopConfig } from './_hooks';
import { Toast } from '@/components/Toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

export default function PerfilPage() {
  const router = useRouter();
  const { isOwner } = useAuth();
  const {
    formData,
    loading,
    error,
    success,
    authLoading,
    userData,
    hasChanges,
    handleChange,
    handleAmenityChange,
    handleCepChange,
    handleSubmit,
    handleCancel,
    clearMessages,
  } = useProfileForm();

  const barbershopConfig = useBarbershopConfig();
  const isBarbershop = userData?.venueType === 'barbershop';

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-600 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Meu Perfil</h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Gerencie as informações do seu estabelecimento
          </p>
        </div>

        {/* Indicador de Completude do Perfil */}
        <div className="mb-6">
          <ProfileCompleteness user={userData} />
        </div>

        {/* Formulário */}
        <ProfileForm
          formData={formData}
          loading={loading}
          hasChanges={hasChanges}
          isBarbershop={isBarbershop}
          onSubmit={handleSubmit}
          onChange={handleChange}
          onCepChange={handleCepChange}
          onAmenityChange={handleAmenityChange}
          onCancel={handleCancel}
        />

        {/* Gestão de Profissionais (apenas para donos) */}
        {isOwner && (
          <div className="mt-8">
            <BarbersManager />
          </div>
        )}

        {/* Configuração de Barbearia (apenas se venueType === 'barbershop') */}
        {isBarbershop && (
          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Configuração da Barbearia
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Gerencie serviços, profissionais e horários de funcionamento
              </p>
            </div>

            <BarbershopConfig
              professionals={barbershopConfig.professionals}
              services={barbershopConfig.services}
              schedule={barbershopConfig.schedule}
              requiresPayment={barbershopConfig.requiresPayment}
              onProfessionalsChange={barbershopConfig.setProfessionals}
              onServicesChange={barbershopConfig.setServices}
              onScheduleChange={barbershopConfig.setSchedule}
              onRequiresPaymentChange={barbershopConfig.setRequiresPayment}
            />

            {/* Botão de salvar configuração de barbearia */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={barbershopConfig.handleSave}
                disabled={barbershopConfig.loading || !barbershopConfig.hasChanges}
                className="px-6 py-3 bg-blue-600 dark:bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 dark:hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {barbershopConfig.loading ? 'Salvando...' : 'Salvar Configuração da Barbearia'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Container de Toasts */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {/* Toast de Sucesso - Perfil */}
        {success && (
          <Toast
            message={success}
            type="success"
            onClose={clearMessages}
          />
        )}

        {/* Toast de Erro - Perfil */}
        {error && (
          <Toast
            message={error}
            type="error"
            onClose={clearMessages}
          />
        )}

        {/* Toast de Sucesso - Barbearia */}
        {barbershopConfig.success && (
          <Toast
            message={barbershopConfig.success}
            type="success"
            onClose={barbershopConfig.clearMessages}
          />
        )}

        {/* Toast de Erro - Barbearia */}
        {barbershopConfig.error && (
          <Toast
            message={barbershopConfig.error}
            type="error"
            onClose={barbershopConfig.clearMessages}
          />
        )}
      </div>
    </div>
  );
}
