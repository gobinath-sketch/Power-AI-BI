import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50',
        variant === 'primary' &&
          'bg-neutral-900 text-white hover:bg-neutral-800',
        variant === 'ghost' && 'text-neutral-900 hover:bg-neutral-100',
        variant === 'outline' &&
          'border border-neutral-200 bg-white hover:bg-neutral-50',
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
