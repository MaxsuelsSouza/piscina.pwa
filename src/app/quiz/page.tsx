'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import type { Quiz } from './_types';
import { NIVEL_QUIZ_COLORS } from './_types';

export default function QuizPage() {
  const router = useRouter();
  const { user: firebaseUser, loading: authLoading } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdmin = !!firebaseUser;

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.replace('/login');
    }
  }, [firebaseUser, authLoading, router]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchQuizzes();
  }, [isAdmin]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/quiz');
      const data = await res.json();
      if (data.quizzes) {
        setQuizzes(data.quizzes);
      }
    } catch (error) {
      console.error('Erro ao carregar quizzes:', error);
      showMessage('error', 'Erro ao carregar quizzes');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSeedQuiz = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/quiz/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'programacao' }),
      });

      const data = await res.json();

      if (res.status === 409) {
        showMessage('error', 'Quiz de Programacao ja existe!');
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar quiz');
      }

      showMessage('success', data.message);
      fetchQuizzes();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar quiz';
      showMessage('error', errorMessage);
    } finally {
      setSeeding(false);
    }
  };

  const getQuizStats = (quiz: Quiz) => {
    const facil = quiz.questoes.filter(q => q.nivel === 'Facil').length;
    const medio = quiz.questoes.filter(q => q.nivel === 'Medio').length;
    const dificil = quiz.questoes.filter(q => q.nivel === 'Dificil').length;
    return { facil, medio, dificil };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/workspace"
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
          <div className="flex-1">
            <h1 className="text-lg font-serif text-stone-800">Quiz</h1>
            <p className="text-xs text-stone-400">
              {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} disponivel{quizzes.length !== 1 ? 'is' : ''}
            </p>
          </div>
        </div>
      </header>

      {/* Message */}
      {message && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {quizzes.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-stone-800 mb-2">Nenhum quiz cadastrado</h2>
            <p className="text-stone-500 mb-6">
              Clique no botao abaixo para criar o Quiz de Programacao com 200 questoes.
            </p>
            <button
              onClick={handleSeedQuiz}
              disabled={seeding}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition disabled:opacity-50"
            >
              {seeding ? 'Criando...' : 'Criar Quiz de Programacao'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) => {
              const stats = getQuizStats(quiz);
              return (
                <Link
                  key={quiz.id}
                  href={`/quiz/${quiz.id}`}
                  className="block bg-white rounded-xl border border-stone-200 overflow-hidden hover:border-stone-300 transition"
                >
                  <div className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                        <svg
                          className="w-6 h-6 text-indigo-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-stone-800 truncate">{quiz.nome}</h3>
                        <p className="text-sm text-stone-500">
                          {quiz.totalQuestoes} questoes
                        </p>
                      </div>
                      <svg
                        className="w-5 h-5 text-stone-400 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    {/* Stats por nivel */}
                    <div className="flex gap-2 mt-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${NIVEL_QUIZ_COLORS.Facil.bg} ${NIVEL_QUIZ_COLORS.Facil.text}`}>
                        {stats.facil} Facil
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${NIVEL_QUIZ_COLORS.Medio.bg} ${NIVEL_QUIZ_COLORS.Medio.text}`}>
                        {stats.medio} Medio
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${NIVEL_QUIZ_COLORS.Dificil.bg} ${NIVEL_QUIZ_COLORS.Dificil.text}`}>
                        {stats.dificil} Dificil
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* Botao para criar mais quizzes */}
            <button
              onClick={handleSeedQuiz}
              disabled={seeding}
              className="w-full py-3 border-2 border-dashed border-stone-300 rounded-xl text-stone-500 hover:border-indigo-400 hover:text-indigo-600 transition disabled:opacity-50"
            >
              {seeding ? 'Criando...' : '+ Adicionar Quiz de Programacao'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
