'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, Search } from 'lucide-react';
import { useCompany } from '@/lib/company-context';
import { useAuth } from '@/lib/auth-context';
import { NotificationBell } from './NotificationBell';
import { cn } from '@/lib/utils';

interface HeaderProps {
  showMobileMenu?: boolean;
  onMobileMenuClick?: () => void;
}

export function Header({ showMobileMenu = false, onMobileMenuClick }: HeaderProps) {
  const { settings } = useCompany();
  const { fullName, roleName } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  /* ⌘K / Ctrl+K opens search */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') searchRef.current?.blur();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-zinc-200/70">
      <div className="flex items-center h-16 px-4 sm:px-5 gap-4">

        {/* Mobile menu */}
        {showMobileMenu && (
          <button
            type="button"
            onClick={onMobileMenuClick}
            className="flex-shrink-0 p-2 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* ── Command-palette search bar ── */}
        <div className="flex-1 max-w-xl">
          <div
            className={cn(
              'relative flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200 cursor-text',
              searchFocused
                ? 'border-zinc-300 bg-white shadow-sm ring-2 ring-zinc-900/8'
                : 'border-zinc-200 bg-zinc-50/80 hover:bg-zinc-50 hover:border-zinc-300'
            )}
            onClick={() => searchRef.current?.focus()}
          >
            <Search className="w-4 h-4 text-zinc-400 flex-shrink-0" />

            <div className="flex-1 min-w-0">
              <input
                ref={searchRef}
                type="text"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none"
                placeholder="Buscar módulos, atajos o acciones"
              />
              {!searchFocused && (
                <p className="text-[11px] text-zinc-400 leading-none mt-0.5 pointer-events-none">
                  Escribe para abrir la paleta de comandos
                </p>
              )}
            </div>

            <kbd className="hidden sm:inline-flex flex-shrink-0 items-center gap-0.5 rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-[11px] font-medium text-zinc-400 shadow-sm">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* ── Right section ── */}
        <div className="flex items-center gap-3 flex-shrink-0 ml-auto">

          {/* Online status indicator */}
          <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            Sistema en línea
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-5 bg-zinc-200" />

          {/* Notifications */}
          <NotificationBell />

          {/* User */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-2 ring-white shadow-sm"
              style={{ backgroundColor: settings.primaryColor ?? '#2563eb' }}
            >
              {initials}
            </div>
            <div className="hidden lg:block leading-tight">
              <p className="text-sm font-semibold text-zinc-900">{fullName || 'Usuario'}</p>
              <p className="text-[11px] text-zinc-400">{roleName || 'Sin rol'}</p>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
