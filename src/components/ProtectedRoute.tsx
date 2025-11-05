/**
 * Componente de Proteção de Rotas
 * Adiciona camada adicional de segurança client-side
 */

'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  fallback
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Se ainda está carregando, não faz nada
    if (loading) return;

    // Se não está autenticado
    if (!user) {
      if (!hasRedirected) {
        setHasRedirected(true);
        router.replace('/login');
      }
      return;
    }

    // Se requer admin mas usuário não é admin
    if (requireAdmin && !isAdmin) {
      if (!hasRedirected) {
        setHasRedirected(true);
        router.replace('/');
      }
      return;
    }

    // Usuário autorizado
    setIsAuthorized(true);
  }, [user, isAdmin, loading, requireAdmin, router, hasRedirected]);

  // Mostra loading enquanto verifica
  if (loading) {
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Se não está autorizado, não renderiza nada
  // O useEffect vai redirecionar
  if (!isAuthorized) {
    return fallback || null;
  }

  // Renderiza conteúdo protegido
  return <>{children}</>;
}

/**
 * Hook customizado para verificar autorização
 */
export function useRequireAuth(requireAdmin = false) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (requireAdmin && !isAdmin) {
      router.replace('/');
      return;
    }
  }, [user, isAdmin, loading, requireAdmin, router]);

  return {
    isAuthorized: !loading && (user !== null) && (!requireAdmin || isAdmin),
    loading,
  };
}
