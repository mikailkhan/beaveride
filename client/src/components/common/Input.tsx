import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-DEFAULT border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-on-surface-variant focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[4px] focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all',
          error && 'border-error focus-visible:border-error focus-visible:ring-error/20',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
