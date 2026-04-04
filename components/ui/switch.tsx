'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/* ─── Simple, accessible toggle switch ─── */

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  label?: string;
  description?: string;
  className?: string;
  id?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  size = 'md',
  label,
  description,
  className,
  id,
}: SwitchProps) {
  const switchId = id ?? React.useId();

  const trackSize = size === 'sm'
    ? 'h-4 w-7'
    : 'h-5 w-9';

  const thumbSize = size === 'sm'
    ? 'h-3 w-3 data-[checked]:translate-x-3'
    : 'h-4 w-4 data-[checked]:translate-x-4';

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <button
        role="switch"
        id={switchId}
        aria-checked={checked}
        disabled={disabled}
        data-checked={checked ? '' : undefined}
        onClick={() => !disabled && onCheckedChange(!checked)}
        className={cn(
          'relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent',
          'transition-colors duration-200 ease-in-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-primary' : 'bg-zinc-200',
          trackSize
        )}
      >
        <span
          data-checked={checked ? '' : undefined}
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow-sm',
            'transform transition-transform duration-200 ease-in-out',
            'translate-x-0',
            checked ? (size === 'sm' ? 'translate-x-3' : 'translate-x-4') : 'translate-x-0',
            thumbSize
          )}
        />
      </button>

      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <label
              htmlFor={switchId}
              className="text-sm font-medium text-zinc-900 cursor-pointer select-none"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}
