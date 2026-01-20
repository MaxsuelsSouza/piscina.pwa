'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { isAdmin } from '../_config/admin';

interface WorkspaceModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

const modules: WorkspaceModule[] = [
  {
    id: 'lista-casa-nova',
    title: 'Lista de Casa Nova',
    description: 'Gerenciar presentes, convidados e pagamentos',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
    href: '/lista-casamento/presentes',
    color: 'bg-rose-500',
  },
  {
    id: 'treino',
    title: 'Treino',
    description: 'Gerenciar treinos e exercícios',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h3m0 0V4m0 3v3m14-3h3m-3 0V4m0 3v3M6 17h3m-3 0v3m0-3v-3m11 3h3m-3 0v3m0-3v-3M6 7h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2z" />
      </svg>
    ),
    href: '/lista-casamento/treino',
    color: 'bg-blue-500',
  },
];

export default function WorkspacePage() {
  const router = useRouter();
  const { client, loading, logout } = useClientAuth();

  useEffect(() => {
    if (!loading) {
      if (!client) {
        router.replace('/lista-casamento');
      } else if (!isAdmin(client.phone)) {
        // Se não é admin, redireciona para a lista de presentes normal
        router.replace('/lista-casamento/presentes');
      }
    }
  }, [client, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!client || !isAdmin(client.phone)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-serif text-stone-800">Workspace</h1>
              <p className="text-sm text-stone-400">
                Olá, {client.fullName}
              </p>
            </div>
            <button
              onClick={() => {
                logout();
                router.replace('/lista-casamento');
              }}
              className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-lg font-medium text-stone-700 mb-6">Módulos</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map((module) => (
            <Link
              key={module.id}
              href={module.href}
              className="bg-white rounded-xl border border-stone-200 p-6 hover:shadow-lg hover:border-stone-300 transition group"
            >
              <div className="flex items-start gap-4">
                <div className={`${module.color} text-white p-3 rounded-xl group-hover:scale-110 transition`}>
                  {module.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-stone-800 group-hover:text-rose-600 transition">
                    {module.title}
                  </h3>
                  <p className="text-sm text-stone-500 mt-1">
                    {module.description}
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-1 transition"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
