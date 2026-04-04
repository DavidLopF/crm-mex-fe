'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { DashboardRecentOrder } from '@/services/dashboard';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface OrdersPipelineProps {
  pedidos: DashboardRecentOrder[];
  pendingTotal: number;
}

const STATUS_CONFIG: Record<string, { label: string; bar: string; bg: string; text: string; order: number }> = {
  COTIZADO:    { label: 'Cotizado',    bar: 'bg-blue-400',    bg: 'bg-blue-50',    text: 'text-blue-700',    order: 1 },
  TRANSMITIDO: { label: 'Transmitido', bar: 'bg-violet-400',  bg: 'bg-violet-50',  text: 'text-violet-700',  order: 2 },
  EN_CURSO:    { label: 'En Curso',    bar: 'bg-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-700',   order: 3 },
  ENVIADO:     { label: 'Enviado',     bar: 'bg-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700', order: 4 },
  CANCELADO:   { label: 'Cancelado',   bar: 'bg-red-400',     bg: 'bg-red-50',     text: 'text-red-700',     order: 5 },
};

export function OrdersPipeline({ pedidos, pendingTotal }: OrdersPipelineProps) {
  const counts: Record<string, number> = {};
  for (const p of pedidos) {
    counts[p.statusCode] = (counts[p.statusCode] ?? 0) + 1;
  }

  const total = pedidos.length;
  const statuses = Object.keys(STATUS_CONFIG).sort(
    (a, b) => STATUS_CONFIG[a].order - STATUS_CONFIG[b].order,
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle>Pipeline de Pedidos</CardTitle>
        <a
          href="/pedidos"
          className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 cursor-pointer"
        >
          Ver todos <ArrowRight className="w-3 h-3" />
        </a>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-zinc-900">{pendingTotal}</span>
          <span className="text-sm text-zinc-500">pedidos activos</span>
        </div>

        <div className="space-y-3">
          {statuses.map((code) => {
            const config = STATUS_CONFIG[code];
            const count = counts[code] ?? 0;
            const pct = total > 0 ? (count / total) * 100 : 0;

            return (
              <div key={code} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', config.bg, config.text)}>
                    {config.label}
                  </span>
                  <span className="text-xs font-semibold text-zinc-700 tabular-nums">{count}</span>
                </div>
                <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', config.bar)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-zinc-400 pt-1">
          Distribución basada en los últimos {total} pedidos registrados
        </p>
      </CardContent>
    </Card>
  );
}
