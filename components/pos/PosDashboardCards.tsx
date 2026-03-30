'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, ShoppingBag, TrendingUp, Star } from 'lucide-react';
import { Card } from '@/components/ui';
import { getPosDashboard, type PosDashboardDto } from '@/services/pos';
import { onCrossTabInvalidation } from '@/lib/cross-tab-sync';

export function PosDashboardCards() {
  const [data, setData] = useState<PosDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const dashboard = await getPosDashboard();
      setData(dashboard);
    } catch (err) {
      console.error('Error cargando dashboard POS:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => { load(); }, [load]);

  // ── Tiempo real: actualizar contadores cuando cambie una venta ──────
  // Responde tanto a ventas nuevas (pos-sales) como a cambios de estado
  // (pos-dashboard), lo que mantiene siempre frescos los KPIs.
  useEffect(() => {
    return onCrossTabInvalidation(['pos-sales', 'pos-dashboard'], load);
  }, [load]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-5 animate-pulse">
            <div className="h-4 bg-zinc-200 rounded w-20 mb-3" />
            <div className="h-8 bg-zinc-200 rounded w-28" />
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Cards principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xs text-zinc-500 uppercase font-medium">Ventas hoy</p>
          </div>
          <p className="text-3xl font-bold text-zinc-900">{data.todaySalesCount}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-xs text-zinc-500 uppercase font-medium">Ingresos hoy</p>
          </div>
          <p className="text-2xl font-bold text-zinc-900 tracking-tight">{formatPrice(data.todaySalesTotal)}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-xs text-zinc-500 uppercase font-medium">Ventas mes</p>
          </div>
          <p className="text-3xl font-bold text-zinc-900">{data.monthSalesCount}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-xs text-zinc-500 uppercase font-medium">Ingresos mes</p>
          </div>
          <p className="text-2xl font-bold text-zinc-900 tracking-tight">{formatPrice(data.monthSalesTotal)}</p>
        </Card>
      </div>

      {/* Top productos hoy */}
      {data.topProductsToday.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-zinc-700">Top productos hoy</h3>
          </div>
          <div className="space-y-2">
            {data.topProductsToday.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-zinc-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-zinc-100 text-xs font-bold flex items-center justify-center text-zinc-500">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{item.productName}</p>
                    {item.variantName && (
                      <p className="text-xs text-zinc-400">{item.variantName}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-zinc-900">{item.qtyTotal} uds.</p>
                  <p className="text-xs text-zinc-500">{formatPrice(item.revenueTotal)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
