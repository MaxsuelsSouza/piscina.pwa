/**
 * Serviços do Firestore para gerenciar presentes
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  addDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config';
import type { Gift, GiftDocument, GiftSelection, GiftSelectionDocument, GiftCategory } from '@/types/gift';

const GIFTS_COLLECTION = 'gifts';
const GIFT_SELECTIONS_COLLECTION = 'giftSelections';

/**
 * Busca todos os presentes
 */
export async function getAllGifts(): Promise<Gift[]> {
  const giftsRef = collection(db, GIFTS_COLLECTION);
  const q = query(giftsRef, orderBy('category'), orderBy('name'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Gift[];
}

/**
 * Busca presentes por categoria
 */
export async function getGiftsByCategory(category: GiftCategory): Promise<Gift[]> {
  const giftsRef = collection(db, GIFTS_COLLECTION);
  const q = query(
    giftsRef,
    where('category', '==', category),
    orderBy('name')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Gift[];
}

/**
 * Busca presentes disponíveis (não selecionados)
 */
export async function getAvailableGifts(): Promise<Gift[]> {
  const giftsRef = collection(db, GIFTS_COLLECTION);
  const q = query(
    giftsRef,
    where('isSelected', '==', false),
    orderBy('category'),
    orderBy('name')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Gift[];
}

/**
 * Busca um presente por ID
 */
export async function getGiftById(giftId: string): Promise<Gift | null> {
  const giftRef = doc(db, GIFTS_COLLECTION, giftId);
  const snapshot = await getDoc(giftRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Gift;
}

/**
 * Seleciona um presente para um cliente
 */
export async function selectGift(
  giftId: string,
  clientPhone: string,
  clientName: string
): Promise<GiftSelection> {
  // Verifica se o presente existe e está disponível
  const gift = await getGiftById(giftId);

  if (!gift) {
    throw new Error('Presente não encontrado');
  }

  if (gift.isSelected) {
    throw new Error('Este presente já foi escolhido por outra pessoa');
  }

  const now = new Date().toISOString();

  // Atualiza o presente como selecionado
  const giftRef = doc(db, GIFTS_COLLECTION, giftId);
  await updateDoc(giftRef, {
    isSelected: true,
    selectedBy: clientPhone,
    selectedAt: now,
    updatedAt: now,
  });

  // Cria o registro de seleção
  const selectionData: GiftSelectionDocument = {
    giftId,
    giftName: gift.name,
    clientPhone,
    clientName,
    selectedAt: now,
  };

  const selectionRef = await addDoc(
    collection(db, GIFT_SELECTIONS_COLLECTION),
    selectionData
  );

  return {
    id: selectionRef.id,
    ...selectionData,
  };
}

/**
 * Cancela a seleção de um presente
 */
export async function unselectGift(
  giftId: string,
  clientPhone: string
): Promise<void> {
  const gift = await getGiftById(giftId);

  if (!gift) {
    throw new Error('Presente não encontrado');
  }

  if (!gift.isSelected) {
    throw new Error('Este presente não está selecionado');
  }

  if (gift.selectedBy !== clientPhone) {
    throw new Error('Você não pode cancelar a seleção de outro cliente');
  }

  const now = new Date().toISOString();

  // Remove a seleção do presente
  const giftRef = doc(db, GIFTS_COLLECTION, giftId);
  await updateDoc(giftRef, {
    isSelected: false,
    selectedBy: null,
    selectedAt: null,
    updatedAt: now,
  });

  // Remove o registro de seleção
  const selectionsRef = collection(db, GIFT_SELECTIONS_COLLECTION);
  const q = query(
    selectionsRef,
    where('giftId', '==', giftId),
    where('clientPhone', '==', clientPhone)
  );
  const snapshot = await getDocs(q);

  // Deleta os documentos encontrados (geralmente 1)
  const deletePromises = snapshot.docs.map((docSnap) =>
    updateDoc(doc(db, GIFT_SELECTIONS_COLLECTION, docSnap.id), {
      cancelled: true,
      cancelledAt: now,
    })
  );

  await Promise.all(deletePromises);
}

/**
 * Busca todas as seleções de um cliente
 */
export async function getClientSelections(clientPhone: string): Promise<GiftSelection[]> {
  const selectionsRef = collection(db, GIFT_SELECTIONS_COLLECTION);
  const q = query(
    selectionsRef,
    where('clientPhone', '==', clientPhone),
    orderBy('selectedAt', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as GiftSelection[];
}

/**
 * Busca todas as seleções (para admin)
 */
export async function getAllSelections(): Promise<GiftSelection[]> {
  const selectionsRef = collection(db, GIFT_SELECTIONS_COLLECTION);
  const q = query(selectionsRef, orderBy('selectedAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as GiftSelection[];
}

/**
 * Listener em tempo real para presentes
 */
export function subscribeToGifts(
  callback: (gifts: Gift[]) => void
): Unsubscribe {
  const giftsRef = collection(db, GIFTS_COLLECTION);
  const q = query(giftsRef, orderBy('category'), orderBy('name'));

  return onSnapshot(q, (snapshot) => {
    const gifts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Gift[];
    callback(gifts);
  });
}

/**
 * Cria um novo presente (usado pelo script de seed)
 */
export async function createGift(data: {
  name: string;
  category: GiftCategory;
  description?: string;
}): Promise<Gift> {
  const now = new Date().toISOString();

  const giftData: GiftDocument = {
    name: data.name,
    category: data.category,
    description: data.description,
    isSelected: false,
    createdAt: now,
    updatedAt: now,
  };

  const giftRef = await addDoc(collection(db, GIFTS_COLLECTION), giftData);

  return {
    id: giftRef.id,
    ...giftData,
  };
}

/**
 * Cria múltiplos presentes de uma vez (batch)
 */
export async function createGiftsBatch(
  gifts: Array<{ name: string; category: GiftCategory; description?: string }>
): Promise<number> {
  const now = new Date().toISOString();
  let count = 0;

  for (const gift of gifts) {
    const giftData: GiftDocument = {
      name: gift.name,
      category: gift.category,
      description: gift.description,
      isSelected: false,
      createdAt: now,
      updatedAt: now,
    };

    await addDoc(collection(db, GIFTS_COLLECTION), giftData);
    count++;
  }

  return count;
}
