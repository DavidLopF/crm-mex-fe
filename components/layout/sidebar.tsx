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
  Landmark,
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
  { name: 'Parafiscales',        href: '/parafiscales',       icon: Landmark },
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
  const activeClass = 'bg-zinc-100 text-zinc-900';
  const inactiveClass = 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800';

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
          'fixed left-0 top-0 h-screen glass border-r border-white/20 flex flex-col transition-all duration-500 ease-in-out',
          isMobile
            ? cn('z-[80] w-72 shadow-2xl', mobileOpen ? 'translate-x-0' : '-translate-x-full')
            : cn('z-40', collapsed ? 'w-[80px]' : 'w-64')
        )}
      >

        {/* ── Logo / Header ── */}
        <div className={cn(
          'flex items-center h-20 border-b border-zinc-200/50 flex-shrink-0 px-4',
          isExpanded ? 'justify-between gap-2' : 'justify-center'
        )}>
          {isExpanded ? (
            <Link href={homeHref} className="flex items-center gap-3 min-w-0 group">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg transition-transform group-hover:scale-105 duration-300"
                style={{ 
                  backgroundColor: primary,
                  boxShadow: `0 8px 16px -4px ${primary}40`
                }}
              >
                {isSuperAdmin ? (
                  <ShieldCheck className="w-6 h-6 text-white" />
                ) : settings.logoUrl ? (
                  <img src={settings.logoUrl} alt={settings.companyName} className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="5.5" height="5.5" rx="1.5" fill="white" fillOpacity="1"/>
                    <rect x="9.5" y="1" width="5.5" height="5.5" rx="1.5" fill="white" fillOpacity="0.9"/>
                    <rect x="1" y="9.5" width="5.5" height="5.5" rx="1.5" fill="white" fillOpacity="0.8"/>
                    <rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1.5" fill="white" fillOpacity="0.6"/>
                  </svg>
                )}
              </div>
              <span className="text-base font-bold text-zinc-900 tracking-tight truncate">
                {isSuperAdmin ? 'Super Admin' : (settings.companyName || 'CRM')}
              </span>
            </Link>
          ) : (
            <Link href={homeHref} className="flex items-center justify-center group">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-300"
                style={{ 
                  backgroundColor: primary,
                  boxShadow: `0 8px 16px -4px ${primary}40`
                }}
              >
                {isSuperAdmin ? (
                  <ShieldCheck className="w-6 h-6 text-white" />
                ) : settings.logoUrl ? (
                  <img src={settings.logoUrl} alt={settings.companyName} className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="5.5" height="5.5" rx="1.5" fill="white" fillOpacity="1"/>
                    <rect x="9.5" y="1" width="5.5" height="5.5" rx="1.5" fill="white" fillOpacity="0.9"/>
                    <rect x="1" y="9.5" width="5.5" height="5.5" rx="1.5" fill="white" fillOpacity="0.8"/>
                    <rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1.5" fill="white" fillOpacity="0.6"/>
                  </svg>
                )}
              </div>
            </Link>
          )}

          {/* Collapse toggle */}
          {isExpanded && !isMobile && (
            <button
              onClick={() => onCollapsedChange(!collapsed)}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-white/50 hover:shadow-sm transition-all duration-300"
              aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
              <ChevronLeft className={cn('w-5 h-5 transition-transform duration-500', collapsed && 'rotate-180')} />
            </button>
          )}
          {isMobile && (
            <button
              onClick={onMobileClose}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-white/50 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1 custom-scrollbar">
          {visibleNav.map((item) => {
            const hasChildren = !!item.children?.length;
            const isGroupOpen = openGroups.has(item.href);
            const isGroupActive = pathname === item.href || !!item.children?.some((c) => pathname.startsWith(c.href));

            /* Section label / divider */
            const sectionLabel = SECTION_LABELS[item.href];
            const divider = item.dividerBefore ? (
              isExpanded ? (
                <div key={`div-${item.href}`} className="pt-6 pb-2 px-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400/80">
                    {sectionLabel ?? ''}
                  </span>
                </div>
              ) : (
                <div key={`div-${item.href}`} className="my-4 mx-4 border-t border-zinc-200/50" />
              )
            ) : null;

            /* Link Styles with Active Glow */
            const linkStyles = (isActive: boolean) => cn(
              'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-300',
              !isExpanded && 'mx-auto h-12 w-12 justify-center px-0 py-0',
              isActive
                ? 'bg-white shadow-premium text-primary'
                : cn('text-zinc-500 hover:bg-white/40 hover:text-primary', isExpanded && 'hover:translate-x-1')
            );

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
                    className={linkStyles(isGroupActive)}
                  >
                    <div className={cn(
                      "p-1.5 rounded-lg transition-colors duration-300",
                      isGroupActive ? "bg-primary text-primary-foreground" : "text-zinc-400 group-hover:text-primary"
                    )}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    {isExpanded && (
                      <>
                        <span className="flex-1 text-left">{item.name}</span>
                        <ChevronRight
                          className={cn('w-4 h-4 flex-shrink-0 transition-transform duration-300 text-zinc-300', isGroupOpen && 'rotate-90')}
                        />
                      </>
                    )}
                  </button>

                  {/* Children */}
                  {isExpanded && isGroupOpen && (
                    <div className="mt-1 ml-6 pl-4 border-l-2 border-zinc-200/50 space-y-1">
                      {item.children!.map((child) => {
                        const isActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => isMobile && onMobileClose?.()}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                              isActive 
                                ? 'text-primary font-bold' 
                                : 'text-zinc-400 hover:text-primary hover:translate-x-1'
                            )}
                          >
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full transition-all duration-300 bg-zinc-200",
                              isActive && "bg-primary scale-125 shadow-[0_0_8px_rgba(0,0,0,0.2)]"
                            )} />
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
                  className={linkStyles(isActive)}
                >
                  <div className={cn(
                    "p-1.5 rounded-lg transition-all duration-300",
                    isActive ? "bg-primary text-primary-foreground shadow-md" : "text-zinc-400 group-hover:text-primary"
                  )}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  {isExpanded && <span>{item.name}</span>}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* ── Logout ── */}
        <div className="flex-shrink-0 p-4 border-t border-zinc-200/50">
          <button
            onClick={() => { if (isMobile) onMobileClose?.(); logout(); }}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-zinc-500 transition-all duration-300 hover:bg-red-50 hover:text-red-600',
              !isExpanded && 'justify-center px-0'
            )}
          >
            <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-400 group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
              <LogOut className="w-4 h-4" />
            </div>
            {isExpanded && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
