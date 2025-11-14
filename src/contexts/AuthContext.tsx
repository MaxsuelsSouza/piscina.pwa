/**
 * Contexto de autenticação com Firebase Authentication
 */

"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { isAdmin as checkIsAdmin } from '@/config/admin';
import { getUserByUid } from '@/lib/firebase/firestore/users';
import type { AppUser } from '@/types/user';

interface AuthContextType {
  user: User | null | undefined;
  userData: AppUser | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Monitora mudanças no estado de autenticação
  useEffect(() => {
    // Só executa no cliente
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          // Verifica se a sessão tem mais de 24 horas
          const loginTime = localStorage.getItem('auth_login_time');
          const now = Date.now();
          const twentyFourHours = 24 * 60 * 60 * 1000; // 24 horas em ms

          if (loginTime && (now - parseInt(loginTime)) > twentyFourHours) {
            // Sessão expirada após 24 horas - faz logout automático
            console.log('Sessão expirada após 24 horas');
            signOut(auth);
            localStorage.removeItem('auth_login_time');
            setUser(null);
            setUserData(null);
            setIsAdmin(false);
            setLoading(false);
            return;
          }

          // Busca dados do usuário no Firestore
          try {
            let userDataFromFirestore = await getUserByUid(currentUser.uid);

            // Se o documento não existe no Firestore, cria um novo
            if (!userDataFromFirestore) {
              console.log('Documento do usuário não encontrado. Criando automaticamente...');

              // Determina o role baseado na verificação de admin
              const isUserAdmin = checkIsAdmin(currentUser.uid);
              const userRole = isUserAdmin ? 'admin' : 'client';

              // Importa dinamicamente a função de criar usuário
              const { createUserDocument } = await import('@/lib/firebase/firestore/users');

              // Cria o documento com informações básicas
              await createUserDocument(
                currentUser.uid,
                currentUser.email || '',
                userRole,
                currentUser.displayName || undefined,
                currentUser.uid // Auto-criado
              );

              // Busca novamente para ter os dados completos
              userDataFromFirestore = await getUserByUid(currentUser.uid);
              console.log('✅ Documento do usuário criado automaticamente');
            }

            setUserData(userDataFromFirestore);

            // Usa o role do Firestore se disponível, caso contrário usa a verificação por UID
            const adminStatus = userDataFromFirestore?.role === 'admin' || checkIsAdmin(currentUser.uid);
            setIsAdmin(adminStatus);
          } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
            // Fallback para verificação por UID
            setIsAdmin(checkIsAdmin(currentUser.uid));
          }
        } else {
          setUserData(null);
          setIsAdmin(false);
        }

        setUser(currentUser);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Erro ao inicializar autenticação:', error);
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      // Garante que a persistência está configurada para localStorage (permanente)
      // Isso mantém o usuário logado mesmo após fechar o navegador
      await setPersistence(auth, browserLocalPersistence);

      // Faz o login com a persistência configurada
      await signInWithEmailAndPassword(auth, email, password);

      // Salva o timestamp do login para controlar expiração de 24 horas
      localStorage.setItem('auth_login_time', Date.now().toString());
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      // Limpa o timestamp de login
      localStorage.removeItem('auth_login_time');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  };

  const refreshUserData = async (): Promise<void> => {
    if (!user?.uid) {
      console.warn('Não é possível recarregar dados: usuário não autenticado');
      return;
    }

    try {
      const userDataFromFirestore = await getUserByUid(user.uid);
      if (userDataFromFirestore) {
        setUserData(userDataFromFirestore);

        // Atualiza status de admin se necessário
        const adminStatus = userDataFromFirestore.role === 'admin' || checkIsAdmin(user.uid);
        setIsAdmin(adminStatus);
      }
    } catch (error) {
      console.error('Erro ao recarregar dados do usuário:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, isAdmin, loading, login, logout, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
