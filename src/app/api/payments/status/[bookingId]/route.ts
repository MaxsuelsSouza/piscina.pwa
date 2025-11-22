import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Booking } from '@/app/(home)/_types/booking';

export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { bookingId } = params;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID não fornecido' },
        { status: 400 }
      );
    }

    // Busca o booking no Firestore usando Admin SDK
    const db = adminDb();
    const bookingDoc = await db.collection('bookings').doc(bookingId).get();

    if (!bookingDoc.exists) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }

    const booking = { id: bookingDoc.id, ...bookingDoc.data() } as Booking;

    // Retorna status do pagamento e do booking
    return NextResponse.json({
      success: true,
      paymentStatus: booking.payment?.status || 'pending',
      bookingStatus: booking.status,
      booking: {
        id: booking.id,
        date: booking.date,
        customerName: booking.customerName,
        status: booking.status,
        payment: booking.payment,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao verificar status do pagamento' },
      { status: 500 }
    );
  }
}
