'use client';

import {
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import type { KardexMovimiento } from '@/services/reports';
import { formatNumber } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', {
    month: 'short',
    day: 'numeric',
  });
}

// ─── Tooltip personalizado ────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const items = payload.filter((p: any) => p.value !== 0 && p.value !== undefined);

  return (
    <div className="bg-white border border-zinc-100 rounded-xl px-4 py-3 shadow-lg text-sm min-w-[180px]">
      <p className="text-xs text-zinc-400 mb-2">{fmtDate(label)}</p>
      {items.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }} className="font-medium">{p.name}</span>
          <span className="font-bold text-zinc-900">
            {p.dataKey === 'saldo'
              ? formatNumber(Number(p.value))
              : `${p.dataKey === 'entrada' ? '+' : '-'}${formatNumber(Math.abs(Number(p.value)))}`}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Componente ───────────────────────────────────────────────────────────────

interface Props {
  movimientos: KardexMovimiento[];
  primaryColor: string;
}

export function KardexMovimientosChart({ movimientos, primaryColor }: Props) {
  if (movimientos.length === 0) return null;

  // Construir datos para el gráfico
  const chartData = movimientos.map((m) => ({
    fecha: m.fecha,
    entrada: m.tipo === 'ENTRADA' ? m.qty : 0,
    salida: m.tipo === 'SALIDA' ? m.qty : 0,
    saldo: m.saldo,
    concepto: m.concepto,
    referencia: m.referencia,
  }));

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-700">
          Evolución del stock
        </h3>
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            Entradas
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" />
            Salidas
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-8 h-0.5 rounded" style={{ backgroundColor: primaryColor }} />
            Saldo
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={primaryColor} stopOpacity={0.15} />
              <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />

          <XAxis
            dataKey="fecha"
            tickFormatter={fmtDate}
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
            width={36}
          />

          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#E5E7EB" strokeDasharray="3 3" />

          {/* Barras de entradas */}
          <Bar
            dataKey="entrada"
            name="Entrada"
            fill="#10B981"
            fillOpacity={0.85}
            radius={[3, 3, 0, 0]}
            barSize={8}
            stackId="movs"
          />

          {/* Barras de salidas (negativo visual) */}
          <Bar
            dataKey="salida"
            name="Salida"
            fill="#F87171"
            fillOpacity={0.85}
            radius={[3, 3, 0, 0]}
            barSize={8}
          />

          {/* Área del saldo */}
          <Area
            type="monotone"
            dataKey="saldo"
            name="Saldo"
            stroke={primaryColor}
            strokeWidth={2.5}
            fill="url(#saldoGrad)"
            dot={false}
            activeDot={{ r: 5, fill: primaryColor, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
