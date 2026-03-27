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
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCompany } from '@/lib/company-context';
import { useAuth } from '@/lib/auth-context';
import { ROUTE_TO_MODULE } from '@/lib/hooks';

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
  { name: 'Facturación',         href: '/facturacion',        icon: FileBarChart2 },
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
  const { logout, can, permissions } = useAuth();

  const getInitialOpen = () => {
    const s = new Set<string>();
    for (const item of navigation) {
      if (item.children?.some((c) => pathname.startsWith(c.href))) s.add(item.href);
    }
    return s;
  };

  const [openGroups, setOpenGroups] = useState<Set<string>>(getInitialOpen);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    for (const item of navigation) {
      if (item.children?.some((c) => pathname.startsWith(c.href))) {
        setOpenGroups((prev) => {
          if (prev.has(item.href)) return prev;
          return new Set([...prev, item.href]);
        });
      }
    }
  }, [pathname]);

  const toggleGroup = (href: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(href) ? next.delete(href) : next.add(href);
      return next;
    });
  };

  const visibleNav = navigation.filter((item) => {
    if (!mounted) return true;
    const code = ROUTE_TO_MODULE[item.href];
    if (!code) return true;
    const p = permissions.find((p) => p.moduleCode === code);
    if (!p) return true;
    return can(code, 'canView');
  });

  const primary = settings.primaryColor ?? '#2563eb';
  const isExpanded = isMobile || !collapsed;

  /* ── Helper: nav link styles ── */
  const linkBase = 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150';

  /** Tonal active treatment: semi-transparent background + left accent border */
  const activeStyle = {
    backgroundColor: `${primary}18`,
    color: primary,
    boxShadow: `inset 3px 0 0 0 ${primary}`,
  };

  const inactiveClass = 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900';

  /** Small tonal dot shown next to the active module name */
  const TonalDot = () => (
    <span
      className="ml-auto flex-shrink-0 w-1.5 h-1.5 rounded-full opacity-80"
      style={{ backgroundColor: primary }}
    />
  );

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
          'fixed left-0 top-0 h-screen bg-white border-r border-zinc-200/80 flex flex-col transition-all duration-300 ease-in-out',
          isMobile
            ? cn('z-[80] w-72 shadow-2xl', mobileOpen ? 'translate-x-0' : '-translate-x-full')
            : cn('z-40', collapsed ? 'w-[72px]' : 'w-64')
        )}
      >

        {/* ── Logo / Header ── */}
        <div className={cn(
          'flex items-center h-16 border-b border-zinc-100 flex-shrink-0 px-3',
          isExpanded ? 'justify-between gap-2' : 'justify-center'
        )}>
          {isExpanded ? (
            <Link href="/" className="flex items-center gap-2.5 min-w-0">
              {/* Brand icon — square with rounded corners using primary color */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ backgroundColor: primary }}
              >
                {settings.logoUrl ? (
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
              <span className="text-sm font-bold text-zinc-900 tracking-tight truncate">
                {settings.companyName || 'CRM'}
              </span>
            </Link>
          ) : (
            <Link href="/" className="flex items-center justify-center">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
                style={{ backgroundColor: primary }}
              >
                {settings.logoUrl ? (
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
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
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

            /* Divider */
            const divider = item.dividerBefore && isExpanded ? (
              <div key={`div-${item.href}`} className="my-2 mx-3 border-t border-zinc-100" />
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
                      isGroupActive ? '' : inactiveClass
                    )}
                    style={isGroupActive ? activeStyle : undefined}
                  >
                    <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                    {isExpanded && (
                      <>
                        <span className="flex-1 text-left">{item.name}</span>
                        {isGroupActive && <TonalDot />}
                        <ChevronRight
                          className={cn('w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200', isGroupOpen && 'rotate-90')}
                          style={{ opacity: 0.6 }}
                        />
                      </>
                    )}
                  </button>

                  {/* Children */}
                  {isExpanded && isGroupOpen && (
                    <div className="mt-0.5 ml-3 pl-3 border-l border-zinc-200 space-y-0.5">
                      {item.children!.map((child) => {
                        const isActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => isMobile && onMobileClose?.()}
                            className={cn('flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-all duration-150', isActive ? '' : inactiveClass)}
                            style={isActive ? activeStyle : undefined}
                          >
                            <child.icon className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-1">{child.name}</span>
                            {isActive && <TonalDot />}
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
                    isActive ? '' : inactiveClass
                  )}
                  style={isActive ? activeStyle : undefined}
                >
                  <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                  {isExpanded && <span className="flex-1">{item.name}</span>}
                  {isExpanded && isActive && <TonalDot />}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* ── Logout ── */}
        <div className="flex-shrink-0 p-2 border-t border-zinc-100">
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
