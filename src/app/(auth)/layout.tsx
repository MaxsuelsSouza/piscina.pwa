/**
 * Auth Layout
 * Layout para páginas de autenticação (login, register, forgot-password)
 */

'use client';

import { useState, useEffect } from 'react';

// Informações sobre organização de agendamentos
const slides = [
  {
    title: 'Gestão Simplificada',
    description: 'Organize todos os agendamentos da piscina em um só lugar com interface intuitiva.',
    icon: '📅',
  },
  {
    title: 'Controle Total',
    description: 'Acompanhe reservas, disponibilidade e status dos agendamentos em tempo real.',
    icon: '⚡',
  },
  {
    title: 'Notificações Inteligentes',
    description: 'Receba alertas sobre reservas pendentes, confirmações e lembretes automáticos.',
    icon: '🔔',
  },
  {
    title: 'Relatórios Detalhados',
    description: 'Visualize estatísticas de uso, horários mais procurados e histórico completo.',
    icon: '📊',
  },
  {
    title: 'Acesso Multiplataforma',
    description: 'Gerencie de qualquer lugar através do navegador ou aplicativo mobile.',
    icon: '💻',
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen flex bg-gradient-to-br from-blue-50 to-cyan-50 lg:bg-gradient-to-r lg:from-black lg:via-black lg:via-50% lg:to-white overflow-hidden relative">
      {/* Lado esquerdo - Informações sobre agendamentos (apenas desktop) */}
      <div className="hidden lg:flex w-[55%] items-center justify-center p-12">
        <div className="w-full max-w-2xl">
          <div className="relative h-[320px]">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                <div className="flex flex-col items-start justify-center space-y-6 text-white">
                  <div className="text-6xl">{slide.icon}</div>
                  <div className="space-y-3">
                    <h2 className="text-4xl font-light">{slide.title}</h2>
                    <p className="text-lg text-white/60 leading-relaxed max-w-lg">
                      {slide.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Indicadores minimalistas */}
          <div className="mt-12 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-0.5 transition-all ${
                  index === currentSlide
                    ? 'bg-white/90 w-8'
                    : 'bg-white/20 w-6 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Lado direito - Login (tela cheia no mobile) */}
      <div className="w-full lg:w-[45%] flex items-center justify-center px-4 sm:px-6 lg:px-12">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}