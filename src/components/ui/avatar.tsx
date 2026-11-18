import { cn, initials } from '@/lib/utils';
export function Avatar({ name, src, size = 36, className }: {
  name?: string; src?: string | null; size?: number; className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name ?? 'avatar'} width={size} height={size}
        className={cn('rounded-full object-cover', className)} style={{ width: size, height: size }} />
    );
  }
  return (
    <span
      className={cn('inline-flex items-center justify-center rounded-full bg-accent/20 text-accent', className)}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials(name)}
    </span>
  );
}