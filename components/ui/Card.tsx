import { HTMLAttributes, forwardRef, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover' | 'featured';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, style, ...props }, ref) => {
    const baseStyles = 'rounded-xl border transition-all duration-300';

    const variantStyles: Record<string, CSSProperties> = {
      default: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.06)',
      },
      hover: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.06)',
      },
      featured: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderColor: 'rgba(var(--accent-rgb), 0.35)',
        borderLeftWidth: '2px',
        borderLeftColor: 'var(--accent)',
      },
    };

    const hoverMap: Record<string, string> = {
      default:  '',
      hover:    'hover:bg-white/[0.04] hover:border-white/10 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20',
      featured: 'hover:border-[rgba(var(--accent-rgb),0.5)] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20',
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, hoverMap[variant], className)}
        style={{ ...variantStyles[variant], ...style }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
export { Card };

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pb-4', className)} {...props} />;
}
export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}
export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('p-6 pt-4 border-t border-white/[0.06]', className)}
      {...props}
    />
  );
}
