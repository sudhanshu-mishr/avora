import { cn } from '@/lib/utils';
export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 rounded-lg surface px-6 py-16 text-center')}>
      <h3 className="font-medium text-ink">{title}</h3>
      {hint && <p className="muted max-w-sm text-sm">{hint}</p>}
      {action}
    </div>
  );
}