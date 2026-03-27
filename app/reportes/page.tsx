'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart2, Package, ClipboardList } from 'lucide-react';
import { PermissionGuard } from '@/components/layout';
import { useCompany } from '@/lib/company-context';

const submodules = [
  {
    href: '/reportes/ventas-producto',
    label: 'Ventas por Producto',
    description: 'Analiza las unidades vendidas y el revenue generado por producto, combinando POS y pedidos.',
    icon: BarChart2,
  },
  {
    href: '/reportes/kardex',
    label: 'Kárdex de Productos',
    description: 'Visualiza el historial completo de movimientos (entradas y salidas) de cada variante con saldo acumulado.',
    icon: ClipboardList,
  },
];

export default function ReportesPage() {
  const { settings } = useCompany();
  const primaryColor = settings.primaryColor;
  const pathname = usePathname();

  return (
    <PermissionGuard moduleCode="REPORTES">
      <main className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: primaryColor + '15' }}
          >
            <Package className="w-5 h-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Reportes</h1>
            <p className="text-sm text-zinc-500">
              Análisis de ventas e inventario
            </p>
          </div>
        </div>

        {/* Cards de submodulos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {submodules.map((mod) => {
            const Icon = mod.icon;
            const isActive = pathname === mod.href;
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className={`group bg-white rounded-2xl border p-6 flex gap-4 items-start hover:shadow-md transition-all ${
                  isActive ? 'border-2' : 'border-zinc-200 hover:border-zinc-300'
                }`}
                style={isActive ? { borderColor: primaryColor } : {}}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors group-hover:opacity-90"
                  style={{ backgroundColor: primaryColor + '15' }}
                >
                  <Icon className="w-6 h-6" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-900 group-hover:text-zinc-700 transition-colors">
                    {mod.label}
                  </h2>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    {mod.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </PermissionGuard>
  );
}
