'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import type { PerfilValePena, PessoaValePena } from './_types';
import { PESSOAS_VALE_PENA, HORAS_MES, HORAS_DIA } from './_types';

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function parseCurrencyInput(value: string): string {
  return value.replace(/[^\d,]/g, '').replace(',', '.');
}

export default function ValePenaPage() {
  const router = useRouter();
  const { user: firebaseUser, loading: authLoading } = useAuth();

  const [perfis, setPerfis] = useState<PerfilValePena[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Perfil selecionado
  const [perfilSelecionado, setPerfilSelecionado] = useState<PerfilValePena | null>(null);

  // Form de salário
  const [showSalarioForm, setShowSalarioForm] = useState(false);
  const [salarioInput, setSalarioInput] = useState('');
  const [editandoPerfil, setEditandoPerfil] = useState<PessoaValePena | null>(null);

  // Calculadora
  const [valorProduto, setValorProduto] = useState('');

  const isAdmin = !!firebaseUser;

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.replace('/login');
    }
  }, [firebaseUser, authLoading, router]);

  // Fetch perfis
  useEffect(() => {
    if (!isAdmin) return;

    const fetchPerfis = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/vale-a-pena');
        const data = await res.json();
        if (data.perfis) {
          setPerfis(data.perfis);
        }
      } catch (error) {
        console.error('Erro ao carregar perfis:', error);
        showMessage('error', 'Erro ao carregar perfis');
      } finally {
        setLoading(false);
      }
    };

    fetchPerfis();
  }, [isAdmin]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const getPerfilByNome = (nome: PessoaValePena): PerfilValePena | undefined => {
    return perfis.find((p) => p.nome === nome);
  };

  const handleSelecionarPerfil = (nome: PessoaValePena) => {
    const perfil = getPerfilByNome(nome);
    if (perfil) {
      setPerfilSelecionado(perfil);
      setValorProduto('');
    } else {
      // Não tem perfil, abrir form de salário
      setEditandoPerfil(nome);
      setSalarioInput('');
      setShowSalarioForm(true);
    }
  };

  const handleSalvarSalario = async (e: React.FormEvent) => {
    e.preventDefault();

    const salario = Number(parseCurrencyInput(salarioInput));
    if (!salario || salario <= 0) {
      showMessage('error', 'Informe um salário válido');
      return;
    }

    setSaving(true);

    try {
      const perfilExistente = editandoPerfil ? getPerfilByNome(editandoPerfil) : perfilSelecionado;

      if (perfilExistente) {
        // Atualizar
        const res = await fetch(`/api/vale-a-pena/${perfilExistente.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ salarioLiquido: salario }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Erro ao atualizar salário');
        }

        const updated = { ...perfilExistente, salarioLiquido: salario };
        setPerfis(perfis.map((p) => (p.id === perfilExistente.id ? updated : p)));
        setPerfilSelecionado(updated);
        showMessage('success', 'Salário atualizado!');
      } else {
        // Criar
        const nome = editandoPerfil;
        const res = await fetch('/api/vale-a-pena', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, salarioLiquido: salario }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Erro ao criar perfil');
        }

        const novoPerfil: PerfilValePena = {
          id: data.id,
          nome: nome!,
          salarioLiquido: salario,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setPerfis([...perfis, novoPerfil]);
        setPerfilSelecionado(novoPerfil);
        showMessage('success', 'Perfil criado!');
      }

      setShowSalarioForm(false);
      setEditandoPerfil(null);
      setSalarioInput('');
    } catch (error: any) {
      showMessage('error', error.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleEditarSalario = () => {
    if (!perfilSelecionado) return;
    setEditandoPerfil(perfilSelecionado.nome);
    setSalarioInput(perfilSelecionado.salarioLiquido.toString().replace('.', ','));
    setShowSalarioForm(true);
  };

  const handleVoltar = () => {
    if (showSalarioForm) {
      setShowSalarioForm(false);
      setEditandoPerfil(null);
      setSalarioInput('');
      return;
    }
    setPerfilSelecionado(null);
    setValorProduto('');
  };

  // Cálculos
  const valorProdutoNum = Number(parseCurrencyInput(valorProduto)) || 0;
  const valorHora = perfilSelecionado ? perfilSelecionado.salarioLiquido / HORAS_MES : 0;
  const horasNecessarias = valorHora > 0 ? valorProdutoNum / valorHora : 0;
  const diasNecessarios = horasNecessarias / HORAS_DIA;
  const porcentagemSalario = perfilSelecionado
    ? (valorProdutoNum / perfilSelecionado.salarioLiquido) * 100
    : 0;

  const horasInteiras = Math.floor(horasNecessarias);
  const minutosRestantes = Math.round((horasNecessarias - horasInteiras) * 60);

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
          {perfilSelecionado || showSalarioForm ? (
            <button
              onClick={handleVoltar}
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
          ) : (
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
          )}
          <div className="flex-1">
            <h1 className="text-lg font-serif text-stone-800">Vale a Pena Comprar?</h1>
            {perfilSelecionado && (
              <p className="text-xs text-stone-400">
                {perfilSelecionado.nome} &bull; {formatCurrency(perfilSelecionado.salarioLiquido)}/mes
              </p>
            )}
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

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Tela 1: Seleção de perfil */}
        {!perfilSelecionado && !showSalarioForm && (
          <div className="space-y-4">
            <p className="text-sm text-stone-500 text-center mb-6">
              Selecione o perfil para calcular se vale a pena comprar
            </p>

            <div className="grid grid-cols-2 gap-4">
              {PESSOAS_VALE_PENA.map((nome) => {
                const perfil = getPerfilByNome(nome);
                const isMaxsuel = nome === 'Maxsuel';
                return (
                  <button
                    key={nome}
                    onClick={() => handleSelecionarPerfil(nome)}
                    className="bg-white rounded-xl border border-stone-200 p-6 hover:shadow-lg hover:border-stone-300 transition text-center group"
                  >
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
                        isMaxsuel ? 'bg-blue-100' : 'bg-pink-100'
                      }`}
                    >
                      <svg
                        className={`w-8 h-8 ${isMaxsuel ? 'text-blue-600' : 'text-pink-600'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-stone-800 group-hover:text-amber-600 transition">
                      {nome}
                    </h3>
                    {perfil ? (
                      <p className="text-sm text-stone-400 mt-1">
                        {formatCurrency(perfil.salarioLiquido)}/mes
                      </p>
                    ) : (
                      <p className="text-sm text-amber-500 mt-1 font-medium">Configurar</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tela 2: Formulário de salário */}
        {showSalarioForm && (
          <div className="bg-white rounded-xl border border-stone-200 p-6">
            <h2 className="text-lg font-medium text-stone-800 mb-1">
              {getPerfilByNome(editandoPerfil!) ? 'Editar Salário' : 'Configurar Perfil'}
            </h2>
            <p className="text-sm text-stone-400 mb-6">
              {editandoPerfil}
            </p>

            <form onSubmit={handleSalvarSalario} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Salário Líquido (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={salarioInput}
                  onChange={(e) => setSalarioInput(e.target.value)}
                  placeholder="Ex: 3500,00"
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-amber-500 focus:ring-0 outline-none transition bg-white text-lg"
                  style={{ color: '#1c1917' }}
                  autoFocus
                />
                <p className="text-xs text-stone-400 mt-1">
                  Valor que voce recebe por mes (ja descontado impostos)
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSalarioForm(false);
                    setEditandoPerfil(null);
                    setSalarioInput('');
                  }}
                  className="flex-1 py-3 text-stone-600 font-medium rounded-xl border border-stone-200 hover:bg-stone-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !salarioInput.trim()}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tela 3: Calculadora */}
        {perfilSelecionado && !showSalarioForm && (
          <div className="space-y-4">
            {/* Info do perfil */}
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      perfilSelecionado.nome === 'Maxsuel' ? 'bg-blue-100' : 'bg-pink-100'
                    }`}
                  >
                    <svg
                      className={`w-5 h-5 ${
                        perfilSelecionado.nome === 'Maxsuel' ? 'text-blue-600' : 'text-pink-600'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-stone-800">{perfilSelecionado.nome}</p>
                    <p className="text-sm text-stone-400">
                      {formatCurrency(perfilSelecionado.salarioLiquido)}/mes &bull;{' '}
                      {formatCurrency(valorHora)}/hora
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleEditarSalario}
                  className="px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition"
                >
                  Editar
                </button>
              </div>
            </div>

            {/* Input do produto */}
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Valor do produto
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-lg">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={valorProduto}
                  onChange={(e) => setValorProduto(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-12 pr-4 py-4 rounded-lg border border-stone-200 focus:border-amber-500 focus:ring-0 outline-none transition bg-white text-2xl font-medium"
                  style={{ color: '#1c1917' }}
                  autoFocus
                />
              </div>
            </div>

            {/* Resultado */}
            {valorProdutoNum > 0 && (
              <div className="space-y-3">
                {/* Card principal */}
                <div className="bg-amber-50 rounded-xl border border-amber-200 p-6 text-center">
                  <p className="text-sm text-amber-600 mb-2">
                    Voce precisaria trabalhar
                  </p>
                  <p className="text-3xl font-bold text-amber-700">
                    {horasInteiras}h{minutosRestantes > 0 ? ` ${minutosRestantes}min` : ''}
                  </p>
                  <p className="text-sm text-amber-600 mt-2">
                    para comprar este produto
                  </p>
                </div>

                {/* Detalhes */}
                <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-stone-500">Dias de trabalho</span>
                    <span className="text-sm font-medium text-stone-800">
                      {diasNecessarios < 1
                        ? `${Math.round(diasNecessarios * HORAS_DIA)}h`
                        : `${diasNecessarios.toFixed(1)} dia${diasNecessarios >= 2 ? 's' : ''}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-stone-500">% do salario</span>
                    <span
                      className={`text-sm font-medium ${
                        porcentagemSalario > 50
                          ? 'text-red-600'
                          : porcentagemSalario > 25
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {porcentagemSalario.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-stone-500">Valor/hora</span>
                    <span className="text-sm font-medium text-stone-800">
                      {formatCurrency(valorHora)}
                    </span>
                  </div>
                </div>

                {/* Veredito */}
                <div
                  className={`rounded-xl border p-4 text-center ${
                    porcentagemSalario > 50
                      ? 'bg-red-50 border-red-200'
                      : porcentagemSalario > 25
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-emerald-50 border-emerald-200'
                  }`}
                >
                  <p
                    className={`text-lg font-medium ${
                      porcentagemSalario > 50
                        ? 'text-red-700'
                        : porcentagemSalario > 25
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {porcentagemSalario > 50
                      ? 'Pense bem antes de comprar!'
                      : porcentagemSalario > 25
                      ? 'Vale a pena, mas planeje-se!'
                      : 'Vale a pena comprar!'}
                  </p>
                  <p
                    className={`text-sm mt-1 ${
                      porcentagemSalario > 50
                        ? 'text-red-500'
                        : porcentagemSalario > 25
                        ? 'text-amber-500'
                        : 'text-emerald-500'
                    }`}
                  >
                    {porcentagemSalario > 50
                      ? 'Este produto custa mais da metade do seu salario'
                      : porcentagemSalario > 25
                      ? 'Este produto custa mais de 1/4 do seu salario'
                      : 'Este produto cabe bem no seu orcamento'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
