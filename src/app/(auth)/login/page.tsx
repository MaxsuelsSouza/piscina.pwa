/**
 * ============================================
 * Comentado em 2026-01-10 - Migração para Lista de Presentes
 * ============================================
 * Login Page - Sistema de Agendamento
 * Este sistema foi desativado.
 * Código preservado em git history.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 to-purple-600">
      <div className="text-white text-center">
        <p className="text-lg">Página não disponível - Em migração para Lista de Presentes</p>
      </div>
    </div>
  );
}
