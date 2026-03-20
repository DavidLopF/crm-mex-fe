'use client';

import Link from 'next/link';
import { ClipboardList, ChevronRight } from 'lucide-react';
import { PermissionGuard } from '@/components/layout';
import { KardexReport } from '@/components/reports';

export default function KardexPage() {
  return (
    <PermissionGuard moduleCode="REPORTES">
      <main className="p-4 lg:p-6 space-y-5">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-500">
          <Link href="/reportes" className="hover:text-gray-700 transition-colors">
            Reportes
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="font-medium text-gray-800">Kárdex de Productos</span>
        </nav>

        {/* Header */}
        <div className="flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-gray-400" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Kárdex de Productos
            </h1>
            <p className="text-sm text-gray-500">
              Historial de movimientos por variante con saldo acumulado
            </p>
          </div>
        </div>

        {/* Componente del kardex */}
        <KardexReport />
      </main>
    </PermissionGuard>
  );
}
