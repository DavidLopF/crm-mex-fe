import { Card, CardContent } from '@/components/ui/card';
import { Sparkline, SPARKLINE_PRESETS } from '@/components/ui/sparkline';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  iconBg?: string;
  iconColor?: string;
  sparklineData?: number[];
  sparklineColor?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  className,
  iconBg,
  iconColor,
  sparklineData,
  sparklineColor,
}: StatCardProps) {
  const containerClass = iconBg ?? 'bg-zinc-100';
  const iconClass = iconColor ?? 'text-zinc-600';

  // Default sparkline
  const chartData = sparklineData ?? (
    trend?.isPositive === false ? SPARKLINE_PRESETS.downward : SPARKLINE_PRESETS.upward
  );
  const chartColor = sparklineColor ?? (
    trend?.isPositive === false ? '#f43f5e' : '#10b981'
  );

  return (
    <Card className={cn(
      'card-premium group relative overflow-hidden border-none transition-all duration-500',
      className
    )}>
      {/* Sutil gradiente de fondo en hover */}
      <div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-zinc-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardContent className="p-6 relative z-10">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            {/* Icon Container */}
            <div className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 duration-500',
              containerClass
            )}>
              <Icon className={cn('w-6 h-6', iconClass)} />
            </div>

            {/* Sparkline overlay right */}
            <div className="pt-2">
               <Sparkline
                data={chartData}
                color={chartColor}
                width={80}
                height={35}
                strokeWidth={2}
              />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.15em]">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
                {value}
              </h3>
              {trend && (
                <div className={cn(
                  'flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold',
                  trend.isPositive 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' 
                    : 'bg-rose-50 text-rose-600 border border-rose-100/50'
                )}>
                  {trend.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  <span>{Math.abs(trend.value)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
