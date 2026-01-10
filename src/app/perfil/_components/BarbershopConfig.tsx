/**
 * Componente para configuração completa de barbearia
 * Gerencia profissionais, serviços e horários
 */

'use client';

import { ServicesManager } from './ServicesManager';
import { ProfessionalsManager } from './ProfessionalsManager';
import { ScheduleConfig } from './ScheduleConfig';
import type { BarberSchedule, Professional, Service } from '@/types/barbershop';

interface BarbershopConfigProps {
  professionals: Professional[];
  services: Service[];
  schedule: BarberSchedule;
  requiresPayment: boolean;
  onProfessionalsChange: (professionals: Professional[]) => void;
  onServicesChange: (services: Service[]) => void;
  onScheduleChange: (schedule: BarberSchedule) => void;
  onRequiresPaymentChange: (requiresPayment: boolean) => void;
}

export function BarbershopConfig({
  professionals,
  services,
  schedule,
  requiresPayment,
  onProfessionalsChange,
  onServicesChange,
  onScheduleChange,
  onRequiresPaymentChange,
}: BarbershopConfigProps) {
  return (
    <div className="space-y-8">
      {/* Horários */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
        <ScheduleConfig schedule={schedule} onChange={onScheduleChange} />
      </div>

      {/* Serviços */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
        <ServicesManager services={services} onChange={onServicesChange} />
      </div>

      {/* Configurações de Pagamento */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Configurações de Pagamento
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Defina se os clientes devem pagar no momento do agendamento
          </p>
        </div>

        <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <input
            type="checkbox"
            id="requiresPayment"
            checked={requiresPayment}
            onChange={(e) => onRequiresPaymentChange(e.target.checked)}
            className="mt-1 w-5 h-5 text-blue-600 bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
          />
          <label htmlFor="requiresPayment" className="flex-1 cursor-pointer">
            <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
              Exigir pagamento PIX na hora
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Quando ativado, os clientes precisarão fazer o pagamento via PIX no momento do agendamento.
              O agendamento ficará pendente até você confirmar o recebimento. Se desativado, os agendamentos
              serão confirmados automaticamente.
            </div>
            {requiresPayment && (
              <div className="mt-3 text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <strong>Atenção:</strong> Certifique-se de que seus dados PIX estão cadastrados corretamente
                na seção "Informações Bancárias" do seu perfil.
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Profissionais */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
        <ProfessionalsManager
          professionals={professionals}
          availableServices={services}
          onChange={onProfessionalsChange}
        />
      </div>

      {/* Nota informativa */}
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Dica:</strong> Configure primeiro os serviços, depois os horários de
          funcionamento e por último os profissionais. Você precisará ter pelo menos 1
          serviço e 1 profissional ativo para aceitar agendamentos.
        </p>
      </div>
    </div>
  );
}
