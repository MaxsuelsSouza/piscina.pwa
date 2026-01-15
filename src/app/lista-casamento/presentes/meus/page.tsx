'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { useGifts, groupGiftsByCategory } from '../../_hooks/useGifts';
import { GIFT_CATEGORY_LABELS, type GiftCategory, type Gift } from '@/types/gift';

interface PixModalData {
  gift: Gift;
  qrCodeBase64: string;
  pixPayload: string;
  amount: number;
}

export default function MyGiftsPage() {
  const router = useRouter();
  const { client, loading: authLoading } = useClientAuth();
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [pixModal, setPixModal] = useState<PixModalData | null>(null);
  const [pixLoading, setPixLoading] = useState<string | null>(null);
  const [pixAmount, setPixAmount] = useState<string>('');
  const [showAmountModal, setShowAmountModal] = useState<Gift | null>(null);
  const [copied, setCopied] = useState(false);

  const { gifts, loading, error, selectGift, mySelections, refreshGifts } =
    useGifts(client?.phone || '', client?.fullName || '');

  // Filter only my gifts
  const myGifts = useMemo(
    () => gifts.filter((g) => mySelections.has(g.id)),
    [gifts, mySelections]
  );

  // Group by category
  const groupedGifts = useMemo(() => groupGiftsByCategory(myGifts), [myGifts]);

  // Categories with gifts
  const categories = useMemo(
    () =>
      Object.keys(groupedGifts).filter(
        (cat) => groupedGifts[cat as GiftCategory]?.length > 0
      ) as GiftCategory[],
    [groupedGifts]
  );

  useEffect(() => {
    if (!authLoading && !client) {
      router.replace('/lista-casamento');
    }
  }, [authLoading, client, router]);

  const handleRemove = async (giftId: string) => {
    setSelectingId(giftId);
    await selectGift(giftId);
    setSelectingId(null);
  };

  const handlePixClick = (gift: Gift) => {
    setShowAmountModal(gift);
    setPixAmount('');
  };

  const handleGeneratePix = async () => {
    if (!showAmountModal || !pixAmount) return;

    const amount = parseFloat(pixAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return;

    setPixLoading(showAmountModal.id);
    setShowAmountModal(null);

    try {
      const res = await fetch('/api/public/gifts/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftName: showAmountModal.name,
          giftId: showAmountModal.id,
          amount,
          clientName: client?.fullName || '',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao gerar PIX');
      }

      setPixModal({
        gift: showAmountModal,
        qrCodeBase64: data.qrCodeBase64,
        pixPayload: data.pixPayload,
        amount,
      });
    } catch (err) {
      console.error('Erro ao gerar PIX:', err);
      alert('Erro ao gerar QR Code PIX. Tente novamente.');
    } finally {
      setPixLoading(null);
    }
  };

  const handleCopyPix = async () => {
    if (!pixModal) return;

    try {
      await navigator.clipboard.writeText(pixModal.pixPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const formatCurrency = (value: string) => {
    // Remove non-digits
    const numbers = value.replace(/\D/g, '');
    // Convert to number and format
    const amount = parseInt(numbers || '0', 10) / 100;
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setPixAmount(formatted);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={refreshGifts}
            className="px-4 py-2 bg-stone-800 text-white rounded-lg"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/lista-casamento/presentes"
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
          <div>
            <h1 className="text-lg font-serif text-stone-800">Meus Presentes</h1>
            <p className="text-xs text-stone-400">
              {mySelections.size} presente{mySelections.size !== 1 ? 's' : ''} escolhido
              {mySelections.size !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {myGifts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-stone-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                />
              </svg>
            </div>
            <p className="text-stone-500 mb-4">
              Você ainda não escolheu nenhum presente
            </p>
            <Link
              href="/lista-casamento/presentes/categorias"
              className="inline-block px-6 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition"
            >
              Ver Lista de Presentes
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Info box */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-sm text-emerald-800">
                <span className="font-medium">Dica:</span> Você pode dar o presente em dinheiro via PIX clicando no botão &quot;PIX&quot;.
              </p>
            </div>

            {categories.map((category) => (
              <div
                key={category}
                className="bg-white rounded-xl border border-stone-200 overflow-hidden"
              >
                <div className="px-4 py-3 bg-stone-50 border-b border-stone-100">
                  <h3 className="font-medium text-stone-700 text-sm">
                    {GIFT_CATEGORY_LABELS[category]}
                  </h3>
                </div>

                {groupedGifts[category].map((gift, index) => {
                  const isRemoving = selectingId === gift.id;
                  const isGeneratingPix = pixLoading === gift.id;

                  return (
                    <div
                      key={gift.id}
                      className={`px-4 py-3 flex items-center justify-between gap-2 ${
                        index !== groupedGifts[category].length - 1
                          ? 'border-b border-stone-100'
                          : ''
                      }`}
                    >
                      <span className="text-sm text-stone-800 font-medium flex-1 min-w-0 truncate">
                        {gift.name}
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handlePixClick(gift)}
                          disabled={isGeneratingPix}
                          className="px-3 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition disabled:opacity-50 flex items-center gap-1"
                        >
                          {isGeneratingPix ? (
                            <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              PIX
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleRemove(gift.id)}
                          disabled={isRemoving}
                          className="px-3 py-1 text-xs rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200 transition disabled:opacity-50"
                        >
                          {isRemoving ? (
                            <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            'Remover'
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Amount Modal */}
      {showAmountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowAmountModal(null)}
          />
          <div className="relative bg-white w-full max-w-sm rounded-2xl p-6">
            <h3 className="text-lg font-medium text-stone-800 mb-2">
              Dar presente em PIX
            </h3>
            <p className="text-sm text-stone-500 mb-4">
              Informe o valor que deseja dar para o presente &quot;{showAmountModal.name}&quot;
            </p>

            <div className="mb-6">
              <label className="block text-sm text-stone-600 mb-2">
                Valor (R$)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={pixAmount}
                  onChange={handleAmountChange}
                  placeholder="0,00"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 focus:border-emerald-500 focus:ring-0 outline-none text-lg font-medium text-stone-800"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAmountModal(null)}
                className="flex-1 py-3 text-stone-600 font-medium rounded-xl border border-stone-200 hover:bg-stone-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleGeneratePix}
                disabled={!pixAmount || parseFloat(pixAmount.replace(',', '.')) <= 0}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition disabled:opacity-50"
              >
                Gerar PIX
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIX QR Code Modal */}
      {pixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setPixModal(null)}
          />
          <div className="relative bg-white w-full max-w-sm rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h3 className="text-lg font-medium text-stone-800 mb-1">
                PIX para presente
              </h3>
              <p className="text-sm text-stone-500 mb-1">
                {pixModal.gift.name}
              </p>
              <p className="text-2xl font-bold text-emerald-600 mb-4">
                R$ {pixModal.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>

              {/* QR Code */}
              <div className="bg-white border-2 border-stone-200 rounded-xl p-4 mb-4 inline-block">
                <Image
                  src={pixModal.qrCodeBase64}
                  alt="QR Code PIX"
                  width={200}
                  height={200}
                  className="mx-auto"
                />
              </div>

              <p className="text-xs text-stone-400 mb-4">
                Escaneie o QR Code com o app do seu banco ou copie o código PIX
              </p>

              {/* Copy button */}
              <button
                onClick={handleCopyPix}
                className={`w-full py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                  copied
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {copied ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copiado!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar código PIX
                  </>
                )}
              </button>

              <button
                onClick={() => setPixModal(null)}
                className="w-full py-3 mt-3 text-stone-500 font-medium hover:text-stone-700 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
