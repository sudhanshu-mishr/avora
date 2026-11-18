import { cn } from '@/lib/utils';
export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs text-mute',
      className,
    )} {...props} />
  );
}