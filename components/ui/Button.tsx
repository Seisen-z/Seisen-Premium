import { ButtonHTMLAttributes, forwardRef, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, style, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.97]';

    const variantStyles: Record<string, CSSProperties> = {
      primary: {
        backgroundColor: 'var(--accent)',
        color: '#000',
        border: '1px solid var(--accent)',
      },
      secondary: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        color: 'var(--text-secondary)',
        border: '1px solid rgba(255,255,255,0.08)',
      },
      outline: {
        backgroundColor: 'transparent',
        color: 'var(--text-secondary)',
        border: '1px solid rgba(255,255,255,0.12)',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: 'var(--text-muted)',
        border: '1px solid transparent',
      },
    };

    const hoverMap: Record<string, string> = {
      primary:   'hover:brightness-110',
      secondary: 'hover:bg-white/10 hover:text-white hover:border-white/15',
      outline:   'hover:border-[var(--accent)] hover:text-[var(--accent)]',
      ghost:     'hover:text-[var(--text-secondary)]',
    };

    const sizes = {
      sm: 'text-xs px-3.5 py-1.5',
      md: 'text-sm px-4 py-2',
      lg: 'text-sm px-6 py-2.5',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, sizes[size], hoverMap[variant], className)}
        style={{ ...variantStyles[variant], ...style }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
