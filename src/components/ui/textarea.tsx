import { cn } from '@/lib/utils';
export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-[90px] w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-mute focus-ring',
        className,
      )}
      {...props}
    />
  );
}