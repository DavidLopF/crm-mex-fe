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
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inventario', href: '/inventario', icon: Package },
  { name: 'Pedidos', href: '/pedidos', icon: ShoppingCart },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Configuración', href: '/configuracion', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        <div className={cn(
          'flex items-center h-16 px-4 border-b border-gray-200',
          collapsed ? 'justify-center' : 'justify-between'
        )}>
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">CRM </span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {collapsed ? (
              <Menu className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  collapsed && 'justify-center'
                )}
              >
                <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-blue-600')} />
                {!collapsed && (
                  <span className="font-medium">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <button
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors',
              collapsed && 'justify-center'
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">Cerrar sesión</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
