/**
 * Serviços do Firestore para gerenciar clientes públicos
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
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
 * Gera hash simples da senha usando Web Crypto API
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifica se a senha corresponde ao hash
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Cria uma nova conta de cliente com senha
 */
export async function createClientWithPassword(data: {
  phone: string;
  password: string;
  fullName: string;
}): Promise<Client> {
  const normalizedPhone = normalizePhone(data.phone);

  // Verifica se já existe um cliente com esse telefone
  const existingClient = await getClientByPhone(normalizedPhone);
  if (existingClient) {
    throw new Error('Já existe uma conta com este telefone');
  }

  const passwordHash = await hashPassword(data.password);

  const clientData: ClientDocument = {
    phone: normalizedPhone,
    fullName: data.fullName.trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Usa o telefone como ID do documento
  await setDoc(doc(db, CLIENTS_COLLECTION, normalizedPhone), clientData);

  return clientData;
}

/**
 * Cria uma nova conta de cliente (legado - telefone + nome + data nascimento)
 * @deprecated Use createClientWithPassword
 */
export async function createClient(data: {
  fullName: string;
  phone: string;
  birthDate: string;
}): Promise<Client> {
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
 * Autentica cliente com senha
 */
export async function authenticateClientWithPassword(
  phone: string,
  password: string
): Promise<Client | null> {
  try {
    const client = await getClientByPhone(phone);

    if (!client || !client.passwordHash) {
      return null;
    }

    const isValid = await verifyPassword(password, client.passwordHash);
    if (!isValid) {
      return null;
    }

    return client;
  } catch {
    return null;
  }
}

/**
 * Autentica cliente (verifica telefone + data de nascimento)
 * @deprecated Use authenticateClientWithPassword
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
  } catch {
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

/**
 * Verifica se o cliente tem senha cadastrada
 */
export async function checkClientHasPassword(phone: string): Promise<{ exists: boolean; hasPassword: boolean; fullName?: string }> {
  try {
    const client = await getClientByPhone(phone);

    if (!client) {
      return { exists: false, hasPassword: false };
    }

    return {
      exists: true,
      hasPassword: !!client.passwordHash,
      fullName: client.fullName,
    };
  } catch {
    return { exists: false, hasPassword: false };
  }
}

/**
 * Define senha para um cliente existente (que foi cadastrado sem senha pelo admin)
 */
export async function setClientPassword(phone: string, password: string): Promise<Client | null> {
  try {
    const normalizedPhone = normalizePhone(phone);
    const client = await getClientByPhone(normalizedPhone);

    if (!client) {
      throw new Error('Cliente não encontrado');
    }

    if (client.passwordHash) {
      throw new Error('Cliente já possui senha cadastrada');
    }

    const passwordHash = await hashPassword(password);

    await updateDoc(doc(db, CLIENTS_COLLECTION, normalizedPhone), {
      passwordHash,
      updatedAt: new Date().toISOString(),
    });

    return { ...client, passwordHash };
  } catch (error) {
    throw error;
  }
}
