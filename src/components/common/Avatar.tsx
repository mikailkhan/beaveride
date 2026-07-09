import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  imageUrl?: string;
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, name, color = '#2c59bc', size = 'md', imageUrl, ...props }, ref) => {
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const sizes = {
      sm: 'h-6 w-6 text-xs',
      md: 'h-8 w-8 text-sm',
      lg: 'h-10 w-10 text-base',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full border-2 overflow-hidden bg-surface-container',
          sizes[size],
          className
        )}
        style={{ borderColor: color }}
        title={name}
        {...props}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="font-medium text-on-surface" style={{ color }}>
            {initials}
          </span>
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';
