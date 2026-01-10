/**
 * Serviço para buscar dados do cliente (barbearia) pelo slug
 */

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppUser } from '@/types/user';
import { userDocumentToAppUser } from '@/types/user';

/**
 * Busca um cliente pelo slug público
 */
export async function getClientBySlug(slug: string): Promise<AppUser | null> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('publicSlug', '==', slug),
      where('isActive', '==', true),
      where('venueType', '==', 'barbershop')
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return userDocumentToAppUser(doc.data());
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    throw error;
  }
}
