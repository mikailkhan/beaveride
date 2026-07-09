import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, glass = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm',
          glass && 'bg-white/80 backdrop-blur-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.04)]',
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';
