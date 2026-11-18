import { cn } from '@/lib/utils';
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink placeholder:text-mute focus-ring',
        className,
      )}
      {...props}
    />
  );
}