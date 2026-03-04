'use client';

import { PosDashboardCards, SalesList } from '@/components/pos';
import { PermissionGuard } from '@/components/layout';

export default function PosReportesPage() {
  return (
    <PermissionGuard moduleCode="POS">
      <main className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes de Ventas</h1>
          <p className="text-gray-500 text-sm">Resumen de ventas del punto de venta</p>
        </div>

        {/* Dashboard Cards */}
        <PosDashboardCards />

        {/* Lista de ventas */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Historial de ventas</h2>
          <SalesList />
        </div>
      </main>
    </PermissionGuard>
  );
}
