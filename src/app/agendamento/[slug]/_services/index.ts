/**
 * Serviços da página pública de agendamento
 */

export { fetchClientBySlug } from './client.service';
export { createPublicBooking } from './booking.service';

export type { FetchClientResponse } from './client.service';
export type { CreateBookingResponse } from './booking.service';
