'use client';

import { CSSProperties, ElementType, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  LayoutDashboard,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Store,
  Truck,
  Users,
} from 'lucide-react';
import { useCompany } from '@/lib/company-context';
import { useAuth } from '@/lib/auth-context';
import { NotificationBell } from './NotificationBell';

interface CommandAction {
  label: string;
  description: string;
  href: string;
  icon: ElementType;
}

const COMMAND_ACTIONS: CommandAction[] = [
  { label: 'Dashboard', description: 'Panel principal', href: '/', icon: LayoutDashboard },
  { label: 'Inventario', description: 'Productos y stock', href: '/inventario', icon: Package },
  { label: 'POS', description: 'Punto de venta', href: '/pos', icon: Store },
  { label: 'Pedidos', description: 'Pedidos y seguimiento', href: '/pedidos', icon: ShoppingCart },
  { label: 'Clientes', description: 'Gestión de clientes', href: '/clientes', icon: Users },
  { label: 'Proveedores', description: 'Compras y proveedores', href: '/proveedores', icon: Truck },
  { label: 'Configuración', description: 'Usuarios y ajustes', href: '/configuracion', icon: Settings },
];

interface HeaderProps {
  showMobileMenu?: boolean;
  onMobileMenuClick?: () => void;
}

export function Header({ showMobileMenu = false, onMobileMenuClick }: HeaderProps) {
  const { settings } = useCompany();
  const { fullName, roleName } = useAuth();
  const router = useRouter();

  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [query, setQuery] = useState('');

  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const filteredActions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return COMMAND_ACTIONS;
    return COMMAND_ACTIONS.filter(
      (action) =>
        action.label.toLowerCase().includes(normalized) ||
        action.description.toLowerCase().includes(normalized),
    );
  }, [query]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsPaletteOpen(false);
      }
      if (e.key === 'Enter' && isPaletteOpen && filteredActions.length > 0) {
        e.preventDefault();
        router.push(filteredActions[0].href);
        setIsPaletteOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [filteredActions, isPaletteOpen, router]);

  const openPalette = () => setIsPaletteOpen(true);
  const closePalette = () => {
    setIsPaletteOpen(false);
    setQuery('');
  };
  const goToAction = (href: string) => {
    router.push(href);
    closePalette();
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/70 bg-[#f5f6f1]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 md:h-20 items-center gap-5 px-4 md:px-7">

          {/* Mobile menu */}
          {showMobileMenu && (
            <button
              type="button"
              onClick={onMobileMenuClick}
              className="flex-shrink-0 p-2 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-black/5 transition-colors"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Search / command palette trigger */}
          <button
            type="button"
            onClick={openPalette}
            className="group relative flex flex-1 max-w-xl items-center gap-3 rounded-2xl border border-gray-300/70 bg-white/90 px-4 py-2.5 md:py-3 text-left shadow-[0_10px_25px_rgba(15,23,42,0.06)] transition-all hover:border-gray-400/70"
            style={{ '--tw-ring-color': settings.primaryColor } as CSSProperties}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-900/5 text-gray-500">
              <Search className="h-[17px] w-[17px]" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium text-gray-900">Buscar módulos, atajos o acciones</p>
              <p className="hidden sm:block truncate text-xs text-gray-500">Escribe para abrir la paleta de comandos</p>
            </div>
            <div className="hidden sm:flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-500">
              <span>⌘</span>
              <span>K</span>
            </div>
          </button>

          {/* Right section */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Online indicator */}
            <div className="hidden md:flex items-center gap-2 rounded-full border border-gray-200/80 bg-white px-3 py-1.5 text-xs font-medium text-gray-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Sistema en línea
            </div>

            {/* Notifications */}
            <NotificationBell />

            <div className="w-px h-5 bg-gray-200 hidden md:block" />

            {/* User card */}
            <div className="flex items-center gap-2.5 rounded-2xl border border-gray-200/70 bg-white/90 px-2.5 py-1.5 md:px-3 md:py-2 shadow-sm">
              <div
                className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-xl text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: settings.primaryColor ?? '#2563eb' }}
              >
                {initials}
              </div>
              <div className="hidden lg:block leading-tight">
                <p className="text-sm font-semibold tracking-tight text-gray-900">{fullName || 'Usuario'}</p>
                <p className="text-xs text-gray-500">{roleName || 'Sin rol'}</p>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Command palette overlay */}
      {isPaletteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-gray-950/30 p-4 pt-20 md:pt-24 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closePalette(); }}
        >
          <div className="w-full max-w-2xl rounded-2xl border border-white/50 bg-white p-3 shadow-[0_24px_56px_rgba(15,23,42,0.24)]">
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-[#f9faf8] px-3 py-2">
              <Search className="h-[17px] w-[17px] text-gray-500 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ir a inventario, pedidos, clientes..."
                className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={closePalette}
                className="rounded-lg px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-200/70 flex-shrink-0"
              >
                Esc
              </button>
            </div>

            <div className="mt-3 space-y-1">
              {filteredActions.length === 0 && (
                <p className="rounded-xl px-4 py-6 text-center text-sm text-gray-500">
                  Sin resultados para esta búsqueda
                </p>
              )}
              {filteredActions.map((action) => (
                <button
                  key={action.href}
                  type="button"
                  onClick={() => goToAction(action.href)}
                  className="group flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors hover:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900/5 text-gray-600">
                      <action.icon className="h-[18px] w-[18px]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{action.label}</p>
                      <p className="text-xs text-gray-500">{action.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
