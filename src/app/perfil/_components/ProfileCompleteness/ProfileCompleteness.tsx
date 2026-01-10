'use client';

/**
 * Componente de indicador de completude do perfil
 */

import { useMemo, useState } from 'react';
import { calculateProfileCompleteness } from '@/utils/profileCompleteness';
import { AppUser } from '@/types/user';

interface ProfileCompletenessProps {
  user: AppUser | null;
}

export function ProfileCompleteness({ user }: ProfileCompletenessProps) {
  const [showDetails, setShowDetails] = useState(false);

  const completeness = useMemo(() => {
    return calculateProfileCompleteness(user);
  }, [user]);

  const getColorClass = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColorClass = (percentage: number) => {
    if (percentage >= 80) return 'text-green-700 dark:text-green-400';
    if (percentage >= 50) return 'text-yellow-700 dark:text-yellow-400';
    return 'text-red-700 dark:text-red-400';
  };

  const getBgColorClass = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (percentage >= 50) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  const getMessage = (percentage: number) => {
    if (percentage === 100) return 'Perfil completo! 🎉';
    if (percentage >= 80) return 'Quase lá! Complete seu perfil para atrair mais clientes';
    if (percentage >= 50) return 'Bom começo! Adicione mais informações';
    return 'Complete seu perfil para aparecer melhor nas buscas';
  };

  return (
    <div className={`p-4 rounded-xl border ${getBgColorClass(completeness.percentage)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${getTextColorClass(completeness.percentage)}`}>
            Perfil {completeness.percentage}% completo
          </span>
          {completeness.percentage === 100 && (
            <span className="text-xl">✅</span>
          )}
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 underline"
        >
          {showDetails ? 'Ocultar detalhes' : 'Ver detalhes'}
        </button>
      </div>

      {/* Barra de progresso */}
      <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full ${getColorClass(completeness.percentage)} transition-all duration-500 ease-out`}
          style={{ width: `${completeness.percentage}%` }}
        />
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-300">{getMessage(completeness.percentage)}</p>

      {/* Detalhes expandíveis */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
          {completeness.missingFields.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">
                📝 Campos faltando ({completeness.missingFields.length}):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {completeness.missingFields.map((field) => (
                  <div key={field} className="flex items-center gap-1">
                    <span className="text-red-500 dark:text-red-400 text-xs">•</span>
                    <span className="text-xs text-gray-600 dark:text-gray-300">{field}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completeness.completedFields.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">
                ✅ Campos preenchidos ({completeness.completedFields.length}):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {completeness.completedFields.map((field) => (
                  <div key={field} className="flex items-center gap-1">
                    <span className="text-green-500 dark:text-green-400 text-xs">✓</span>
                    <span className="text-xs text-gray-600 dark:text-gray-300">{field}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
