'use client';

import { ElementType, useEffect, useMemo, useState } from 'react';
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
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 items-center gap-4 px-4 md:px-6">

          {/* Mobile menu */}
          {showMobileMenu && (
            <button
              type="button"
              onClick={onMobileMenuClick}
              className="flex-shrink-0 p-1.5 rounded-md text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Search / command palette trigger */}
          <button
            type="button"
            onClick={openPalette}
            className="flex flex-1 max-w-sm items-center gap-2.5 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-100"
          >
            <Search className="h-4 w-4 text-zinc-400 flex-shrink-0" />
            <span className="flex-1 text-sm text-zinc-400 truncate">Buscar...</span>
            <div className="hidden sm:flex items-center gap-0.5 rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400">
              <span>⌘K</span>
            </div>
          </button>

          {/* Right section */}
          <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
            {/* Live indicator */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>En línea</span>
            </div>

            {/* Notifications */}
            <NotificationBell />

            <div className="w-px h-4 bg-zinc-200 hidden md:block" />

            {/* User card */}
            <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md text-white text-[11px] font-bold flex-shrink-0"
                style={{ backgroundColor: settings.primaryColor ?? '#2563eb' }}
              >
                {initials}
              </div>
              <div className="hidden lg:block leading-tight">
                <p className="text-[13px] font-semibold text-zinc-900">{fullName || 'Usuario'}</p>
                <p className="text-[11px] text-zinc-400">{roleName || 'Sin rol'}</p>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Command palette overlay */}
      {isPaletteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/20 p-4 pt-16 md:pt-20 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closePalette(); }}
        >
          <div className="w-full max-w-xl rounded-lg border border-zinc-200 bg-white shadow-[0_20px_48px_rgba(9,9,11,0.18)]">
            <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3">
              <Search className="h-4 w-4 text-zinc-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ir a inventario, pedidos, clientes..."
                className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
              />
              <button
                type="button"
                onClick={closePalette}
                className="rounded border border-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 hover:bg-zinc-50 flex-shrink-0"
              >
                Esc
              </button>
            </div>

            <div className="p-2 space-y-0.5">
              {filteredActions.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-zinc-400">
                  Sin resultados para esta búsqueda
                </p>
              )}
              {filteredActions.map((action) => (
                <button
                  key={action.href}
                  type="button"
                  onClick={() => goToAction(action.href)}
                  className="group flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left transition-colors hover:bg-zinc-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-100 bg-zinc-50 text-zinc-500">
                      <action.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{action.label}</p>
                      <p className="text-xs text-zinc-400">{action.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
