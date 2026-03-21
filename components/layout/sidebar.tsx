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

// ─── Tipos de navegación ──────────────────────────────────────────────────────

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
}

// ─── Árbol de navegación ──────────────────────────────────────────────────────

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  {
    name: 'Inventario',
    href: '/inventario',
    icon: Package,
    children: [
      { name: 'Productos', href: '/inventario', icon: Package },
      { name: 'Almacenes', href: '/inventario/almacenes', icon: Warehouse },
    ],
  },
  { name: 'Pedidos', href: '/pedidos', icon: ShoppingCart },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Proveedores', href: '/proveedores', icon: Truck },
  { name: 'Punto de Venta', href: '/pos', icon: Store },
  { name: 'Precios por Volumen', href: '/pos/precios', icon: Layers },
  { name: 'Reportes POS', href: '/pos/reportes', icon: BarChart3 },
  {
    name: 'Reportes',
    href: '/reportes',
    icon: FileBarChart2,
    children: [
      { name: 'Ventas por Producto', href: '/reportes/ventas-producto', icon: BarChart2 },
      { name: 'Kárdex', href: '/reportes/kardex', icon: ClipboardList },
    ],
  },
  { name: 'Configuración', href: '/configuracion', icon: Settings },
];

// ─── Props del sidebar ────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean;
  onCollapsedChange: (value: boolean) => void;
  isMobile?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

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

  // Determinar qué grupos están abiertos; auto-abrir si la ruta actual coincide
  const getInitialOpen = () => {
    const set = new Set<string>();
    for (const item of navigation) {
      if (item.children?.some((c) => pathname.startsWith(c.href))) {
        set.add(item.href);
      }
    }
    return set;
  };

  const [openGroups, setOpenGroups] = useState<Set<string>>(getInitialOpen);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // Auto-abrir grupo si la ruta cambia y coincide con algún hijo
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

  function toggleGroup(href: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  }

  // Filtrado por permisos (igual que antes)
  const visibleNavigation = navigation.filter((item) => {
    if (!mounted) return true;
    const moduleCode = ROUTE_TO_MODULE[item.href];
    if (!moduleCode) return true;
    const modulePermission = permissions.find((p) => p.moduleCode === moduleCode);
    if (!modulePermission) return true;
    return can(moduleCode, 'canView');
  });

  const primaryColor = settings.primaryColor;

  return (
    <>
      {isMobile && mobileOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onMobileClose}
          className="fixed inset-0 z-[70] bg-black/30"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300',
          isMobile
            ? cn('z-[80] w-72', mobileOpen ? 'translate-x-0' : '-translate-x-full')
            : cn('z-40', collapsed ? 'w-20' : 'w-64')
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div
            className={cn(
              'flex items-center h-16 px-4 border-b border-gray-200',
              isMobile || !collapsed ? 'justify-between' : 'justify-center'
            )}
          >
            {(isMobile || !collapsed) && (
              <Link href="/" className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                  style={settings.logoUrl ? undefined : { backgroundColor: primaryColor }}
                >
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt={settings.companyName}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Package className="w-5 h-5 text-white" />
                  )}
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {settings.companyName}
                </span>
              </Link>
            )}
            {!isMobile && collapsed && (
              <Link href="/" className="flex items-center justify-center">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
                  style={settings.logoUrl ? undefined : { backgroundColor: primaryColor }}
                >
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt={settings.companyName}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Package className="w-5 h-5 text-white" />
                  )}
                </div>
              </Link>
            )}
            <button
              onClick={() => {
                if (isMobile) {
                  onMobileClose?.();
                  return;
                }
                onCollapsedChange(!collapsed);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={isMobile ? 'Cerrar menú' : 'Colapsar menú'}
            >
              {isMobile ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : collapsed ? (
                <Menu className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* Navegación */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {visibleNavigation.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isGroupOpen = openGroups.has(item.href);

              // ── Ítem padre con hijos ─────────────────────────────────────
              if (hasChildren) {
                const isGroupActive =
                  pathname === item.href ||
                  item.children!.some((c) => pathname.startsWith(c.href));

                return (
                  <div key={item.href}>
                    {/* Botón del grupo */}
                    <button
                      type="button"
                      onClick={() => {
                        // Si el sidebar está colapsado, expandirlo primero
                        if (!isMobile && collapsed) {
                          onCollapsedChange(false);
                          setOpenGroups((prev) => new Set([...prev, item.href]));
                          return;
                        }
                        toggleGroup(item.href);
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                        isGroupActive
                          ? 'font-semibold'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                        !isMobile && collapsed && 'justify-center'
                      )}
                      style={
                        isGroupActive
                          ? { backgroundColor: primaryColor + '12', color: primaryColor }
                          : undefined
                      }
                    >
                      <item.icon
                        className="w-5 h-5 flex-shrink-0"
                        style={isGroupActive ? { color: primaryColor } : undefined}
                      />
                      {(isMobile || !collapsed) && (
                        <>
                          <span className="flex-1 text-left font-medium">
                            {item.name}
                          </span>
                          <ChevronRight
                            className={cn(
                              'w-4 h-4 transition-transform duration-200',
                              isGroupOpen && 'rotate-90'
                            )}
                            style={isGroupActive ? { color: primaryColor } : { color: '#9CA3AF' }}
                          />
                        </>
                      )}
                    </button>

                    {/* Sub-ítems */}
                    {(isMobile || !collapsed) && isGroupOpen && (
                      <div className="mt-1 ml-3 pl-3 border-l-2 border-gray-100 space-y-0.5">
                        {item.children!.map((child) => {
                          const isChildActive = pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => {
                                if (isMobile) onMobileClose?.();
                              }}
                              className={cn(
                                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                                isChildActive
                                  ? 'font-semibold'
                                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                              )}
                              style={
                                isChildActive
                                  ? { backgroundColor: primaryColor + '12', color: primaryColor }
                                  : undefined
                              }
                            >
                              <child.icon
                                className="w-4 h-4 flex-shrink-0"
                                style={isChildActive ? { color: primaryColor } : undefined}
                              />
                              <span>{child.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // ── Ítem normal (sin hijos) ──────────────────────────────────
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => {
                    if (isMobile) onMobileClose?.();
                  }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    !isMobile && collapsed && 'justify-center'
                  )}
                  style={
                    isActive
                      ? { backgroundColor: primaryColor + '15', color: primaryColor }
                      : undefined
                  }
                >
                  <item.icon
                    className="w-5 h-5 flex-shrink-0"
                    style={isActive ? { color: primaryColor } : undefined}
                  />
                  {(isMobile || !collapsed) && (
                    <span className="font-medium">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer: cerrar sesión */}
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={() => {
                if (isMobile) onMobileClose?.();
                logout();
              }}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors',
                !isMobile && collapsed && 'justify-center'
              )}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {(isMobile || !collapsed) && (
                <span className="font-medium">Cerrar sesión</span>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
