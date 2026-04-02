'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Truck,
  Store,
  BarChart3,
  Layers,
  X,
  FileBarChart2,
  BarChart2,
  ClipboardList,
  Warehouse,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCompany } from '@/lib/company-context';
import { useAuth } from '@/lib/auth-context';
import { ROUTE_TO_MODULE } from '@/lib/hooks';

/* ─── Section labels for nav groups ─── */
const SECTION_LABELS: Record<string, string> = {
  '/pos': 'Ventas',
  '/reportes': 'Analítica',
};

/* ─── Nav types ─── */

interface NavChild {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  children?: NavChild[];
  dividerBefore?: boolean;
}

/* ─── Navigation tree Super Admin ─── */

const superAdminNavigation: NavItem[] = [
  { name: 'Empresas', href: '/super-admin', icon: Building2 },
];

/* ─── Navigation tree ─── */

const navigation: NavItem[] = [
  { name: 'Dashboard',           href: '/',                   icon: LayoutDashboard },
  { name: 'Inventario',          href: '/inventario',         icon: Package,
    children: [
      { name: 'Productos',        href: '/inventario',         icon: Package },
      { name: 'Almacenes',        href: '/inventario/almacenes', icon: Warehouse },
    ],
  },
  { name: 'Pedidos',             href: '/pedidos',            icon: ShoppingCart },
  { name: 'Clientes',            href: '/clientes',           icon: Users },
  { name: 'Proveedores',         href: '/proveedores',        icon: Truck },
  { name: 'Punto de Venta',      href: '/pos',                icon: Store,        dividerBefore: true },
  { name: 'Precios por Volumen', href: '/pos/precios',        icon: Layers },
  { name: 'Reportes POS',        href: '/pos/reportes',       icon: BarChart3 },
  { name: 'Reportes',            href: '/reportes',           icon: FileBarChart2, dividerBefore: true,
    children: [
      { name: 'Ventas por Producto', href: '/reportes/ventas-producto', icon: BarChart2 },
      { name: 'Kárdex',              href: '/reportes/kardex',           icon: ClipboardList },
    ],
  },
  { name: 'Configuración',       href: '/configuracion',      icon: Settings },
];

/* ─── Props ─── */

interface SidebarProps {
  collapsed: boolean;
  onCollapsedChange: (v: boolean) => void;
  isMobile?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

/* ─── Component ─── */

export function Sidebar({
  collapsed,
  onCollapsedChange,
  isMobile = false,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { settings } = useCompany();
  const { logout, can, permissions, isSuperAdmin } = useAuth();

  // Active nav tree based on user type
  const activeNav = isSuperAdmin ? superAdminNavigation : navigation;

  const getInitialOpen = () => {
    const s = new Set<string>();
    for (const item of activeNav) {
      if (item.children?.some((c) => pathname.startsWith(c.href))) s.add(item.href);
    }
    return s;
  };

  const [openGroups, setOpenGroups] = useState<Set<string>>(getInitialOpen);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    for (const item of activeNav) {
      if (item.children?.some((c) => pathname.startsWith(c.href))) {
        setOpenGroups((prev) => {
          if (prev.has(item.href)) return prev;
          return new Set([...prev, item.href]);
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function toggleGroup(href: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(href) ? next.delete(href) : next.add(href);
      return next;
    });
  }

  // Permission filtering (only for company users, not Super Admin)
  const visibleNav = isSuperAdmin
    ? superAdminNavigation
    : activeNav.filter((item) => {
        if (!mounted) return true;
        const code = ROUTE_TO_MODULE[item.href];
        if (!code) return true;
        const p = permissions.find((p) => p.moduleCode === code);
        if (!p) return true;
        return can(code, 'canView');
      });

  const primary = isSuperAdmin ? '#2563EB' : (settings.primaryColor ?? '#2563eb');
  const isExpanded = isMobile || !collapsed;
  const homeHref = isSuperAdmin ? '/super-admin' : '/';

  /* ── Helper: nav link styles ── */
  const linkBase = 'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-100';
  const activeClass = 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100';
  const inactiveClass = 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100';

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 flex h-screen flex-col border-r border-zinc-200/80 bg-white transition-all duration-300 ease-in-out dark:border-zinc-800 dark:bg-zinc-900',
          isMobile
            ? cn('z-[80] w-72 shadow-2xl', mobileOpen ? 'translate-x-0' : '-translate-x-full')
            : cn('z-40', collapsed ? 'w-[72px]' : 'w-64')
        )}
      >

        {/* ── Logo / Header ── */}
        <div className={cn(
          'flex h-16 flex-shrink-0 items-center border-b border-zinc-100 px-3 dark:border-zinc-800',
          isExpanded ? 'justify-between gap-2' : 'justify-center'
        )}>
          {isExpanded ? (
            <Link href={homeHref} className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ backgroundColor: primary }}
              >
                {isSuperAdmin ? (
                  <ShieldCheck className="w-5 h-5 text-white" />
                ) : settings.logoUrl ? (
                  <img src={settings.logoUrl} alt={settings.companyName} className="w-full h-full object-contain rounded-lg" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="5.5" height="5.5" rx="1.25" fill="white" fillOpacity="0.9"/>
                    <rect x="9.5" y="1" width="5.5" height="5.5" rx="1.25" fill="white" fillOpacity="0.9"/>
                    <rect x="1" y="9.5" width="5.5" height="5.5" rx="1.25" fill="white" fillOpacity="0.9"/>
                    <rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1.25" fill="white" fillOpacity="0.6"/>
                  </svg>
                )}
              </div>
              <span className="truncate text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {isSuperAdmin ? 'Super Admin' : (settings.companyName || 'CRM')}
              </span>
            </Link>
          ) : (
            <Link href={homeHref} className="flex items-center justify-center">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
                style={{ backgroundColor: primary }}
              >
                {isSuperAdmin ? (
                  <ShieldCheck className="w-5 h-5 text-white" />
                ) : settings.logoUrl ? (
                  <img src={settings.logoUrl} alt={settings.companyName} className="w-full h-full object-contain rounded-lg" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="5.5" height="5.5" rx="1.25" fill="white" fillOpacity="0.9"/>
                    <rect x="9.5" y="1" width="5.5" height="5.5" rx="1.25" fill="white" fillOpacity="0.9"/>
                    <rect x="1" y="9.5" width="5.5" height="5.5" rx="1.25" fill="white" fillOpacity="0.9"/>
                    <rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1.25" fill="white" fillOpacity="0.6"/>
                  </svg>
                )}
              </div>
            </Link>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => isMobile ? onMobileClose?.() : onCollapsedChange(!collapsed)}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label={isMobile ? 'Cerrar menú' : collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {isMobile ? <X className="w-4 h-4" /> : collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {visibleNav.map((item) => {
            const hasChildren = !!item.children?.length;
            const isGroupOpen = openGroups.has(item.href);
            const isGroupActive = pathname === item.href || item.children?.some((c) => pathname.startsWith(c.href));

            /* Section label / divider */
            const sectionLabel = SECTION_LABELS[item.href];
            const divider = item.dividerBefore ? (
              isExpanded ? (
                <div key={`div-${item.href}`} className="px-3 pb-1 pt-4">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    {sectionLabel ?? ''}
                  </span>
                </div>
              ) : (
                <div key={`div-${item.href}`} className="mx-2 my-2 border-t border-zinc-100 dark:border-zinc-800" />
              )
            ) : null;

            /* Group (with children) */
            if (hasChildren) {
              return (
                <div key={item.href}>
                  {divider}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isMobile && collapsed) {
                        onCollapsedChange(false);
                        setOpenGroups((p) => new Set([...p, item.href]));
                        return;
                      }
                      toggleGroup(item.href);
                    }}
                    className={cn(
                      linkBase, 'w-full',
                      !isExpanded && 'justify-center px-0 py-2',
                      isGroupActive ? activeClass : inactiveClass
                    )}
                  >
                    <item.icon
                      className="w-[18px] h-[18px] flex-shrink-0"
                      style={isGroupActive ? { color: primary } : undefined}
                    />
                    {isExpanded && (
                      <>
                        <span className="flex-1 text-left">{item.name}</span>
                        <ChevronRight
                          className={cn('h-3.5 w-3.5 flex-shrink-0 text-zinc-400 transition-transform duration-200 dark:text-zinc-500', isGroupOpen && 'rotate-90')}
                        />
                      </>
                    )}
                  </button>

                  {/* Children */}
                  {isExpanded && isGroupOpen && (
                    <div className="mt-0.5 ml-3 space-y-0.5 border-l border-zinc-200 pl-3 dark:border-zinc-700">
                      {item.children!.map((child) => {
                        const isActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => isMobile && onMobileClose?.()}
                            className={cn('flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors duration-100', isActive ? activeClass : inactiveClass)}
                          >
                            <child.icon
                              className="w-4 h-4 flex-shrink-0"
                              style={isActive ? { color: primary } : undefined}
                            />
                            <span className="flex-1">{child.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            /* Leaf item */
            const isActive = pathname === item.href;
            return (
              <div key={item.href}>
                {divider}
                <Link
                  href={item.href}
                  onClick={() => isMobile && onMobileClose?.()}
                  className={cn(
                    linkBase,
                    !isExpanded && 'justify-center px-0 py-2',
                    isActive ? activeClass : inactiveClass
                  )}
                >
                  <item.icon
                    className="w-[18px] h-[18px] flex-shrink-0"
                    style={isActive ? { color: primary } : undefined}
                  />
                  {isExpanded && <span>{item.name}</span>}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* ── Logout ── */}
        <div className="flex-shrink-0 border-t border-zinc-100 p-2 dark:border-zinc-800">
          <button
            onClick={() => { if (isMobile) onMobileClose?.(); logout(); }}
            className={cn(
              linkBase, 'w-full text-zinc-500 hover:bg-red-50 hover:text-red-600',
              !isExpanded && 'justify-center px-0 py-2'
            )}
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            {isExpanded && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
