'use client';

import { Menu, Search, User } from 'lucide-react';
import { useCompany } from '@/lib/company-context';
import { useAuth } from '@/lib/auth-context';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { settings } = useCompany();
  const { fullName, roleName } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center h-16 px-3 sm:px-6 gap-3">

        {/* Hamburguesa — solo en móvil */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>

        {/* Buscador */}
        <div className="flex items-center flex-1 min-w-0">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': settings.primaryColor } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Usuario */}
        <div className="flex items-center gap-3 pl-3 border-l border-gray-200 flex-shrink-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: settings.accentColor }}
          >
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900 whitespace-nowrap">{fullName || 'Usuario'}</p>
            <p className="text-xs text-gray-500">{roleName || 'Sin rol'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
