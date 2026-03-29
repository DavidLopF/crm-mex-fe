'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Slice {
  name: string;
  value: number;
  color: string;
  [key: string]: unknown;
}

const RADIAN = Math.PI / 180;

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white border border-zinc-100 rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-zinc-900">{name}</p>
      <p className="text-zinc-500">{value.toLocaleString('es-CO')}</p>
    </div>
  );
}

interface Props {
  data: Slice[];
  height?: number;
  formatValue?: (v: number) => string;
}

export function DonutChart({ data, height = 220, formatValue }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="48%"
          innerRadius="48%"
          outerRadius="72%"
          paddingAngle={2}
          dataKey="value"
          labelLine={false}
          label={CustomLabel}
        >
          {data.map((slice, i) => (
            <Cell key={i} fill={slice.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: 11, color: '#6B7280' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
