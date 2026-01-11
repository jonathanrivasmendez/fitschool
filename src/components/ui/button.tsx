import * as React from 'react';
import { cn } from '@/lib/utils';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'secondary' | 'ghost';
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          variant === 'default' && 'bg-brand-500 text-white hover:bg-brand-700',
          variant === 'secondary' && 'bg-slate-100 text-slate-900 hover:bg-slate-200',
          variant === 'ghost' && 'bg-transparent text-slate-700 hover:bg-slate-100',
          'h-11 px-4 py-2',
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
