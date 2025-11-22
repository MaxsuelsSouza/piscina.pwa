/**
 * Serviços do Firestore para gerenciar clientes públicos
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config';
import type { Client, ClientDocument } from '@/types/client';

const CLIENTS_COLLECTION = 'clients';

/**
 * Normaliza telefone (remove caracteres não numéricos)
 */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Cria uma nova conta de cliente
 */
export async function createClient(data: {
  fullName: string;
  phone: string;
  birthDate: string;
}): Promise<Client> {
  try {
    const normalizedPhone = normalizePhone(data.phone);

    // Verifica se já existe um cliente com esse telefone
    const existingClient = await getClientByPhone(normalizedPhone);
    if (existingClient) {
      throw new Error('Já existe uma conta com este telefone');
    }

    const clientData: ClientDocument = {
      phone: normalizedPhone,
      fullName: data.fullName.trim(),
      birthDate: data.birthDate, // YYYY-MM-DD
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Usa o telefone como ID do documento
    await setDoc(doc(db, CLIENTS_COLLECTION, normalizedPhone), clientData);

    return clientData;
  } catch (error) {
    throw error;
  }
}

/**
 * Busca cliente por telefone
 */
export async function getClientByPhone(phone: string): Promise<Client | null> {
  try {
    const normalizedPhone = normalizePhone(phone);
    const clientRef = doc(db, CLIENTS_COLLECTION, normalizedPhone);
    const clientSnap = await getDoc(clientRef);

    if (!clientSnap.exists()) {
      return null;
    }

    return clientSnap.data() as Client;
  } catch (error) {
    return null;
  }
}

/**
 * Autentica cliente (verifica telefone + data de nascimento)
 */
export async function authenticateClient(
  phone: string,
  birthDate: string
): Promise<Client | null> {
  try {
    const client = await getClientByPhone(phone);

    if (!client) {
      return null;
    }

    // Verifica se a data de nascimento bate
    if (client.birthDate !== birthDate) {
      return null;
    }

    return client;
  } catch (error) {
    return null;
  }
}

/**
 * Atualiza dados do cliente
 */
export async function updateClient(
  phone: string,
  data: Partial<Omit<Client, 'phone' | 'createdAt'>>
): Promise<void> {
  try {
    const normalizedPhone = normalizePhone(phone);
    const clientRef = doc(db, CLIENTS_COLLECTION, normalizedPhone);

    await updateDoc(clientRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}
