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
  Menu,
  Truck,
  Store,
  BarChart3,
  Layers,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCompany } from '@/lib/company-context';
import { useAuth } from '@/lib/auth-context';
import { ROUTE_TO_MODULE } from '@/lib/hooks';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inventario', href: '/inventario', icon: Package },
  { name: 'Pedidos', href: '/pedidos', icon: ShoppingCart },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Proveedores', href: '/proveedores', icon: Truck },
  { name: 'Punto de Venta', href: '/pos', icon: Store },
  { name: 'Precios por Volumen', href: '/pos/precios', icon: Layers },
  { name: 'Reportes POS', href: '/pos/reportes', icon: BarChart3 },
  { name: 'Configuración', href: '/configuracion', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapsedChange: (value: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onCollapsedChange, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { settings } = useCompany();
  const { logout, can, permissions } = useAuth();

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // Cerrar sidebar móvil al cambiar de página
  useEffect(() => {
    onMobileClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const visibleNavigation = navigation.filter((item) => {
    if (!mounted) return true;
    const moduleCode = ROUTE_TO_MODULE[item.href];
    if (!moduleCode) return true;
    const modulePermission = permissions.find((p) => p.moduleCode === moduleCode);
    if (!modulePermission) return true;
    return can(moduleCode, 'canView');
  });

  const NavItems = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {/* Header */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-gray-200',
        !isMobile && collapsed ? 'justify-center' : 'justify-between'
      )}>
        {(isMobile || !collapsed) && (
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: settings.primaryColor }}
            >
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 truncate">{settings.companyName}</span>
          </Link>
        )}
        {!isMobile && collapsed && (
          <Link href="/" className="flex items-center justify-center">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: settings.primaryColor }}
            >
              <Package className="w-5 h-5 text-white" />
            </div>
          </Link>
        )}
        {isMobile ? (
          <button
            onClick={onMobileClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors ml-auto flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        ) : (
          <button
            onClick={() => onCollapsedChange(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            {collapsed ? (
              <Menu className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNavigation.map((item) => {
          const isActive = pathname === item.href;
          const showLabel = isMobile || !collapsed;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                isActive ? 'text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                !showLabel && 'justify-center'
              )}
              style={isActive ? { backgroundColor: settings.primaryColor + '15', color: settings.primaryColor } : undefined}
            >
              <item.icon
                className="w-5 h-5 flex-shrink-0"
                style={isActive ? { color: settings.primaryColor } : undefined}
              />
              {showLabel && <span className="font-medium">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={logout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors',
            !isMobile && collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {(isMobile || !collapsed) && <span className="font-medium">Cerrar sesión</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── DESKTOP: sidebar fijo ── */}
      <aside
        className={cn(
          'hidden md:flex flex-col fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        <NavItems isMobile={false} />
      </aside>

      {/* ── MÓVIL: drawer deslizante ── */}
      <aside
        className={cn(
          'md:hidden flex flex-col fixed left-0 top-0 z-40 h-screen w-72 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <NavItems isMobile={true} />
      </aside>
    </>
  );
}
