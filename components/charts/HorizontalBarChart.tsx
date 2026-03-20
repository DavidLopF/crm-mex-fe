'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

interface DataItem {
  label: string;
  value: number;
  color?: string;
}

interface Props {
  data: DataItem[];
  defaultColor: string;
  height?: number;
  formatValue?: (v: number) => string;
  unit?: string;
}

function CustomTooltip({ active, payload, formatValue, unit }: any) {
  if (!active || !payload?.length) return null;
  const { value } = payload[0];
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-900">
        {formatValue ? formatValue(value) : value.toLocaleString('es-CO')}
        {unit ? ` ${unit}` : ''}
      </p>
    </div>
  );
}

export function HorizontalBarChart({ data, defaultColor, height = 220, formatValue, unit }: Props) {
  const truncate = (s: string, n = 20) => s.length > n ? s.slice(0, n) + '…' : s;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v) => formatValue ? formatValue(v) : v.toLocaleString('es-CO')}
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          tickFormatter={truncate}
          tick={{ fontSize: 11, fill: '#6B7280' }}
          axisLine={false}
          tickLine={false}
          width={120}
        />
        <Tooltip
          content={(props: any) => <CustomTooltip {...props} formatValue={formatValue} unit={unit} />}
          cursor={{ fill: '#F9FAFB' }}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={14}>
          {data.map((item, idx) => (
            <Cell key={idx} fill={item.color ?? defaultColor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
