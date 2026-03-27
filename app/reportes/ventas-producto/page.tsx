'use client';

import Link from 'next/link';
import { BarChart2, ChevronRight } from 'lucide-react';
import { PermissionGuard } from '@/components/layout';
import { VentasProductoReport } from '@/components/reports';

export default function VentasProductoPage() {
  return (
    <PermissionGuard moduleCode="REPORTES">
      <main className="p-4 lg:p-6 space-y-5">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-zinc-500">
          <Link href="/reportes" className="hover:text-zinc-700 transition-colors">
            Reportes
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="font-medium text-zinc-800">Ventas por Producto</span>
        </nav>

        {/* Header */}
        <div className="flex items-center gap-3">
          <BarChart2 className="w-6 h-6 text-zinc-400" />
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
              Reporte de Ventas por Producto
            </h1>
            <p className="text-sm text-zinc-500">
              Unidades vendidas y revenue agrupado por producto (POS + Pedidos)
            </p>
          </div>
        </div>

        {/* Componente del reporte */}
        <VentasProductoReport />
      </main>
    </PermissionGuard>
  );
}
