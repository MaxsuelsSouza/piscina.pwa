'use client';

/**
 * Modal de aviso quando o perfil não está completo o suficiente
 */

import { useRouter } from 'next/navigation';

interface ProfileIncompleteModalProps {
  percentage: number;
  missingFields: string[];
  onClose: () => void;
}

export function ProfileIncompleteModal({
  percentage,
  missingFields,
  onClose
}: ProfileIncompleteModalProps) {
  const router = useRouter();

  const handleGoToProfile = () => {
    onClose();
    router.push('/perfil');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center">
          {/* Ícone de alerta */}
          <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          {/* Mensagem */}
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Complete seu Perfil
          </h3>
          <p className="text-gray-600 dark:text-gray-200 mb-4">
            Para gerar seu link público de agendamentos, você precisa ter pelo menos <strong>80% do perfil preenchido</strong>.
          </p>

          {/* Progresso atual */}
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Progresso Atual</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{percentage}%</span>
            </div>
            <div className="relative w-full h-2 bg-gray-200 dark:border-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-300 mt-2">
              Faltam {80 - percentage}% para liberar o link público
            </p>
          </div>

          {/* Lista de campos faltando */}
          {missingFields.length > 0 && (
            <div className="mb-6 text-left">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Dados essenciais faltando:
              </p>
              <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3 max-h-32 overflow-y-auto">
                <ul className="space-y-1">
                  {missingFields.slice(0, 5).map((field) => (
                    <li key={field} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-200">
                      <span className="text-red-500">•</span>
                      {field}
                    </li>
                  ))}
                  {missingFields.length > 5 && (
                    <li className="text-xs text-gray-500 dark:text-gray-300 italic">
                      ...e mais {missingFields.length - 5} campos
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGoToProfile}
              className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/30"
            >
              Preencher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
