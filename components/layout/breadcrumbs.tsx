'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Route → breadcrumb label map ─── */

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/inventario': 'Inventario',
  '/inventario/almacenes': 'Almacenes',
  '/pedidos': 'Pedidos',
  '/clientes': 'Clientes',
  '/proveedores': 'Proveedores',
  '/pos': 'Punto de Venta',
  '/pos/precios': 'Precios por Volumen',
  '/pos/reportes': 'Reportes POS',
  '/reportes': 'Reportes',
  '/reportes/ventas-producto': 'Ventas por Producto',
  '/reportes/kardex': 'Kárdex',
  '/configuracion': 'Configuración',
  '/almacenes': 'Almacenes',
  '/login': 'Iniciar Sesión',
  '/forgot-password': 'Recuperar Contraseña',
  '/reset-password': 'Nueva Contraseña',
};

interface BreadcrumbSegment {
  href: string;
  label: string;
  isLast: boolean;
}

function buildBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  if (pathname === '/') {
    return [{ href: '/', label: 'Dashboard', isLast: true }];
  }

  const segments: BreadcrumbSegment[] = [
    { href: '/', label: 'Dashboard', isLast: false },
  ];

  // Build cumulative paths
  const parts = pathname.split('/').filter(Boolean);
  let cumulative = '';
  parts.forEach((part, i) => {
    cumulative += `/${part}`;
    const label = ROUTE_LABELS[cumulative] ?? capitalize(part.replace(/-/g, ' '));
    segments.push({
      href: cumulative,
      label,
      isLast: i === parts.length - 1,
    });
  });

  return segments;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ─── Component ─── */

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);

  // Don't show breadcrumbs on dashboard (only one item)
  if (crumbs.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1 min-w-0', className)}
    >
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1 min-w-0">
          {i > 0 && (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-300 flex-shrink-0" />
          )}

          {crumb.isLast ? (
            <span className="text-sm font-semibold text-zinc-900 truncate">
              {crumb.label}
            </span>
          ) : i === 0 ? (
            <Link
              href={crumb.href}
              className="flex-shrink-0 text-zinc-400 hover:text-zinc-700 transition-colors"
              aria-label="Dashboard"
            >
              <Home className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              href={crumb.href}
              className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors truncate"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
