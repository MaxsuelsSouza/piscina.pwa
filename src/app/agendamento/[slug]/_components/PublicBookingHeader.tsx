/**
 * Cabeçalho da página pública de agendamento
 */

import Link from 'next/link';

interface PublicBookingHeaderProps {
  clientName?: string;
}

export function PublicBookingHeader({ clientName }: PublicBookingHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 pt-16 pb-28 relative overflow-hidden">
      {/* Efeito decorativo de fundo */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02ek0yNCAzNmMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>

      <div className="max-w-4xl mx-auto px-4 relative">
        {/* Botão Home */}
        <div className="mb-6">
          <Link
            href="/explorar"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-white font-medium transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Explorar Espaços</span>
          </Link>
        </div>

        <div className="text-center">
          {/* Ícone do calendário */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/15 backdrop-blur-md rounded-3xl mb-6 shadow-xl border border-white/20">
            <svg
              className="w-10 h-10 text-white"
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
          <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-3 tracking-tight leading-tight">
            {clientName || 'Carregando...'}
          </h1>

          {/* Subtítulo */}
          <p className="text-blue-100 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Selecione uma data disponível para fazer seu agendamento
          </p>

          {/* Linha decorativa */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="w-12 h-1 bg-white/30 rounded-full"></div>
            <div className="w-2 h-2 bg-white/50 rounded-full"></div>
            <div className="w-12 h-1 bg-white/30 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
