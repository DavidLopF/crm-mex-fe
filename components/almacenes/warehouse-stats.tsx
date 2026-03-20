'use client';

import { Warehouse, Package, BoxesIcon, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui';
import type { WarehouseStats } from '@/services/warehouses';

interface WarehouseStatsBarProps {
  stats: WarehouseStats | null | undefined;
  loading?: boolean;
}

function StatCard({
  title,
  value,
  icon: Icon,
  colorClass,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  colorClass: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">{title}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export function WarehouseStatsBar({ stats, loading }: WarehouseStatsBarProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="SKUs Almacenados"
        value={stats.totalSkus}
        icon={Package}
        colorClass="bg-blue-100 text-blue-600"
      />
      <StatCard
        title="Unidades Disponibles"
        value={stats.totalUnitsAvailable.toLocaleString('es-MX')}
        icon={Warehouse}
        colorClass="bg-green-100 text-green-600"
      />
      <StatCard
        title="Unidades Reservadas"
        value={stats.totalUnitsReserved.toLocaleString('es-MX')}
        icon={BoxesIcon}
        colorClass="bg-amber-100 text-amber-600"
      />
      <StatCard
        title="Recepciones"
        value={stats.totalReceptions}
        icon={BarChart3}
        colorClass="bg-purple-100 text-purple-600"
      />
    </div>
  );
}
