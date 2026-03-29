import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-800 active:bg-zinc-950',
        secondary:
          'bg-zinc-100 text-zinc-900 shadow-sm hover:bg-zinc-200 active:bg-zinc-300',
        outline:
          'border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 hover:text-zinc-900 active:bg-zinc-100',
        ghost:
          'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900',
        danger:
          'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800',
        'danger-outline':
          'border border-red-200 text-red-600 bg-white hover:bg-red-50 hover:border-red-300',
        link:
          'text-blue-600 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-md',
        md: 'h-9 px-4 py-2',
        lg: 'h-10 px-6 text-base rounded-xl',
        icon: 'h-9 w-9',
        'icon-sm': 'h-7 w-7 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { buttonVariants };
