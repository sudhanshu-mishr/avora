import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon';
const variants: Record<Variant, string> = {
  primary: 'bg-accent text-base hover:bg-accent2',
  secondary: 'bg-surface text-ink hover:bg-panel',
  outline: 'border border-line bg-transparent text-ink hover:bg-surface',
  ghost: 'bg-transparent text-mute hover:text-ink hover:bg-surface',
  danger: 'bg-red-500/15 text-red-300 hover:bg-red-500/25',
};
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm', md: 'h-9 px-4 text-sm', lg: 'h-11 px-5 text-base',
  icon: 'h-9 w-9',
};
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant; size?: Size;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-ring disabled:opacity-50',
        variants[variant], sizes[size], className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';