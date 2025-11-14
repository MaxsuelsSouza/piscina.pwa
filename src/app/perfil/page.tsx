'use client';

/**
 * Página de Perfil do Usuário
 * Permite gerenciar todos os dados do estabelecimento
 */

import { useRouter } from 'next/navigation';
import { ProfileCompleteness } from './_components/ProfileCompleteness';
import { ProfileForm } from './_components';
import { useProfileForm } from './_hooks';
import { Toast } from '@/components/Toast';

export default function PerfilPage() {
  const router = useRouter();
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Voltar
            </button>
          </div>
          <p className="text-gray-600">
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
          onSubmit={handleSubmit}
          onChange={handleChange}
          onCepChange={handleCepChange}
          onAmenityChange={handleAmenityChange}
          onCancel={handleCancel}
        />
      </div>

      {/* Toast de Sucesso */}
      {success && (
        <Toast
          message={success}
          type="success"
          onClose={clearMessages}
        />
      )}

      {/* Toast de Erro */}
      {error && (
        <Toast
          message={error}
          type="error"
          onClose={clearMessages}
        />
      )}
    </div>
  );
}
