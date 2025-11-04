/**
 * Navbar Component
 * Menu de navegação principal
 */

"use client";

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface NavItem {
  label: string;
  path: string;
  submenu?: {
    label: string;
    path: string;
  }[];
}

interface NavbarProps {
  navItems: NavItem[];
  onLogoClick?: () => void;
  currentYear?: number;
}

export function Navbar({ navItems, onLogoClick, currentYear }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleLogoClick = () => {
    if (pathname === '/' && onLogoClick) {
      // Se já estamos na home, executa callback customizado
      onLogoClick();
    } else {
      // Caso contrário, navega para home
      router.push('/');
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <button
          onClick={handleLogoClick}
          className="text-gray-900 font-semibold text-base hover:text-gray-700 transition-colors"
        >
          Piscina Agendamentos
        </button>

        {/* Menu de navegação */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const hasSubmenu = item.submenu && item.submenu.length > 0;

            return (
              <div
                key={item.path}
                className="relative group"
              >
                <button
                  onClick={() => !hasSubmenu && router.push(item.path)}
                  onMouseEnter={() => hasSubmenu && setOpenDropdown(item.path)}
                  className={cn(
                    'text-sm transition-colors flex items-center gap-1',
                    pathname === item.path
                      ? 'text-gray-900 font-medium'
                      : 'text-gray-500 hover:text-gray-900'
                  )}
                >
                  {item.label}
                  {hasSubmenu && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>

                {/* Dropdown Menu */}
                {hasSubmenu && openDropdown === item.path && (
                  <div
                    className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-1"
                    onMouseEnter={() => setOpenDropdown(item.path)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    {item.submenu?.map((subItem) => (
                      <button
                        key={subItem.path}
                        onClick={() => router.push(subItem.path)}
                        className={cn(
                          'w-full text-left px-4 py-2 text-sm transition-colors',
                          pathname === subItem.path
                            ? 'bg-gray-100 text-gray-900 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        {subItem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
