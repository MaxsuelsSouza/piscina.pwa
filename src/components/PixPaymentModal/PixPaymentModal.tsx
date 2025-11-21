'use client';

import { useState, useCallback } from 'react';
import { Modal } from '../Modal';
import { Button } from '../Button';

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeBase64: string;
  qrCodeText: string;
  amount: number;
  bookingId?: string;
  bookingDate?: string;
  customerName?: string;
  customerPhone?: string;
  numberOfPeople?: number;
  notes?: string;
  clientPhone?: string;
  businessName?: string;
}

export function PixPaymentModal({
  isOpen,
  onClose,
  qrCodeBase64,
  qrCodeText,
  amount,
  bookingDate,
  customerName,
  customerPhone,
  numberOfPeople,
  notes,
  clientPhone,
  businessName,
}: PixPaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const [comprovanteSent, setComprovanteSent] = useState(false);

  // Função para abrir WhatsApp e enviar comprovante
  const openWhatsApp = useCallback(() => {
    if (!bookingDate || !customerName || !businessName) return;

    const formattedDate = new Date(bookingDate + 'T00:00:00').toLocaleDateString('pt-BR');

    const message = encodeURIComponent(
      `💳 *COMPROVANTE DE PAGAMENTO - ${businessName.toUpperCase()}*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📅 *Data do Agendamento:* ${formattedDate}\n` +
      `⏰ *Período:* Dia Inteiro (08:00 - 22:00)\n` +
      `👤 *Nome:* ${customerName}\n` +
      `📱 *Telefone:* ${customerPhone}\n` +
      `👥 *Quantidade:* ${numberOfPeople} ${numberOfPeople === 1 ? 'pessoa' : 'pessoas'}\n` +
      `💰 *Valor Pago:* R$ ${amount.toFixed(2)}\n` +
      `${notes ? `📝 *Observações:* ${notes}\n` : ''}` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Acabei de fazer o pagamento PIX!\n` +
      `Por favor, confirme o recebimento. 😊`
    );

    const cleanPhone = clientPhone?.replace(/\D/g, '') || '5581997339707';
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;

    const newWindow = window.open(whatsappUrl, '_blank');
    if (!newWindow) {
      window.location.href = whatsappUrl;
    }

    // Marca como enviado e fecha o modal após 3 segundos
    setComprovanteSent(true);
    setTimeout(() => {
      onClose();
    }, 3000);
  }, [bookingDate, customerName, businessName, customerPhone, numberOfPeople, amount, notes, clientPhone, onClose]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Erro ao copiar código:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={comprovanteSent ? 'Comprovante Enviado!' : 'Pagamento PIX'}>
      <div className="space-y-3">
        {comprovanteSent ? (
          /* Mensagem de Confirmação */
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3 animate-pulse">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-green-600 mb-2">Comprovante Enviado!</h3>
            <p className="text-gray-600 text-sm mb-3">
              Seu comprovante foi enviado via WhatsApp.
            </p>
            <p className="text-xs text-gray-500">
              Aguarde a confirmação do estabelecimento.
            </p>
          </div>
        ) : (
          <>
            {/* Valor */}
            <div className="text-center">
              <p className="text-xs text-gray-600">Valor a pagar</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">
                R$ {amount.toFixed(2)}
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center p-2 bg-white rounded-lg border-2 border-gray-200">
              <img
                src={`data:image/png;base64,${qrCodeBase64}`}
                alt="QR Code PIX"
                className="w-40 h-40 sm:w-48 sm:h-48"
              />
            </div>

            {/* Instruções */}
            <div className="space-y-1 text-xs text-gray-700">
              <p className="font-semibold">Como pagar:</p>
              <ol className="list-decimal list-inside space-y-0.5 ml-2">
                <li>Abra o app do seu banco</li>
                <li>Escolha pagar via PIX</li>
                <li>Escaneie o QR Code acima</li>
                <li>Confirme o pagamento</li>
              </ol>
            </div>

            {/* Código Pix Copia e Cola */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-gray-700">
                Ou use o código Pix Copia e Cola:
              </p>
              <div className="relative">
                <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg break-all text-[10px] sm:text-xs font-mono text-gray-600 max-h-16 sm:max-h-20 overflow-y-auto">
                  {qrCodeText}
                </div>
                <Button
                  onClick={handleCopyCode}
                  className="mt-1.5 w-full text-xs sm:text-sm py-2"
                  variant="outline"
                >
                  {copied ? '✓ Copiado!' : 'Copiar código'}
                </Button>
              </div>
            </div>

            {/* Aviso */}
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-[10px] sm:text-xs text-blue-800">
                <strong>Importante:</strong> Após fazer o pagamento, clique no botão abaixo para enviar o comprovante via WhatsApp.
              </p>
            </div>

            {/* Botões */}
            <div className="pt-1 flex flex-col gap-2">
              <Button
                onClick={openWhatsApp}
                className="w-full text-sm py-2 bg-green-600 hover:bg-green-700"
              >
                Enviar Comprovante via WhatsApp
              </Button>
              <Button onClick={onClose} className="w-full text-sm py-2" variant="outline">
                Fechar
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
