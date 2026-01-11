import { cn } from '@/lib/utils';
import * as React from 'react';

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'pending' | 'complete' | 'saved';
};

export function Badge({ className, variant = 'pending', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variant === 'pending' && 'bg-amber-100 text-amber-700',
        variant === 'complete' && 'bg-emerald-100 text-emerald-700',
        variant === 'saved' && 'bg-sky-100 text-sky-700',
        className
      )}
      {...props}
    />
  );
}
