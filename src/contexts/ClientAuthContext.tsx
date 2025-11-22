/**
 * Contexto de autenticação para clientes públicos
 * Usa autenticação customizada com telefone + data de nascimento
 * Sessão válida por 24 horas
 */

"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Client } from '@/types/client';
import {
  authenticateClient,
  createClient,
  getClientByPhone,
} from '@/lib/firebase/firestore/clients';

interface ClientAuthContextType {
  client: Client | null;
  loading: boolean;
  login: (phone: string, birthDate: string) => Promise<boolean>;
  register: (fullName: string, phone: string, birthDate: string) => Promise<boolean>;
  logout: () => void;
  refreshClientData: () => Promise<void>;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

const CLIENT_SESSION_KEY = 'client_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas em ms

interface ClientSession {
  phone: string;
  loginTime: number;
}

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  // Verifica sessão ao carregar
  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        const sessionData = localStorage.getItem(CLIENT_SESSION_KEY);

        if (!sessionData) {
          setLoading(false);
          return;
        }

        const session: ClientSession = JSON.parse(sessionData);
        const now = Date.now();

        // Verifica se a sessão expirou (24 horas)
        if (now - session.loginTime > SESSION_DURATION) {
          localStorage.removeItem(CLIENT_SESSION_KEY);
          setLoading(false);
          return;
        }

        // Busca dados atualizados do cliente
        const clientData = await getClientByPhone(session.phone);

        if (clientData) {
          setClient(clientData);
        } else {
          // Cliente não existe mais, limpa sessão
          localStorage.removeItem(CLIENT_SESSION_KEY);
        }
      } catch (error) {
        localStorage.removeItem(CLIENT_SESSION_KEY);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (phone: string, birthDate: string): Promise<boolean> => {
    try {
      const clientData = await authenticateClient(phone, birthDate);

      if (!clientData) {
        return false;
      }

      // Salva sessão
      const session: ClientSession = {
        phone: clientData.phone,
        loginTime: Date.now(),
      };
      localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(session));

      setClient(clientData);
      return true;
    } catch (error) {
      return false;
    }
  };

  const register = async (
    fullName: string,
    phone: string,
    birthDate: string
  ): Promise<boolean> => {
    try {
      const clientData = await createClient({ fullName, phone, birthDate });

      // Após criar, já faz login automaticamente
      const session: ClientSession = {
        phone: clientData.phone,
        loginTime: Date.now(),
      };
      localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(session));

      setClient(clientData);
      return true;
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(CLIENT_SESSION_KEY);
    setClient(null);
  };

  const refreshClientData = async () => {
    if (!client) return;

    try {
      const clientData = await getClientByPhone(client.phone);
      if (clientData) {
        setClient(clientData);
      }
    } catch (error) {
      // Erro ao atualizar, mantém dados antigos
    }
  };

  return (
    <ClientAuthContext.Provider
      value={{
        client,
        loading,
        login,
        register,
        logout,
        refreshClientData,
      }}
    >
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (context === undefined) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
}
