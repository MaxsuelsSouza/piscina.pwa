'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { useAuth } from '@/contexts/AuthContext';
import { GIFT_CATEGORY_LABELS, type GiftCategory } from '@/types/gift';

const CATEGORY_ICONS: Record<GiftCategory, { icon: string; bg: string; color: string }> = {
  'cozinha-eletrodomesticos': { icon: '⚡', bg: 'bg-blue-100', color: 'text-blue-600' },
  'cozinha-utensilios': { icon: '🍳', bg: 'bg-orange-100', color: 'text-orange-600' },
  'cozinha-servir': { icon: '🍽️', bg: 'bg-amber-100', color: 'text-amber-600' },
  'area-servico-maquinario': { icon: '🧺', bg: 'bg-cyan-100', color: 'text-cyan-600' },
  'quarto-enxoval': { icon: '🛏️', bg: 'bg-purple-100', color: 'text-purple-600' },
};

const CATEGORIES = Object.keys(GIFT_CATEGORY_LABELS) as GiftCategory[];

export default function CategoriesPage() {
  const router = useRouter();
  const { client, loading: clientLoading } = useClientAuth();
  const { user: firebaseUser, loading: firebaseLoading } = useAuth();

  const loading = clientLoading || firebaseLoading;
  const isAuthenticated = client || firebaseUser;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/presentes"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition"
          >
            <svg
              className="w-5 h-5 text-stone-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-lg font-serif text-stone-800">Lista de Presentes</h1>
        </div>
      </header>

      {/* Categories Grid */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <p className="text-sm text-stone-500 mb-4">
          Escolha uma categoria para ver os presentes disponíveis
        </p>

        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((category) => {
            const { icon, bg, color } = CATEGORY_ICONS[category];
            const label = GIFT_CATEGORY_LABELS[category];
            // Split label for better display
            const parts = label.split(' - ');
            const mainLabel = parts[0];
            const subLabel = parts[1] || '';

            return (
              <Link
                key={category}
                href={`/presentes/categorias/${category}`}
                className="bg-white rounded-xl border border-stone-200 p-4 hover:border-stone-300 hover:shadow-sm transition"
              >
                <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                  <span className="text-xl">{icon}</span>
                </div>
                <h3 className="font-medium text-stone-800 text-sm leading-tight">
                  {mainLabel}
                </h3>
                {subLabel && (
                  <p className="text-xs text-stone-400 mt-0.5">{subLabel}</p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
