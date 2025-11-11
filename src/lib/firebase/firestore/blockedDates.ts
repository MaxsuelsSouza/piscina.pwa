/**
 * Serviços do Firestore para gerenciar dias bloqueados
 */

import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config';
import type { BlockedDate } from '@/app/(home)/_types/booking';

const BLOCKED_DATES_COLLECTION = 'blockedDates';

/**
 * Cria um novo dia bloqueado (sem owner - usado pelo admin)
 */
export async function blockDate(date: string): Promise<string> {
  try {
    const newBlockedDate: Omit<BlockedDate, 'id'> = {
      date,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, BLOCKED_DATES_COLLECTION), newBlockedDate);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao bloquear data:', error);
    throw error;
  }
}

/**
 * Cria um novo dia bloqueado com ownerId (usado por clientes)
 */
export async function createBlockedDate(date: string, ownerId: string): Promise<BlockedDate> {
  try {
    const newBlockedDate: Omit<BlockedDate, 'id'> = {
      date,
      createdAt: new Date().toISOString(),
      ownerId,
    };

    const docRef = await addDoc(collection(db, BLOCKED_DATES_COLLECTION), newBlockedDate);

    return {
      id: docRef.id,
      ...newBlockedDate,
    };
  } catch (error) {
    console.error('Erro ao criar data bloqueada:', error);
    throw error;
  }
}

/**
 * Deleta um bloqueio pelo ID
 */
export async function deleteBlockedDate(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, BLOCKED_DATES_COLLECTION, id));
  } catch (error) {
    console.error('Erro ao deletar data bloqueada:', error);
    throw error;
  }
}

/**
 * Remove bloqueio de um dia
 */
export async function unblockDate(date: string): Promise<void> {
  try {
    // Busca o documento com a data específica
    const q = query(
      collection(db, BLOCKED_DATES_COLLECTION),
      where('date', '==', date)
    );

    const querySnapshot = await getDocs(q);

    // Deleta todos os documentos com essa data (normalmente será apenas 1)
    const deletePromises = querySnapshot.docs.map(doc =>
      deleteDoc(doc.ref)
    );

    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Erro ao desbloquear data:', error);
    throw error;
  }
}

/**
 * Busca todos os dias bloqueados
 */
export async function getAllBlockedDates(): Promise<BlockedDate[]> {
  try {
    const querySnapshot = await getDocs(collection(db, BLOCKED_DATES_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as BlockedDate[];
  } catch (error) {
    console.error('Erro ao buscar datas bloqueadas:', error);
    throw error;
  }
}

/**
 * Verifica se uma data está bloqueada
 */
export async function isDateBlocked(date: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, BLOCKED_DATES_COLLECTION),
      where('date', '==', date)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Erro ao verificar data bloqueada:', error);
    throw error;
  }
}

/**
 * Escuta mudanças em tempo real nas datas bloqueadas
 */
export function subscribeToBlockedDates(callback: (blockedDates: BlockedDate[]) => void): Unsubscribe {
  try {
    return onSnapshot(collection(db, BLOCKED_DATES_COLLECTION), (querySnapshot) => {
      const blockedDates = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as BlockedDate[];

      callback(blockedDates);
    });
  } catch (error) {
    console.error('Erro ao escutar datas bloqueadas:', error);
    throw error;
  }
}
