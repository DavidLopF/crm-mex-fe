import * as React from 'react';
import { cn } from '@/lib/utils';

/* ─── Native HTML select (backward-compatible) ─── */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 py-2',
            'text-sm text-zinc-900 shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400',
            'disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400',
            'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-100/20 dark:focus:border-zinc-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500',
            error && 'border-red-400 focus:ring-red-400/20',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
