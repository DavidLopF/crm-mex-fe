import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Types ─── */

export interface FilterOption<T extends string = string> {
  value: T;
  label: string;
  /** Optional Tailwind color classes for active state */
  color?: string;
  count?: number;
}

interface PillFilterProps<T extends string = string> {
  options: FilterOption<T>[];
  value: T | 'all';
  onChange: (value: T | 'all') => void;
  allLabel?: string;
  className?: string;
}

/* ─── PillFilter ─── */

export function PillFilter<T extends string = string>({
  options,
  value,
  onChange,
  allLabel = 'Todos',
  className,
}: PillFilterProps<T>) {
  return (
    <div className={cn('flex items-center gap-1.5 flex-wrap', className)}>
      {/* All option */}
      <button
        type="button"
        onClick={() => onChange('all')}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
          'border transition-all duration-150',
          value === 'all'
            ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
            : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:text-zinc-900'
        )}
      >
        {allLabel}
      </button>

      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(isActive ? 'all' : opt.value)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
              'border transition-all duration-150',
              isActive
                ? opt.color ?? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:text-zinc-900'
            )}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span
                className={cn(
                  'inline-flex items-center justify-center min-w-[1.125rem] h-[1.125rem] px-1 rounded-full text-[10px] font-semibold',
                  isActive ? 'bg-white/20 text-inherit' : 'bg-zinc-100 text-zinc-500'
                )}
              >
                {opt.count}
              </span>
            )}
            {isActive && <X className="w-3 h-3 opacity-70" />}
          </button>
        );
      })}
    </div>
  );
}

/* ─── ActiveFilters — shows active filters as removable chips ─── */

interface ActiveFilter {
  label: string;
  value: string;
  onRemove: () => void;
}

interface ActiveFiltersProps {
  filters: ActiveFilter[];
  onClearAll?: () => void;
}

export function ActiveFilters({ filters, onClearAll }: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-zinc-500">Filtros activos:</span>
      {filters.map((f) => (
        <span
          key={f.value}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200"
        >
          {f.label}
          <button
            type="button"
            onClick={f.onRemove}
            className="text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      {onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-zinc-400 hover:text-red-600 transition-colors underline underline-offset-2"
        >
          Limpiar todo
        </button>
      )}
    </div>
  );
}
