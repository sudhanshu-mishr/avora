import { cn } from '@/lib/utils';
export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(
      'h-10 rounded-md border border-line bg-surface px-3 text-sm text-ink focus-ring', className,
    )} {...props}>{children}</select>
  );
}