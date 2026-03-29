'use client';

/**
 * ─── Visual Reports Component ────────────────────────────────────────────────
 *
 * Estructura:
 *   1. Bento Grid — KPIs con jerarquía visual clara
 *   2. Área Chart — Ingresos comparativos mes vs mes anterior
 *   3. Barra Chart — Top 5 productos más vendidos
 *   4. Donut — Distribución por canal de venta
 *
 * Librería: Recharts (ya instalada en el proyecto)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Users, Package, ArrowUpRight, Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/* ─── Demo data ─── */

const AREA_DATA = [
  { mes: 'Oct', actual: 38000, anterior: 31000 },
  { mes: 'Nov', actual: 42000, anterior: 35000 },
  { mes: 'Dic', actual: 61000, anterior: 48000 },
  { mes: 'Ene', actual: 55000, anterior: 52000 },
  { mes: 'Feb', actual: 67000, anterior: 58000 },
  { mes: 'Mar', actual: 74000, anterior: 62000 },
];

const TOP_PRODUCTS = [
  { name: 'Aceite de Oliva 1L', ventas: 342, ingresos: 68400 },
  { name: 'Harina Integral 5kg', ventas: 298, ingresos: 44700 },
  { name: 'Arroz Premium 2kg', ventas: 267, ingresos: 34710 },
  { name: 'Azúcar Morena 1kg', ventas: 241, ingresos: 24100 },
  { name: 'Café Molido 500g', ventas: 198, ingresos: 49500 },
];

const CHANNEL_DATA = [
  { name: 'POS Tienda', value: 45, color: '#18181b' },
  { name: 'Pedidos Online', value: 30, color: '#3f3f46' },
  { name: 'Whatsapp', value: 15, color: '#71717a' },
  { name: 'Telefónico', value: 10, color: '#d4d4d8' },
];

/* ─── Formatting helpers ─── */

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

/* ─── Custom tooltip for area chart ─── */

function AreaTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-zinc-900 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-6">
          <span className="text-zinc-500">{p.name === 'actual' ? 'Este año' : 'Año anterior'}</span>
          <span className="font-semibold text-zinc-900">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Custom tooltip for bar chart ─── */

function BarTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-zinc-900 mb-1 max-w-[150px] truncate">{label}</p>
      <p className="text-zinc-500">
        Ventas: <span className="font-semibold text-zinc-900">{payload[0]?.value} uds.</span>
      </p>
    </div>
  );
}

/* ─── Period selector ─── */

type Period = '7d' | '30d' | '90d' | '1y';

function PeriodSelector({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const opts: { v: Period; l: string }[] = [
    { v: '7d', l: '7 días' },
    { v: '30d', l: '30 días' },
    { v: '90d', l: '90 días' },
    { v: '1y', l: '1 año' },
  ];
  return (
    <div className="flex items-center rounded-lg border border-zinc-200 p-0.5 bg-zinc-50">
      {opts.map(({ v, l }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            'px-3 py-1 rounded-md text-xs font-medium transition-all',
            value === v
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700'
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

/* ─── Bento KPI Card ─── */

interface BentoKpiProps {
  title: string;
  value: string;
  change: { value: number; isPositive: boolean };
  sub?: string;
  icon: React.ElementType;
  /** 'lg' spans 2 cols */
  size?: 'sm' | 'lg';
  accentColor?: string;
}

function BentoKpi({ title, value, change, sub, icon: Icon, size = 'sm', accentColor = '#18181b' }: BentoKpiProps) {
  return (
    <Card className={cn(
      'group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-zinc-200/80',
      size === 'lg' && 'lg:col-span-2'
    )}>
      <CardContent className={cn('flex flex-col gap-4', size === 'lg' ? 'p-6' : 'p-5')}>
        <div className="flex items-start justify-between">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: accentColor + '12' }}
          >
            <Icon className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          <div className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
            change.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
          )}>
            {change.isPositive
              ? <ArrowUpRight className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change.value)}%
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
          <p className={cn('font-bold text-zinc-900 tracking-tight mt-1', size === 'lg' ? 'text-3xl' : 'text-2xl')}>
            {value}
          </p>
          {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Main component ─── */

export function VisualReports() {
  const [period, setPeriod] = useState<Period>('30d');

  return (
    <div className="p-6 space-y-6">

      {/* ─── Page Header ─── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Reportes</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Análisis de rendimiento y tendencias del negocio</p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* ─── Bento Grid KPIs ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <BentoKpi
          title="Ingresos Totales"
          value="$274,500"
          change={{ value: 12.4, isPositive: true }}
          sub="vs. período anterior"
          icon={DollarSign}
          size="lg"
          accentColor="#16a34a"
        />
        <BentoKpi
          title="Órdenes"
          value="1,284"
          change={{ value: 8.1, isPositive: true }}
          sub="este período"
          icon={ShoppingCart}
        />
        <BentoKpi
          title="Clientes Activos"
          value="438"
          change={{ value: 3.2, isPositive: true }}
          icon={Users}
        />
        <BentoKpi
          title="Ticket Promedio"
          value="$2,137"
          change={{ value: 4.7, isPositive: false }}
          sub="por orden"
          icon={Package}
        />
        <BentoKpi
          title="Margen Bruto"
          value="34.2%"
          change={{ value: 1.8, isPositive: true }}
          sub="sobre ingresos"
          icon={TrendingUp}
        />
        <BentoKpi
          title="Nuevos Clientes"
          value="67"
          change={{ value: 15.3, isPositive: true }}
          sub="registros este mes"
          icon={Users}
        />
      </div>

      {/* ─── Charts row 1 ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Area Chart — span 2 */}
        <Card className="lg:col-span-2 border-zinc-200/80">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Ingresos comparativos</CardTitle>
                <p className="text-xs text-zinc-400 mt-0.5">Este año vs. año anterior (MXN)</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-zinc-900 rounded" /> Este año
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-zinc-300 rounded" /> Año ant.
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={AREA_DATA} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#18181b" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#18181b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradAnterior" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#d4d4d8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#d4d4d8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#a1a1aa' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<AreaTooltip />} />
                <Area
                  type="monotone"
                  dataKey="anterior"
                  stroke="#d4d4d8"
                  strokeWidth={2}
                  fill="url(#gradAnterior)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#18181b"
                  strokeWidth={2.5}
                  fill="url(#gradActual)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#18181b', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donut — Distribution by channel */}
        <Card className="border-zinc-200/80">
          <CardHeader className="pb-2">
            <CardTitle>Canal de venta</CardTitle>
            <p className="text-xs text-zinc-400">Distribución de órdenes</p>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={CHANNEL_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={62}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {CHANNEL_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [`${v}%`, '']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="space-y-2 mt-2">
              {CHANNEL_DATA.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-zinc-600">{c.name}</span>
                  </div>
                  <span className="font-semibold text-zinc-900">{c.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Charts row 2 ─── */}
      <Card className="border-zinc-200/80">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Top 5 productos</CardTitle>
              <p className="text-xs text-zinc-400 mt-0.5">Por unidades vendidas este período</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Bar chart */}
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={TOP_PRODUCTS}
                layout="vertical"
                margin={{ top: 0, right: 12, left: 4, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                  width={130}
                />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="ventas" fill="#18181b" radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>

            {/* Table */}
            <div className="space-y-1">
              <div className="flex text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-3 pb-1">
                <span className="flex-1">Producto</span>
                <span className="w-16 text-right">Ventas</span>
                <span className="w-24 text-right">Ingresos</span>
              </div>
              {TOP_PRODUCTS.map((p, i) => (
                <div
                  key={p.name}
                  className="flex items-center px-3 py-2 rounded-lg hover:bg-zinc-50 transition-colors gap-2"
                >
                  <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-xs font-medium text-zinc-700 truncate">{p.name}</span>
                  <span className="w-16 text-right text-xs text-zinc-500 tabular-nums">{p.ventas} uds.</span>
                  <span className="w-24 text-right text-xs font-semibold text-zinc-900 tabular-nums">
                    {fmt(p.ingresos)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
