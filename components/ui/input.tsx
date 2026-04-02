import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2',
            'text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400',
            'transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 focus-visible:border-zinc-400',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-zinc-50',
            'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:ring-zinc-100/20 dark:focus-visible:border-zinc-500 dark:disabled:bg-zinc-800',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            error && 'border-red-400 focus-visible:ring-red-400/20',
            className
          )}
          ref={ref}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
