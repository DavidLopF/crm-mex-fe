import { Card, CardContent } from '@/components/ui/card';
import { Sparkline, SPARKLINE_PRESETS } from '@/components/ui/sparkline';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  /** @deprecated kept for backward compat — use iconBg + iconColor */
  iconClassName?: string;
  iconBg?: string;
  iconColor?: string;
  /** Optional sparkline data. Defaults to a random-looking upward preset */
  sparklineData?: number[];
  /** Sparkline stroke color */
  sparklineColor?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  className,
  iconClassName,
  iconBg,
  iconColor,
  sparklineData,
  sparklineColor,
}: StatCardProps) {
  const containerClass = iconClassName ?? iconBg ?? 'bg-zinc-100';
  const iconClass = iconColor ?? (iconClassName ? 'text-current' : 'text-zinc-600');

  // Default sparkline: choose preset based on trend direction
  const chartData = sparklineData ?? (
    trend?.isPositive === false ? SPARKLINE_PRESETS.downward : SPARKLINE_PRESETS.upward
  );
  const chartColor = sparklineColor ?? (
    trend?.isPositive === false ? '#ef4444' : '#22c55e'
  );

  return (
    <Card className={cn(
      'relative overflow-hidden border-zinc-200/80 hover:shadow-md transition-all duration-200',
      className
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">

          {/* Left: label + value + trend */}
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest truncate">
              {title}
            </p>
            <p className="text-2xl font-bold text-zinc-900 tracking-tight leading-none">
              {value}
            </p>
            {trend && (
              <div className="flex items-center gap-1 pt-1">
                {trend.isPositive
                  ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                <span className={cn(
                  'text-xs font-semibold',
                  trend.isPositive ? 'text-emerald-600' : 'text-red-500'
                )}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              </div>
            )}
          </div>

          {/* Right: icon + sparkline stacked */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {/* Icon */}
            <div className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center ring-1 ring-inset ring-zinc-900/5',
              containerClass
            )}>
              <Icon className={cn('w-4.5 h-4.5', iconClass)} />
            </div>

            {/* Sparkline */}
            <Sparkline
              data={chartData}
              color={chartColor}
              width={72}
              height={32}
              strokeWidth={1.75}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
