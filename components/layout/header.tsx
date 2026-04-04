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
  ChevronDown,
  Circle,
} from 'lucide-react';
import { useCompany } from '@/lib/company-context';
import { useAuth } from '@/lib/auth-context';
import { NotificationBell } from './NotificationBell';
import { SyncStatus } from './SyncStatus';
import { cn } from '@/lib/utils';

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
      <header className="sticky top-0 z-30 h-20 glass border-b border-white/20">
        <div className="mx-auto flex h-full items-center gap-4 px-4 md:px-8">

          {/* Mobile menu */}
          {showMobileMenu && (
            <button
              type="button"
              onClick={onMobileMenuClick}
              className="flex-shrink-0 p-2 rounded-xl text-zinc-500 hover:text-primary hover:bg-white/50 transition-all"
              aria-label="Abrir menú"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}

          {/* Search / command palette trigger */}
          <button
            type="button"
            onClick={openPalette}
            className="group flex flex-1 max-w-md items-center gap-3 rounded-xl border border-zinc-200/50 bg-white/40 px-4 py-2.5 text-left transition-all hover:bg-white hover:shadow-premium hover:border-white"
          >
            <Search className="h-4 w-4 text-zinc-400 group-hover:text-primary transition-colors" />
            <span className="flex-1 text-sm font-medium text-zinc-400 group-hover:text-zinc-600 truncate">Buscar en el CRM...</span>
            <div className="hidden sm:flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-bold text-zinc-400">
              <span>⌘</span>
              <span>K</span>
            </div>
          </button>

          {/* Right section */}
          <div className="flex items-center gap-4 flex-shrink-0 ml-auto">
            {/* Live indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-600 border border-emerald-100/50">
              <Circle className="h-2 w-2 fill-emerald-500 animate-pulse" />
              <span>SISTEMA EN LÍNEA</span>
            </div>

            {/* Notifications */}
            <NotificationBell />

            <div className="w-px h-6 bg-zinc-200/50 hidden md:block" />

            {/* User Profile */}
            <button className="flex items-center gap-3 group rounded-xl hover:bg-white/50 p-1 transition-all">
              <div className="flex items-center gap-3 px-1">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground text-xs font-bold shadow-lg transition-transform group-hover:scale-105"
                  style={{ 
                    backgroundColor: 'var(--primary-color)',
                    boxShadow: `0 8px 16px -4px color-mix(in srgb, var(--primary-color), transparent 75%)`
                  }}
                >
                  {initials}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-bold text-zinc-900 leading-tight group-hover:text-primary transition-colors">{fullName || 'Usuario'}</p>
                  <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">{roleName || 'Sin rol'}</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-zinc-400 hidden lg:block group-hover:text-primary transition-colors" />
            </button>
          </div>

        </div>
      </header>

      {/* Command palette overlay */}
      {isPaletteOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-start justify-center bg-zinc-950/20 p-4 pt-20 backdrop-blur-md animate-fadeIn"
          onClick={(e) => { if (e.target === e.currentTarget) closePalette(); }}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/30 bg-white/80 backdrop-blur-xl shadow-2xl animate-slideUp">
            <div className="flex items-center gap-3 border-b border-zinc-100 px-6 py-5">
              <Search className="h-5 w-5 text-zinc-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="¿Qué estás buscando hoy? (Productos, pedidos, clientes...)"
                className="w-full bg-transparent text-base font-medium text-zinc-900 outline-none placeholder:text-zinc-400"
              />
              <div className="flex items-center gap-2">
                 <button
                  type="button"
                  onClick={closePalette}
                  className="rounded-lg border border-zinc-200 px-2 py-1 text-[11px] font-bold text-zinc-400 hover:bg-white hover:text-primary transition-all"
                >
                  ESC
                </button>
              </div>
            </div>

            <div className="p-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {filteredActions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center mb-3">
                    <Search className="h-6 w-6 text-zinc-300" />
                  </div>
                  <p className="text-sm font-medium text-zinc-500">
                    No encontramos nada para "<span className="text-primary">{query}</span>"
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">Intenta con términos más generales</p>
                </div>
              )}
              
              {filteredActions.length > 0 && (
                <div className="grid grid-cols-1 gap-1">
                  {filteredActions.map((action) => (
                    <button
                      key={action.href}
                      type="button"
                      onClick={() => goToAction(action.href)}
                      className="group flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-all hover:bg-white hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 text-zinc-400 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          <action.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900 group-hover:text-primary transition-colors">{action.label}</p>
                          <p className="text-xs font-medium text-zinc-400">{action.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
                        <span className="text-[10px] font-bold text-primary uppercase">Abrir</span>
                        <ArrowRight className="h-4 w-4 text-primary" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-zinc-50/50 border-t border-zinc-100 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <kbd className="rounded bg-white border border-zinc-200 px-1.5 py-0.5 text-[10px] font-bold text-zinc-500 shadow-sm">ENTER</kbd>
                  <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Seleccionar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="rounded bg-white border border-zinc-200 px-1.5 py-0.5 text-[10px] font-bold text-zinc-500 shadow-sm">↑↓</kbd>
                  <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Navegar</span>
                </div>
              </div>
              <p className="text-[11px] font-bold text-primary uppercase tracking-widest">Atajos rápidos</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
