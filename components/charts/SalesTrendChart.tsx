'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const fmtCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const fmtDay = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' });

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="text-gray-500 text-xs mb-1">{fmtDay(label)}</p>
      <p className="font-bold text-gray-900">{fmtCOP(payload[0].value)}</p>
    </div>
  );
}

interface Props {
  data: { date: string; total: number }[];
  color: string;
}

export function SalesTrendChart({ data, color }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={fmtDay}
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="total"
          stroke={color}
          strokeWidth={2.5}
          fill="url(#salesGrad)"
          dot={false}
          activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
