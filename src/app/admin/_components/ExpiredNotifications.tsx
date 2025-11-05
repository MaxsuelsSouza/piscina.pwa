/**
 * Componente para notificações de agendamentos expirados
 */

'use client';

import type { Booking } from '@/app/(home)/_types/booking';

interface ExpiredNotificationsProps {
  bookings: Booking[];
  onMarkAsSent: (id: string) => Promise<void>;
}

export function ExpiredNotifications({ bookings, onMarkAsSent }: ExpiredNotificationsProps) {
  const expiredBookings = bookings.filter(b => {
    if (b.status !== 'pending') return false;
    if (!b.expiresAt) return false;
    if (b.expirationNotificationSent) return false;
    return new Date(b.expiresAt) <= new Date();
  });

  if (expiredBookings.length === 0) return null;

  const handleSendNotification = async (booking: Booking) => {
    const phoneNumber = booking.customerPhone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá ${booking.customerName}!\n\n` +
      `Seu agendamento para o dia ${new Date(booking.date + 'T00:00:00').toLocaleDateString('pt-BR')} expirou.\n\n` +
      `O prazo de 1 hora para envio do comprovante de pagamento foi atingido e o agendamento foi cancelado automaticamente.\n\n` +
      `Se ainda tiver interesse, por favor faça um novo agendamento.\n\n` +
      `Obrigado!`
    );

    window.open(`https://wa.me/55${phoneNumber}?text=${message}`, '_blank');

    // Marca como enviado
    try {
      await onMarkAsSent(booking.id);
    } catch (error) {
      console.error('Erro ao marcar notificação como enviada:', error);
      alert('Erro ao marcar notificação. Tente novamente.');
    }
  };

  return (
    <div className="bg-orange-50 border-l-4 border-orange-500 rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-orange-900 mb-1">
            Agendamentos Expirados - Notificar Clientes
          </h3>
          <p className="text-sm text-orange-700">
            {expiredBookings.length} {expiredBookings.length === 1 ? 'agendamento expirou' : 'agendamentos expiraram'} e {expiredBookings.length === 1 ? 'precisa' : 'precisam'} ser notificado{expiredBookings.length > 1 ? 's' : ''}.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {expiredBookings.map(booking => (
          <div
            key={booking.id}
            className="bg-white rounded-lg p-4 border border-orange-200 flex justify-between items-center"
          >
            <div>
              <h4 className="font-medium text-gray-900 text-sm mb-1">
                {booking.customerName}
              </h4>
              <div className="space-y-1">
                <p className="text-xs text-gray-600 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(booking.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                </p>
                <p className="text-xs text-gray-600 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {booking.customerPhone}
                </p>
                {booking.expiresAt && (
                  <p className="text-xs text-orange-600 font-medium">
                    Expirou há {Math.floor((new Date().getTime() - new Date(booking.expiresAt).getTime()) / 60000)} minutos
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => handleSendNotification(booking)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all text-sm font-medium flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Notificar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
