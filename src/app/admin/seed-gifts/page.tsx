'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GIFTS_SEED_DATA } from '@/data/gifts-seed';

export default function SeedGiftsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'checking' | 'success' | 'error' | 'exists'>('checking');
  const [error, setError] = useState('');
  const [count, setCount] = useState(0);

  // Verifica se já existem presentes ao carregar
  useEffect(() => {
    checkGifts();
  }, []);

  const checkGifts = async () => {
    setStatus('checking');
    try {
      const res = await fetch('/api/admin/gifts/seed');
      const data = await res.json();

      if (data.hasGifts) {
        setCount(data.count);
        setStatus('exists');
      } else {
        setStatus('idle');
      }
    } catch (err) {
      console.error('Erro ao verificar:', err);
      setStatus('idle');
    }
  };

  const handleSeed = async () => {
    setStatus('loading');
    setError('');

    try {
      const res = await fetch('/api/admin/gifts/seed', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'ALREADY_EXISTS') {
          setStatus('exists');
          return;
        }
        throw new Error(data.error || 'Erro desconhecido');
      }

      setCount(data.count);
      setStatus('success');
    } catch (err) {
      console.error('Erro ao popular presentes:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Seed de Presentes</h1>
        <p className="text-gray-500 mb-6">
          Popular a base de dados com {GIFTS_SEED_DATA.length} presentes da lista de casamento.
        </p>

        {status === 'checking' && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" />
            <span className="ml-3 text-gray-600">Verificando...</span>
          </div>
        )}

        {status === 'idle' && (
          <button
            onClick={handleSeed}
            className="w-full py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-lg transition"
          >
            Iniciar Seed
          </button>
        )}

        {status === 'loading' && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" />
            <span className="ml-3 text-gray-600">Criando presentes...</span>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="bg-green-100 text-green-700 p-4 rounded-lg text-center">
              {count} presentes criados com sucesso!
            </div>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg transition"
            >
              Ir para Lista de Presentes
            </button>
          </div>
        )}

        {status === 'exists' && (
          <div className="space-y-4">
            <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg text-center">
              {count > 0 ? `${count} presentes` : 'Presentes'} já existem na base de dados.
              <br />
              <span className="text-sm">Delete a coleção &quot;gifts&quot; no Firebase Console para recriar.</span>
            </div>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg transition"
            >
              Ir para Lista de Presentes
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="bg-red-100 text-red-700 p-4 rounded-lg text-center">
              Erro: {error}
            </div>
            <button
              onClick={() => setStatus('idle')}
              className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg transition"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-400 text-center">
          Categorias: Cozinha, Área de Serviço, Quarto, Sala, Banheiro, Infraestrutura
        </div>
      </div>
    </div>
  );
}
