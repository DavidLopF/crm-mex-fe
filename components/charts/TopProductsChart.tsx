'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { formatCompactCurrency, formatCurrency } from '@/lib/utils';

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-zinc-100 rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-zinc-900 mb-1 max-w-[180px] truncate">{d.name}</p>
      <p className="text-zinc-600">{formatCurrency(d.revenue)}</p>
      <p className="text-xs text-zinc-400">{d.qtySold} unidades</p>
    </div>
  );
}

interface Props {
  data: { name: string; revenue: number; qtySold: number }[];
  color: string;
}

export function TopProductsChart({ data, color }: Props) {
  const truncate = (s: string, n = 18) => s.length > n ? s.slice(0, n) + '…' : s;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v) => formatCompactCurrency(v)}
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tickFormatter={truncate}
          tick={{ fontSize: 11, fill: '#6B7280' }}
          axisLine={false}
          tickLine={false}
          width={110}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB' }} />
        <Bar dataKey="revenue" radius={[0, 6, 6, 0]} barSize={14}>
          {data.map((_, idx) => (
            <Cell
              key={idx}
              fill={color}
              fillOpacity={1 - idx * 0.12}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
