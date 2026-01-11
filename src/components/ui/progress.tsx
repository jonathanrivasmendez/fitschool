import { cn } from '@/lib/utils';

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-2 w-full rounded-full bg-slate-200', className)}>
      <div className="h-2 rounded-full bg-brand-500 transition-all" style={{ width: `${value}%` }} />
    </div>
  );
}
