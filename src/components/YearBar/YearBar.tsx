/**
 * YearBar Component
 * Barra de navegação por anos expansível na parte inferior esquerda
 */

"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface YearBarProps {
  availableYears: number[];
  currentYear: number;
  onYearClick: (year: number) => void;
  onAddYear: () => void;
}

export function YearBar({ availableYears, currentYear, onYearClick, onAddYear }: YearBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsExpanded(false);
    }, 2000); // Espera 2 segundos antes de colapsar
    setHideTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [hideTimeout]);

  return (
    <div
      className="fixed bottom-4 left-4 z-50"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-2 py-2 shadow-sm border border-gray-200">
        {/* Anos */}
        {availableYears.map((year) => {
          const isActive = year === currentYear;

          // Esconde completamente os anos inativos quando colapsado
          if (!isActive && !isExpanded) {
            return null;
          }

          return (
            <button
              key={year}
              onClick={() => onYearClick(year)}
              className={cn(
                'relative px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200',
                isActive
                  ? 'text-white bg-gray-900'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              {year}
            </button>
          );
        })}

        {/* Botão de adicionar ano */}
        <button
          onClick={onAddYear}
          className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200"
          title="Adicionar ano"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
