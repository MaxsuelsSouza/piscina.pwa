/**
 * Cabeçalho da página pública de agendamento
 */

'use client';

import Link from 'next/link';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';

interface PublicBookingHeaderProps {
  clientName?: string;
}

export function PublicBookingHeader({ clientName }: PublicBookingHeaderProps) {
  const { client } = useClientAuth();

  return (
    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-gray-800 dark:via-gray-900 dark:to-black pt-16 pb-28 relative overflow-hidden">
      {/* Efeito decorativo de fundo */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02ek0yNCAzNmMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>

      {/* Botões de ação no canto superior direito */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <ThemeToggle />
        <Link
          href={client ? '/perfil-cliente' : '/login-cliente'}
          className="inline-flex items-center justify-center w-10 h-10 bg-white/20 dark:bg-gray-800/50 hover:bg-white/30 dark:hover:bg-gray-700/70 backdrop-blur-md rounded-full transition-all border border-white/30 dark:border-gray-600/50 group"
          title={client ? 'Meu Perfil' : 'Entrar'}
        >
          <svg
            className="w-5 h-5 text-white dark:text-gray-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 relative">
        <div className="text-center">
          {/* Ícone do calendário */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/15 dark:bg-gray-800/50 backdrop-blur-md rounded-3xl mb-6 shadow-xl border border-white/20 dark:border-gray-600/50">
            <svg
              className="w-10 h-10 text-white dark:text-gray-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>

          {/* Título principal com fonte Poppins */}
          <h1 className="text-5xl md:text-6xl font-display font-bold text-white dark:text-gray-100 mb-3 tracking-tight leading-tight">
            {clientName || 'Carregando...'}
          </h1>

          {/* Subtítulo */}
          <p className="text-blue-100 dark:text-gray-300 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Selecione uma data disponível para fazer seu agendamento
          </p>

          {/* Linha decorativa */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="w-12 h-1 bg-white/30 dark:bg-gray-600/50 rounded-full"></div>
            <div className="w-2 h-2 bg-white/50 dark:bg-gray-500/50 rounded-full"></div>
            <div className="w-12 h-1 bg-white/30 dark:bg-gray-600/50 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
