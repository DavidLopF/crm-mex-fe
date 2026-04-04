'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, ShoppingBag, TrendingUp, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui';
import { getPosDashboard, type PosDashboardDto } from '@/services/pos';
import { onCrossTabInvalidation } from '@/lib/cross-tab-sync';
import { cn } from '@/lib/utils';

export function PosDashboardCards() {
  const [data, setData] = useState<PosDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const dashboard = await getPosDashboard();
      setData(dashboard);
    } catch (err) {
      console.error('Error cargando dashboard POS:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    return onCrossTabInvalidation(['pos-sales', 'pos-dashboard'], load);
  }, [load]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN',
      maximumFractionDigits: 0
    }).format(price);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card-premium p-6 h-32 animate-pulse bg-white/50" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    {
      label: 'Ventas hoy',
      value: data.todaySalesCount,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      isPrice: false
    },
    {
      label: 'Ingresos hoy',
      value: data.todaySalesTotal,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      isPrice: true
    },
    {
      label: 'Ventas mes',
      value: data.monthSalesCount,
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-primary/5',
      isPrice: false
    },
    {
      label: 'Ingresos mes',
      value: data.monthSalesTotal,
      icon: DollarSign,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      isPrice: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="card-premium p-6 bg-white group hover:border-primary/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", card.bg)}>
              <card.icon className={cn("w-6 h-6", card.color)} />
            </div>
            <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-primary transition-colors" />
          </div>
          <div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">{card.label}</p>
            <p className="text-2xl font-black text-zinc-900 tracking-tight">
              {card.isPrice ? formatPrice(card.value as number) : card.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
