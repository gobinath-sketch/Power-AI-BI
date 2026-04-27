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
        'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' &&
          'border border-[#d8dde7] bg-[#eceef3] text-[#1f2937] shadow-[5px_5px_10px_rgba(168,173,184,0.5),-5px_-5px_10px_rgba(255,255,255,0.95)] hover:bg-[#e7eaf0] active:shadow-[inset_3px_3px_7px_rgba(168,173,184,0.55),inset_-3px_-3px_7px_rgba(255,255,255,0.95)]',
        variant === 'ghost' &&
          'border border-transparent bg-transparent text-[#1f2937] shadow-none hover:border-[#d8dde7] hover:bg-[#eceef3] hover:shadow-[4px_4px_8px_rgba(168,173,184,0.35),-4px_-4px_8px_rgba(255,255,255,0.9)] active:shadow-[inset_2px_2px_5px_rgba(168,173,184,0.45),inset_-2px_-2px_5px_rgba(255,255,255,0.9)]',
        variant === 'outline' &&
          'border border-[#d8dde7] bg-[#f4f5f8] text-[#374151] shadow-[4px_4px_9px_rgba(168,173,184,0.4),-4px_-4px_9px_rgba(255,255,255,0.95)] hover:bg-[#eceef3] active:shadow-[inset_3px_3px_7px_rgba(168,173,184,0.5),inset_-3px_-3px_7px_rgba(255,255,255,0.95)]',
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
