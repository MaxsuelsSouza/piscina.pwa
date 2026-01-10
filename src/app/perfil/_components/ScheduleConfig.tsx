/**
 * Componente para configurar horários de funcionamento da barbearia
 */

'use client';

import type { BarberSchedule, DaySchedule, WeekDay } from '@/types/barbershop';

interface ScheduleConfigProps {
  schedule: BarberSchedule;
  onChange: (schedule: BarberSchedule) => void;
}

const weekDays: { key: WeekDay; label: string }[] = [
  { key: 'sunday', label: 'Domingo' },
  { key: 'monday', label: 'Segunda' },
  { key: 'tuesday', label: 'Terça' },
  { key: 'wednesday', label: 'Quarta' },
  { key: 'thursday', label: 'Quinta' },
  { key: 'friday', label: 'Sexta' },
  { key: 'saturday', label: 'Sábado' },
];

export function ScheduleConfig({ schedule, onChange }: ScheduleConfigProps) {
  const handleSlotDurationChange = (duration: number) => {
    onChange({ ...schedule, slotDuration: duration });
  };

  const handleBreakChange = (breakTime: number) => {
    onChange({ ...schedule, breakBetweenSlots: breakTime });
  };

  const handleDayToggle = (day: WeekDay) => {
    onChange({
      ...schedule,
      schedule: {
        ...schedule.schedule,
        [day]: {
          ...schedule.schedule[day],
          isOpen: !schedule.schedule[day].isOpen,
        },
      },
    });
  };

  const handleDayTimeChange = (
    day: WeekDay,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    onChange({
      ...schedule,
      schedule: {
        ...schedule.schedule,
        [day]: {
          ...schedule.schedule[day],
          [field]: value,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Configuração de Horários
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Duração de cada slot (minutos)
            </label>
            <select
              value={schedule.slotDuration}
              onChange={(e) => handleSlotDurationChange(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm dark:text-gray-100 outline-none focus:border-blue-400 dark:focus:border-blue-500"
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>1 hora</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Intervalo base para agendamentos
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Intervalo entre atendimentos
            </label>
            <select
              value={schedule.breakBetweenSlots}
              onChange={(e) => handleBreakChange(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm dark:text-gray-100 outline-none focus:border-blue-400 dark:focus:border-blue-500"
            >
              <option value={0}>Sem intervalo</option>
              <option value={5}>5 minutos</option>
              <option value={10}>10 minutos</option>
              <option value={15}>15 minutos</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tempo de pausa entre cada cliente
            </p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Horários por dia da semana
        </h4>
        <div className="space-y-2">
          {weekDays.map(({ key, label }) => {
            const daySchedule = schedule.schedule[key];

            return (
              <div
                key={key}
                className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3"
              >
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 min-w-[120px]">
                    <input
                      type="checkbox"
                      checked={daySchedule.isOpen}
                      onChange={() => handleDayToggle(key)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {label}
                    </span>
                  </label>

                  {daySchedule.isOpen && (
                    <div className="flex items-center gap-3 flex-1">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Abertura</label>
                        <input
                          type="time"
                          value={daySchedule.startTime}
                          onChange={(e) =>
                            handleDayTimeChange(key, 'startTime', e.target.value)
                          }
                          className="w-full px-2 py-1 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded text-sm dark:text-gray-100 outline-none focus:border-blue-400 dark:focus:border-blue-500"
                        />
                      </div>
                      <span className="text-gray-400 dark:text-gray-500 mt-4">-</span>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Fechamento</label>
                        <input
                          type="time"
                          value={daySchedule.endTime}
                          onChange={(e) =>
                            handleDayTimeChange(key, 'endTime', e.target.value)
                          }
                          className="w-full px-2 py-1 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded text-sm dark:text-gray-100 outline-none focus:border-blue-400 dark:focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {!daySchedule.isOpen && (
                    <span className="text-sm text-gray-400 dark:text-gray-500">Fechado</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
