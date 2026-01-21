'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import type { Quiz, Questao, NivelQuiz } from '../_types';
import { NIVEL_QUIZ_COLORS } from '../_types';

// Dias para bloquear repeticao de pergunta
const DIAS_BLOQUEIO = 40;

// Tipo para historico de perguntas vistas
interface HistoricoQuestao {
  questaoId: string;
  dataVista: string; // ISO date string (YYYY-MM-DD)
}

// Tipo para questao do dia
interface QuestaoDoDia {
  questaoId: string;
  data: string; // YYYY-MM-DD
}

// Helper para obter data atual no formato YYYY-MM-DD
const getDataHoje = (): string => {
  const hoje = new Date();
  return hoje.toISOString().split('T')[0];
};

// Helper para carregar historico do localStorage
const carregarHistorico = (quizId: string): HistoricoQuestao[] => {
  if (typeof window === 'undefined') return [];
  const storageKey = `quiz-historico-${quizId}`;
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      return JSON.parse(saved) as HistoricoQuestao[];
    } catch {
      return [];
    }
  }
  return [];
};

// Helper para salvar historico no localStorage
const salvarHistorico = (quizId: string, historico: HistoricoQuestao[]) => {
  if (typeof window === 'undefined') return;
  const storageKey = `quiz-historico-${quizId}`;
  localStorage.setItem(storageKey, JSON.stringify(historico));
};

// Helper para carregar questao do dia
const carregarQuestaoDoDia = (quizId: string): QuestaoDoDia | null => {
  if (typeof window === 'undefined') return null;
  const storageKey = `quiz-questao-dia-${quizId}`;
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      return JSON.parse(saved) as QuestaoDoDia;
    } catch {
      return null;
    }
  }
  return null;
};

// Helper para salvar questao do dia
const salvarQuestaoDoDia = (quizId: string, questaoDoDia: QuestaoDoDia) => {
  if (typeof window === 'undefined') return;
  const storageKey = `quiz-questao-dia-${quizId}`;
  localStorage.setItem(storageKey, JSON.stringify(questaoDoDia));
};

// Helper para verificar se questao esta bloqueada
const verificarQuestaoEstaBloqueada = (questaoId: string, historico: HistoricoQuestao[]): boolean => {
  const registro = historico.find(h => h.questaoId === questaoId);
  if (!registro) return false;

  const dataVista = new Date(registro.dataVista);
  const hoje = new Date();
  const diffTime = Math.abs(hoje.getTime() - dataVista.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays < DIAS_BLOQUEIO;
};

// Embaralhar array (Fisher-Yates)
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default function QuizPlayPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;
  const { user: firebaseUser, loading: authLoading } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [questaoAtual, setQuestaoAtual] = useState<Questao | null>(null);
  const [todasEstudadas, setTodasEstudadas] = useState(false);
  const [proximaData, setProximaData] = useState<string | null>(null);

  const isAdmin = !!firebaseUser;

  // Funcao para obter ou definir a questao do dia
  const obterQuestaoDoDia = (quizData: Quiz): Questao | null => {
    const hoje = getDataHoje();
    const questaoDoDiaSalva = carregarQuestaoDoDia(quizId);

    // Se ja tem uma questao definida para hoje, usar ela
    if (questaoDoDiaSalva && questaoDoDiaSalva.data === hoje) {
      const questaoSalva = quizData.questoes.find(q => q.id === questaoDoDiaSalva.questaoId);
      if (questaoSalva) {
        return questaoSalva;
      }
    }

    // Caso contrario, selecionar uma nova questao
    const historico = carregarHistorico(quizId);

    // Filtrar questoes disponiveis (nao bloqueadas)
    const questoesDisponiveis = quizData.questoes.filter(
      q => !verificarQuestaoEstaBloqueada(q.id, historico)
    );

    if (questoesDisponiveis.length === 0) {
      // Todas as questoes estao bloqueadas
      // Encontrar quando a proxima questao estara disponivel
      const historicoOrdenado = [...historico].sort((a, b) =>
        new Date(a.dataVista).getTime() - new Date(b.dataVista).getTime()
      );

      if (historicoOrdenado.length > 0) {
        const maisAntiga = new Date(historicoOrdenado[0].dataVista);
        maisAntiga.setDate(maisAntiga.getDate() + DIAS_BLOQUEIO);
        setProximaData(maisAntiga.toLocaleDateString('pt-BR'));
      }

      setTodasEstudadas(true);
      return null;
    }

    // Embaralhar e selecionar uma questao aleatoria
    const embaralhadas = shuffleArray(questoesDisponiveis);
    const questaoSelecionada = embaralhadas[0];

    // Salvar a questao do dia
    salvarQuestaoDoDia(quizId, {
      questaoId: questaoSelecionada.id,
      data: hoje,
    });

    // Marcar a questao como vista no historico
    const novoHistorico = historico.filter(h => h.questaoId !== questaoSelecionada.id);
    novoHistorico.push({
      questaoId: questaoSelecionada.id,
      dataVista: hoje,
    });

    // Limpar registros muito antigos (mais de 60 dias)
    const limiteAntigo = new Date();
    limiteAntigo.setDate(limiteAntigo.getDate() - 60);
    const historicoLimpo = novoHistorico.filter(h => {
      const data = new Date(h.dataVista);
      return data > limiteAntigo;
    });

    salvarHistorico(quizId, historicoLimpo);

    return questaoSelecionada;
  };

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.replace('/login');
    }
  }, [firebaseUser, authLoading, router]);

  // Fetch quiz
  useEffect(() => {
    if (!isAdmin || !quizId) return;

    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/quiz/${quizId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Quiz nao encontrado');
        }

        setQuiz(data.quiz);
        const questao = obterQuestaoDoDia(data.quiz);
        setQuestaoAtual(questao);
      } catch (error) {
        console.error('Erro ao carregar quiz:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [isAdmin, quizId]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <p className="text-stone-500 mb-4">Quiz nao encontrado</p>
          <Link href="/quiz" className="text-indigo-600 hover:underline">
            Voltar para lista
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/quiz"
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
            <h1 className="text-lg font-serif text-stone-800">Estudo do Dia</h1>
            <p className="text-xs text-stone-400">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Card do assunto do dia */}
        {questaoAtual ? (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            {/* Header do card */}
            <div className="px-5 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-100 text-sm">Assunto do dia</span>
                  <span className="text-white/60 text-xs">#{questaoAtual.numero}</span>
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${NIVEL_QUIZ_COLORS[questaoAtual.nivel].bg} ${NIVEL_QUIZ_COLORS[questaoAtual.nivel].text}`}>
                  {questaoAtual.nivel}
                </span>
              </div>
            </div>

            {/* Conteudo */}
            <div className="p-5">
              {/* Pergunta/Titulo */}
              <h2 className="text-xl font-semibold text-stone-800 mb-4">
                {questaoAtual.pergunta}
              </h2>

              {/* Resposta/Descricao */}
              <div className="p-4 bg-stone-50 rounded-xl mb-5">
                <p className="text-stone-700 leading-relaxed">
                  {questaoAtual.resposta}
                </p>
              </div>

              {/* Link para estudo */}
              <a
                href={questaoAtual.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition group"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-blue-800 font-medium text-sm block">
                    Aprofundar conhecimento
                  </span>
                  <span className="text-blue-600 text-xs truncate block">
                    {questaoAtual.link.replace('https://', '').split('/')[0]}
                  </span>
                </div>
                <svg className="w-5 h-5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 bg-stone-50 border-t border-stone-100">
              <p className="text-xs text-stone-500 text-center">
                Volte amanha para um novo assunto
              </p>
            </div>
          </div>
        ) : todasEstudadas ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-stone-800 mb-3">
              Parabens!
            </h3>
            <p className="text-stone-600 mb-2">
              Voce estudou todos os {quiz.questoes.length} assuntos disponiveis.
            </p>
            <p className="text-stone-500 text-sm">
              Os assuntos comecam a voltar em ciclos de {DIAS_BLOQUEIO} dias para reforcar o aprendizado.
            </p>
            {proximaData && (
              <p className="text-indigo-600 font-medium mt-4">
                Proximo assunto disponivel em: {proximaData}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
            <p className="text-stone-500">Carregando...</p>
          </div>
        )}
      </div>
    </div>
  );
}
