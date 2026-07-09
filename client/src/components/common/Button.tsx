import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-DEFAULT font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
      primary:
        'bg-primary-container text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-primary active:scale-[0.98]',
      secondary:
        'border border-outline-variant bg-transparent hover:bg-surface-container active:scale-[0.98] text-on-surface',
      ghost: 'bg-transparent hover:bg-surface-container text-on-surface-variant active:scale-[0.98]',
    };

    const sizes = {
      sm: 'h-8 px-3 text-sm rounded-sm',
      md: 'h-10 px-4 py-2',
      lg: 'h-12 px-6 text-lg rounded-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
