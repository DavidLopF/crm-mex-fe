import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-zinc-100 text-zinc-700 ring-zinc-200/80',
        secondary:
          'bg-zinc-100 text-zinc-600 ring-zinc-200/60',
        success:
          'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
        warning:
          'bg-amber-50 text-amber-700 ring-amber-200/80',
        danger:
          'bg-red-50 text-red-700 ring-red-200/80',
        info:
          'bg-blue-50 text-blue-700 ring-blue-200/80',
        outline:
          'bg-transparent text-zinc-700 ring-zinc-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
