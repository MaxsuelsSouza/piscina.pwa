'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import type { Treino, Exercicio, StatusTreino, DiaTreino, StatusDia } from '../_types';
import { STATUS_TREINO_LABELS } from '../_types';

type ViewMode = 'dias' | 'dia-detail' | 'execute';

export default function TreinoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const treinoId = params.id as string;
  const { user: firebaseUser, loading: authLoading } = useAuth();

  const [treino, setTreino] = useState<Treino | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // View mode and selected day
  const [viewMode, setViewMode] = useState<ViewMode>('dias');
  const [selectedDia, setSelectedDia] = useState<DiaTreino | null>(null);

  // Exercise form
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercicio | null>(null);
  const [nomeExercicio, setNomeExercicio] = useState('');
  const [series, setSeries] = useState('3');
  const [repeticoes, setRepeticoes] = useState('12');
  const [videoUrl, setVideoUrl] = useState('');

  // Execution state
  const [currentExercicioIndex, setCurrentExercicioIndex] = useState(0);
  const [completedExercicios, setCompletedExercicios] = useState<Set<string>>(new Set());
  const [showVideo, setShowVideo] = useState(false);

  // Delete/Inactivate confirmation
  const [deletingExercise, setDeletingExercise] = useState<Exercicio | null>(null);
  const [inactivatingDia, setInactivatingDia] = useState<DiaTreino | null>(null);

  // Só Firebase Auth pode acessar
  const isAdmin = !!firebaseUser;

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.replace('/login');
    }
  }, [firebaseUser, authLoading, router]);

  // Fetch treino
  useEffect(() => {
    if (!treinoId || !isAdmin) return;

    const fetchTreino = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/treino/${treinoId}`);
        const data = await res.json();

        if (data.treino) {
          // Garantir que dias existe
          const treinoData = data.treino;
          if (!treinoData.dias || treinoData.dias.length === 0) {
            // Criar dias baseado na quantidade ou default 3
            const numDias = treinoData.quantidadeDias || 3;
            treinoData.dias = Array.from({ length: numDias }, (_, i) => ({
              id: `dia-${Date.now()}-${i + 1}`,
              numero: i + 1,
              status: 'ativo' as StatusDia,
              exercicios: [],
            }));
          }
          setTreino(treinoData);
        } else {
          router.replace('/treino');
        }
      } catch (error) {
        console.error('Erro ao carregar treino:', error);
        router.replace('/treino');
      } finally {
        setLoading(false);
      }
    };

    fetchTreino();
  }, [treinoId, isAdmin, router]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const resetExerciseForm = () => {
    setNomeExercicio('');
    setSeries('3');
    setRepeticoes('12');
    setVideoUrl('');
    setEditingExercise(null);
    setShowExerciseForm(false);
  };

  // Abrir dia para edição/visualização
  const openDia = (dia: DiaTreino) => {
    setSelectedDia(dia);
    setViewMode('dia-detail');
    setShowExerciseForm(false);
  };

  // Voltar para lista de dias
  const backToDias = () => {
    setSelectedDia(null);
    setViewMode('dias');
    resetExerciseForm();
  };

  // Salvar treino no backend
  const saveTreino = async (updatedTreino: Treino) => {
    const res = await fetch(`/api/treino/${treinoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dias: updatedTreino.dias }),
    });

    if (!res.ok) {
      throw new Error('Erro ao salvar treino');
    }

    setTreino(updatedTreino);
  };

  // Inativar/Reativar dia
  const handleToggleDiaStatus = async (dia: DiaTreino) => {
    if (!treino) return;

    setSaving(true);

    try {
      const newStatus: StatusDia = dia.status === 'ativo' ? 'inativo' : 'ativo';
      const updatedDias = treino.dias.map(d =>
        d.id === dia.id ? { ...d, status: newStatus } : d
      );

      await saveTreino({ ...treino, dias: updatedDias });
      showMessage('success', newStatus === 'inativo' ? 'Dia inativado!' : 'Dia reativado!');
      setInactivatingDia(null);
    } catch (error: any) {
      showMessage('error', error.message || 'Erro ao atualizar dia');
    } finally {
      setSaving(false);
    }
  };

  // Adicionar/Editar exercício no dia selecionado
  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeExercicio.trim() || !treino || !selectedDia) {
      showMessage('error', 'Nome do exercício é obrigatório');
      return;
    }

    setSaving(true);

    try {
      const newExercicio: Exercicio = {
        id: editingExercise?.id || Date.now().toString(),
        nome: nomeExercicio.trim(),
        series: parseInt(series) || 3,
        repeticoes: repeticoes.trim() || '12',
        videoUrl: videoUrl.trim() || undefined,
        ordem: editingExercise?.ordem ?? selectedDia.exercicios.length,
      };

      let updatedExercicios: Exercicio[];

      if (editingExercise) {
        updatedExercicios = selectedDia.exercicios.map(ex =>
          ex.id === editingExercise.id ? newExercicio : ex
        );
      } else {
        updatedExercicios = [...selectedDia.exercicios, newExercicio];
      }

      const updatedDia = { ...selectedDia, exercicios: updatedExercicios };
      const updatedDias = treino.dias.map(d =>
        d.id === selectedDia.id ? updatedDia : d
      );

      await saveTreino({ ...treino, dias: updatedDias });
      setSelectedDia(updatedDia);

      showMessage('success', editingExercise ? 'Exercício atualizado!' : 'Exercício adicionado!');

      if (editingExercise) {
        resetExerciseForm();
      } else {
        setNomeExercicio('');
        setSeries('3');
        setRepeticoes('12');
        setVideoUrl('');
      }
    } catch (error: any) {
      showMessage('error', error.message || 'Erro ao salvar exercício');
    } finally {
      setSaving(false);
    }
  };

  const handleEditExercise = (exercise: Exercicio) => {
    setEditingExercise(exercise);
    setNomeExercicio(exercise.nome);
    setSeries(exercise.series.toString());
    setRepeticoes(exercise.repeticoes);
    setVideoUrl(exercise.videoUrl || '');
    setShowExerciseForm(true);
  };

  const handleDeleteExercise = async () => {
    if (!deletingExercise || !treino || !selectedDia) return;

    setSaving(true);

    try {
      const updatedExercicios = selectedDia.exercicios.filter(ex => ex.id !== deletingExercise.id);
      const updatedDia = { ...selectedDia, exercicios: updatedExercicios };
      const updatedDias = treino.dias.map(d =>
        d.id === selectedDia.id ? updatedDia : d
      );

      await saveTreino({ ...treino, dias: updatedDias });
      setSelectedDia(updatedDia);

      showMessage('success', 'Exercício excluído!');
      setDeletingExercise(null);
    } catch (error: any) {
      showMessage('error', error.message || 'Erro ao excluir exercício');
    } finally {
      setSaving(false);
    }
  };

  const handleStartTreino = async () => {
    if (!treino) return;

    setSaving(true);

    try {
      const res = await fetch(`/api/treino/${treinoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'em_progresso' }),
      });

      if (!res.ok) {
        throw new Error('Erro ao iniciar treino');
      }

      setTreino({ ...treino, status: 'em_progresso' as StatusTreino });
      showMessage('success', 'Treino iniciado! Agora você pode executá-lo.');
    } catch (error: any) {
      showMessage('error', error.message || 'Erro ao iniciar treino');
    } finally {
      setSaving(false);
    }
  };

  const normalizeVideoUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  const getYoutubeEmbedUrl = (url: string): string | null => {
    const normalized = normalizeVideoUrl(url);

    const watchMatch = normalized.match(/youtube\.com\/watch\?v=([^&]+)/);
    if (watchMatch) {
      return `https://www.youtube.com/embed/${watchMatch[1]}`;
    }

    const shortMatch = normalized.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) {
      return `https://www.youtube.com/embed/${shortMatch[1]}`;
    }

    const shortsMatch = normalized.match(/youtube\.com\/shorts\/([^?]+)/);
    if (shortsMatch) {
      return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    }

    return null;
  };

  // Execution functions
  const startExecution = (dia: DiaTreino) => {
    setSelectedDia(dia);
    setViewMode('execute');
    setCurrentExercicioIndex(0);
    setCompletedExercicios(new Set());
    setShowVideo(false);
  };

  const exitExecution = () => {
    setViewMode('dias');
    setSelectedDia(null);
    setCurrentExercicioIndex(0);
    setCompletedExercicios(new Set());
    setShowVideo(false);
  };

  const currentExercicio = selectedDia?.exercicios?.[currentExercicioIndex];
  const totalExercicios = selectedDia?.exercicios?.length || 0;
  const completedCount = completedExercicios.size;
  const progress = totalExercicios > 0 ? (completedCount / totalExercicios) * 100 : 0;

  const handleComplete = () => {
    if (!currentExercicio) return;

    setCompletedExercicios(prev => new Set([...prev, currentExercicio.id]));

    if (currentExercicioIndex < totalExercicios - 1) {
      setCurrentExercicioIndex(currentExercicioIndex + 1);
      setShowVideo(false);
    }
  };

  const handlePrevious = () => {
    if (currentExercicioIndex > 0) {
      setCurrentExercicioIndex(currentExercicioIndex - 1);
      setShowVideo(false);
    }
  };

  const handleNext = () => {
    if (currentExercicioIndex < totalExercicios - 1) {
      setCurrentExercicioIndex(currentExercicioIndex + 1);
      setShowVideo(false);
    }
  };

  const handleSelectExercicio = (index: number) => {
    setCurrentExercicioIndex(index);
    setShowVideo(false);
  };

  const getStatusColor = (status: StatusTreino) => {
    switch (status) {
      case 'em_construcao':
        return 'bg-amber-100 text-amber-700';
      case 'em_progresso':
        return 'bg-emerald-100 text-emerald-700';
      case 'inativo':
        return 'bg-stone-100 text-stone-500';
      default:
        return 'bg-stone-100 text-stone-500';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin || !treino) {
    return null;
  }

  const isCompleted = completedCount === totalExercicios && totalExercicios > 0;
  const isEmConstrucao = treino.status === 'em_construcao' || !treino.status;
  const diasAtivos = treino.dias?.filter(d => d.status === 'ativo') || [];
  const totalExerciciosTreino = treino.dias?.reduce((acc, d) => acc + d.exercicios.length, 0) || 0;
  const canStartTreino = totalExerciciosTreino > 0;

  // ========== EXECUTION MODE ==========
  if (viewMode === 'execute' && selectedDia) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        {/* Header minimalista */}
        <header className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/50">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={exitExecution}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition"
              >
                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center">
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Dia {selectedDia.numero}</p>
                <p className="text-sm font-medium text-white">{treino.pessoa}</p>
              </div>

              <div className="w-9 h-9 flex items-center justify-center">
                <span className="text-sm font-medium text-zinc-400">{completedCount}/{totalExercicios}</span>
              </div>
            </div>

            {/* Progress bar fina */}
            <div className="mt-4 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="max-w-2xl mx-auto px-4 py-8">
          {isCompleted ? (
            /* Tela de conclusão simples */
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-2">Concluído</h2>
              <p className="text-zinc-400 mb-8">
                {totalExercicios} exercícios finalizados
              </p>

              <button
                onClick={exitExecution}
                className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition"
              >
                Voltar
              </button>
            </div>
          ) : currentExercicio ? (
            <div>
              {/* Número do exercício */}
              <div className="text-center mb-8">
                <span className="text-6xl font-light text-zinc-700">{currentExercicioIndex + 1}</span>
                <span className="text-2xl text-zinc-700">/{totalExercicios}</span>
              </div>

              {/* Card do exercício - minimalista */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-white text-center mb-8">
                  {currentExercicio.nome}
                </h2>

                {/* Séries e Repetições */}
                <div className="flex justify-center gap-12 mb-8">
                  <div className="text-center">
                    <p className="text-5xl font-light text-white mb-1">{currentExercicio.series}</p>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">Séries</p>
                  </div>
                  <div className="w-px bg-zinc-800" />
                  <div className="text-center">
                    <p className="text-5xl font-light text-white mb-1">{currentExercicio.repeticoes}</p>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">Reps</p>
                  </div>
                </div>

                {/* Status */}
                {completedExercicios.has(currentExercicio.id) && (
                  <div className="flex items-center justify-center gap-2 text-emerald-500 mb-6">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">Concluído</span>
                  </div>
                )}

                {/* Botão de vídeo */}
                {currentExercicio.videoUrl && (
                  <button
                    onClick={() => setShowVideo(!showVideo)}
                    className="w-full py-3 text-zinc-400 hover:text-white text-sm flex items-center justify-center gap-2 transition"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                    </svg>
                    {showVideo ? 'Ocultar vídeo' : 'Ver vídeo'}
                  </button>
                )}

                {/* Video embed */}
                {showVideo && currentExercicio.videoUrl && (
                  <div className="mt-4 rounded-lg overflow-hidden bg-black aspect-video">
                    {getYoutubeEmbedUrl(currentExercicio.videoUrl) ? (
                      <iframe
                        src={getYoutubeEmbedUrl(currentExercicio.videoUrl)!}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <a
                          href={normalizeVideoUrl(currentExercicio.videoUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-400 hover:text-white transition"
                        >
                          Abrir vídeo
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botão principal */}
              {!completedExercicios.has(currentExercicio.id) ? (
                <button
                  onClick={handleComplete}
                  className="w-full py-4 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-100 transition mb-4"
                >
                  Concluir
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={currentExercicioIndex === totalExercicios - 1}
                  className="w-full py-4 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition disabled:opacity-30 mb-4"
                >
                  Próximo
                </button>
              )}

              {/* Navegação */}
              <div className="flex gap-2 mb-8">
                <button
                  onClick={handlePrevious}
                  disabled={currentExercicioIndex === 0}
                  className="flex-1 py-3 text-zinc-500 hover:text-white text-sm transition disabled:opacity-30"
                >
                  Anterior
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentExercicioIndex === totalExercicios - 1}
                  className="flex-1 py-3 text-zinc-500 hover:text-white text-sm transition disabled:opacity-30"
                >
                  Pular
                </button>
              </div>

              {/* Lista de exercícios compacta */}
              <div className="border-t border-zinc-800/50 pt-6">
                <p className="text-xs text-zinc-600 uppercase tracking-widest mb-4">Exercícios</p>
                <div className="space-y-1">
                  {selectedDia.exercicios.map((ex, index) => {
                    const isActive = index === currentExercicioIndex;
                    const isDone = completedExercicios.has(ex.id);

                    return (
                      <button
                        key={ex.id}
                        onClick={() => handleSelectExercicio(index)}
                        className={`w-full px-3 py-2.5 flex items-center gap-3 text-left rounded-lg transition ${
                          isActive ? 'bg-zinc-800' : 'hover:bg-zinc-900'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 flex items-center justify-center rounded text-xs font-medium ${
                            isDone
                              ? 'bg-emerald-500 text-white'
                              : isActive
                                ? 'bg-white text-zinc-900'
                                : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          {isDone ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            index + 1
                          )}
                        </span>
                        <span className={`flex-1 text-sm truncate ${
                          isActive ? 'text-white' : isDone ? 'text-zinc-600' : 'text-zinc-400'
                        }`}>
                          {ex.nome}
                        </span>
                        <span className="text-xs text-zinc-600">
                          {ex.series}×{ex.repeticoes}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-zinc-500">Nenhum exercício</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========== DIA DETAIL MODE ==========
  if (viewMode === 'dia-detail' && selectedDia) {
    return (
      <div className="min-h-screen bg-stone-50 pb-8">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              onClick={backToDias}
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
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-serif text-stone-800">
                  Dia {selectedDia.numero}
                </h1>
                {selectedDia.nome && (
                  <span className="text-sm text-stone-500">- {selectedDia.nome}</span>
                )}
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  selectedDia.status === 'ativo'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-stone-100 text-stone-500'
                }`}>
                  {selectedDia.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                {selectedDia.exercicios.length} exercício{selectedDia.exercicios.length !== 1 ? 's' : ''}
              </p>
            </div>
            {!showExerciseForm && selectedDia.status === 'ativo' && (
              <button
                onClick={() => setShowExerciseForm(true)}
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition"
              >
                + Exercício
              </button>
            )}
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
          {/* Botão Iniciar Treino do dia */}
          {selectedDia.status === 'ativo' && selectedDia.exercicios.length > 0 && treino.status === 'em_progresso' && (
            <button
              onClick={() => startExecution(selectedDia)}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition flex items-center justify-center gap-2 mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Iniciar Treino do Dia {selectedDia.numero}
            </button>
          )}

          {/* Add exercise form */}
          {showExerciseForm && (
            <div className="bg-white rounded-xl border border-stone-200 p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-stone-800">
                  {editingExercise ? 'Editar Exercício' : 'Novo Exercício'}
                </h2>
                {!editingExercise && (
                  <span className="text-xs text-stone-500 bg-stone-100 px-2 py-1 rounded-full">
                    Adicione vários de uma vez
                  </span>
                )}
              </div>

              <form onSubmit={handleAddExercise} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Nome do Exercício *
                  </label>
                  <input
                    type="text"
                    value={nomeExercicio}
                    onChange={(e) => setNomeExercicio(e.target.value)}
                    placeholder="Ex: Supino reto"
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:border-blue-500 focus:ring-0 outline-none transition bg-white"
                    style={{ color: '#1c1917' }}
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Séries
                    </label>
                    <input
                      type="number"
                      value={series}
                      onChange={(e) => setSeries(e.target.value)}
                      placeholder="3"
                      min="1"
                      className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:border-blue-500 focus:ring-0 outline-none transition bg-white"
                      style={{ color: '#1c1917' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Repetições
                    </label>
                    <input
                      type="text"
                      value={repeticoes}
                      onChange={(e) => setRepeticoes(e.target.value)}
                      placeholder="12 ou 10-12"
                      className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:border-blue-500 focus:ring-0 outline-none transition bg-white"
                      style={{ color: '#1c1917' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Link do Vídeo (opcional)
                  </label>
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="youtube.com/watch?v=..."
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:border-blue-500 focus:ring-0 outline-none transition bg-white"
                    style={{ color: '#1c1917' }}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  {editingExercise ? (
                    <>
                      <button
                        type="button"
                        onClick={resetExerciseForm}
                        className="flex-1 py-3 text-stone-600 font-medium rounded-xl border border-stone-200 hover:bg-stone-50 transition"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={saving || !nomeExercicio.trim()}
                        className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition disabled:opacity-50"
                      >
                        {saving ? 'Salvando...' : 'Atualizar'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={resetExerciseForm}
                        className="px-6 py-3 text-stone-600 font-medium rounded-xl border border-stone-200 hover:bg-stone-50 transition"
                      >
                        Finalizar
                      </button>
                      <button
                        type="submit"
                        disabled={saving || !nomeExercicio.trim()}
                        className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {saving ? (
                          'Adicionando...'
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Adicionar e Continuar
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Exercise list */}
          {selectedDia.exercicios.length === 0 && !showExerciseForm ? (
            <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-lg font-medium text-stone-800 mb-2">Nenhum exercício</h2>
              <p className="text-stone-500">
                Clique em &quot;+ Exercício&quot; para adicionar exercícios neste dia.
              </p>
            </div>
          ) : selectedDia.exercicios.length > 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-100 bg-stone-50">
                <h3 className="text-sm font-medium text-stone-600">
                  Exercícios ({selectedDia.exercicios.length})
                </h3>
              </div>
              <div className="divide-y divide-stone-100">
                {selectedDia.exercicios.map((ex, index) => (
                  <div
                    key={ex.id}
                    className="px-4 py-3 flex items-center gap-3"
                  >
                    <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 text-sm font-medium rounded-full shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 truncate">{ex.nome}</p>
                      <p className="text-sm text-stone-500">
                        {ex.series} séries x {ex.repeticoes} reps
                        {ex.videoUrl && ' • Com vídeo'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {ex.videoUrl && (
                        <a
                          href={normalizeVideoUrl(ex.videoUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full transition"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                          </svg>
                        </a>
                      )}
                      {selectedDia.status === 'ativo' && (
                        <>
                          <button
                            onClick={() => handleEditExercise(ex)}
                            className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeletingExercise(ex)}
                            className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Delete Exercise Modal */}
        {deletingExercise && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setDeletingExercise(null)}
            />
            <div className="relative bg-white w-full max-w-sm rounded-2xl p-6">
              <h3 className="text-lg font-medium text-stone-800 mb-2">
                Excluir exercício?
              </h3>
              <p className="text-sm text-stone-500 mb-6">
                Tem certeza que deseja excluir &quot;{deletingExercise.nome}&quot;?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingExercise(null)}
                  className="flex-1 py-3 text-stone-600 font-medium rounded-xl border border-stone-200 hover:bg-stone-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteExercise}
                  disabled={saving}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition disabled:opacity-50"
                >
                  {saving ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========== DIAS LIST MODE (Principal) ==========
  return (
    <div className="min-h-screen bg-stone-50 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/treino"
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
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-serif text-stone-800 truncate">{treino.nome}</h1>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${
                treino.pessoa === 'Maxsuel'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-pink-100 text-pink-700'
              }`}>
                {treino.pessoa}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(treino.status || 'em_construcao')}`}>
                {STATUS_TREINO_LABELS[treino.status || 'em_construcao']}
              </span>
              <span className="text-xs text-stone-400">
                • {treino.dias?.length || 0} dias • {totalExerciciosTreino} exercícios
              </span>
            </div>
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
        {/* Botão Dar Início - apenas quando em construção e tem exercícios */}
        {isEmConstrucao && canStartTreino && (
          <button
            onClick={handleStartTreino}
            disabled={saving}
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition flex items-center justify-center gap-2 mb-4 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {saving ? 'Iniciando...' : 'Dar Início ao Treino'}
          </button>
        )}

        {isEmConstrucao && !canStartTreino && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-amber-700">
              Adicione exercícios em pelo menos um dia para poder iniciar o treino.
            </p>
          </div>
        )}

        {/* Description */}
        {treino.descricao && (
          <div className="bg-white rounded-xl border border-stone-200 p-4 mb-4">
            <p className="text-sm text-stone-600">{treino.descricao}</p>
          </div>
        )}

        {/* Dias list */}
        <div className="space-y-3">
          {treino.dias
            ?.filter((dia) => {
              // Quando em progresso, esconder dias sem exercícios
              if (treino.status === 'em_progresso' && dia.exercicios.length === 0) {
                return false;
              }
              return true;
            })
            .map((dia) => (
            <div
              key={dia.id}
              className={`bg-white rounded-xl border overflow-hidden ${
                dia.status === 'inativo' ? 'border-stone-200 opacity-60' : 'border-stone-200'
              }`}
            >
              {/* Dia card */}
              <button
                onClick={() => openDia(dia)}
                className="w-full px-4 py-4 hover:bg-stone-50 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    dia.status === 'ativo'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-stone-100 text-stone-400'
                  }`}>
                    <span className="text-xl font-bold">{dia.numero}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-stone-800">
                        Dia {dia.numero}
                      </h3>
                      {dia.nome && (
                        <span className="text-sm text-stone-500">- {dia.nome}</span>
                      )}
                      {dia.status === 'inativo' && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-stone-100 text-stone-500">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-500">
                      {dia.exercicios.length} exercício{dia.exercicios.length !== 1 ? 's' : ''}
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
              </button>

              {/* Quick actions */}
              <div className="px-4 py-2 bg-stone-50 border-t border-stone-100 flex justify-end gap-2">
                {dia.status === 'ativo' ? (
                  <>
                    {treino.status === 'em_progresso' && dia.exercicios.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startExecution(dia);
                        }}
                        className="px-3 py-1 text-xs text-emerald-600 font-medium hover:bg-emerald-50 rounded-lg transition"
                      >
                        Iniciar Treino
                      </button>
                    )}
                    {treino.status !== 'em_progresso' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDia(dia);
                          }}
                          className="px-3 py-1 text-xs text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition"
                        >
                          Criar Treino
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInactivatingDia(dia);
                          }}
                          className="px-3 py-1 text-xs text-stone-500 font-medium hover:bg-stone-100 rounded-lg transition"
                        >
                          Inativar
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleDiaStatus(dia);
                    }}
                    disabled={saving}
                    className="px-3 py-1 text-xs text-emerald-600 font-medium hover:bg-emerald-50 rounded-lg transition disabled:opacity-50"
                  >
                    Reativar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {(!treino.dias || treino.dias.length === 0) && (
          <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-stone-800 mb-2">Nenhum dia configurado</h2>
            <p className="text-stone-500">
              Este treino não possui dias configurados.
            </p>
          </div>
        )}
      </div>

      {/* Inactivate Dia Modal */}
      {inactivatingDia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setInactivatingDia(null)}
          />
          <div className="relative bg-white w-full max-w-sm rounded-2xl p-6">
            <h3 className="text-lg font-medium text-stone-800 mb-2">
              Inativar Dia {inactivatingDia.numero}?
            </h3>
            <p className="text-sm text-stone-500 mb-6">
              Tem certeza que deseja inativar este dia? Você poderá reativá-lo depois.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setInactivatingDia(null)}
                className="flex-1 py-3 text-stone-600 font-medium rounded-xl border border-stone-200 hover:bg-stone-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleToggleDiaStatus(inactivatingDia)}
                disabled={saving}
                className="flex-1 py-3 bg-stone-600 hover:bg-stone-700 text-white font-medium rounded-xl transition disabled:opacity-50"
              >
                {saving ? 'Inativando...' : 'Inativar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
