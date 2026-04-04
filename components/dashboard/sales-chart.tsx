'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { DashboardSalesChartDay } from '@/services/dashboard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface SalesChartProps {
  data: DashboardSalesChartDay[];
  className?: string;
}

/** "2026-02-25" → "25 Feb" */
function formatChartDate(dateStr: string): string {
  const [, , day] = dateStr.split('-');
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const monthIdx = parseInt(dateStr.split('-')[1]) - 1;
  return `${parseInt(day)} ${months[monthIdx]}`;
}

export function SalesChart({ data, className }: SalesChartProps) {
  const chartData = data.map(d => ({ ...d, fecha: formatChartDate(d.date) }));
  const periodTotal = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle>Tendencia de Ventas</CardTitle>
          <p className="text-xs text-zinc-400 mt-0.5">Últimos 7 días</p>
        </div>
        {periodTotal > 0 && (
          <div className="text-right">
            <p className="text-lg font-bold text-zinc-900 leading-none">{formatCurrency(periodTotal)}</p>
            <p className="text-xs text-zinc-400 mt-0.5">total del periodo</p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
              <XAxis
                dataKey="fecha"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  boxShadow: '0 8px 16px -4px rgba(0,0,0,0.12)',
                  padding: '10px 14px',
                }}
                formatter={(value) => [formatCurrency(Number(value)), 'Ventas']}
                labelStyle={{ color: '#6B7280', fontSize: 12, marginBottom: 4 }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#3B82F6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorTotal)"
                dot={{ fill: '#3B82F6', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
