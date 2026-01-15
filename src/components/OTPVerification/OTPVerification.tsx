/**
 * Componente de Verificação de Código OTP
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { formatPhoneDisplay } from '@/lib/firebase/auth/phoneAuth';

interface OTPVerificationProps {
  phoneNumber: string;
  loading: boolean;
  error: string | null;
  onVerify: (code: string) => void;
  onResend: () => void;
  onBack: () => void;
}

export const OTPVerification = ({
  phoneNumber,
  loading,
  error,
  onVerify,
  onResend,
  onBack,
}: OTPVerificationProps) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Foca no primeiro input ao montar
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Permite apenas números
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Move para o próximo input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Verifica se todos os campos estão preenchidos
    if (newCode.every((digit) => digit !== '')) {
      onVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Move para o input anterior ao deletar
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');

    if (digits.length === 6) {
      setCode(digits);
      onVerify(digits.join(''));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-white drop-shadow-lg mb-2">
          Verificar Telefone
        </h2>
        <p className="text-sm text-white/90 drop-shadow">
          Enviamos um código de 6 dígitos para
        </p>
        <p className="text-sm font-semibold text-white drop-shadow mt-1">
          {formatPhoneDisplay(phoneNumber)}
        </p>
      </div>

      {/* OTP Inputs */}
      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={loading}
            className="w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 border-white/30 bg-white/95 backdrop-blur-sm text-gray-900 focus:ring-2 focus:ring-white focus:border-transparent transition-all shadow-lg disabled:opacity-50"
          />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={onResend}
          disabled={loading}
          className="w-full text-white hover:text-white/80 transition-colors text-sm font-medium disabled:opacity-50"
        >
          Não recebeu o código? Reenviar
        </button>

        <button
          onClick={onBack}
          disabled={loading}
          className="w-full bg-white/90 backdrop-blur-sm text-gray-900 px-6 py-2.5 rounded-lg font-medium hover:bg-white transition-all disabled:opacity-50 shadow-lg"
        >
          Voltar
        </button>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <div className="bg-white/95 rounded-xl p-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-3 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-900 font-medium">Verificando...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
