import { Check } from 'lucide-react';

interface PricingCardProps {
  title: string;
  description?: string;
  badge?: string;
  price: string | number;
  originalPrice?: string | number;
  currency?: string;
  period?: string;
  billingNote?: string;
  features: string[];
  featured?: boolean;
  featuredLabel?: string;
  buttonText: string;
  buttonIcon?: React.ReactNode;
  onButtonClick?: () => void;
  badgeVariant?: 'default' | 'best-value';
  priceIcon?: React.ReactNode;
  cardIcon?: React.ReactNode;
  cardColor?: string;
  stockStatusText?: string;
  stockStatusVariant?: 'in-stock' | 'low-stock' | 'out-of-stock';
  isOutOfStock?: boolean;
  className?: string;
}

export default function PricingCard({
  title,
  description,
  badge,
  price,
  currency = '€',
  period,
  billingNote,
  features,
  featured = false,
  featuredLabel = 'Most Popular',
  buttonText,
  buttonIcon,
  onButtonClick,
  badgeVariant = 'default',
  priceIcon,
  cardIcon,
  cardColor = '#c9a97a',
  originalPrice,
  stockStatusText,
  stockStatusVariant = 'in-stock',
  isOutOfStock = false,
  className = '',
}: PricingCardProps) {
  const stockBg     = stockStatusVariant === 'out-of-stock' ? 'rgba(239,68,68,0.08)' : stockStatusVariant === 'low-stock' ? 'rgba(245,158,11,0.08)' : 'rgba(74,222,128,0.08)';
  const stockColor  = stockStatusVariant === 'out-of-stock' ? '#f87171' : stockStatusVariant === 'low-stock' ? '#fbbf24' : '#4ade80';
  const stockBorder = stockStatusVariant === 'out-of-stock' ? 'rgba(239,68,68,0.2)' : stockStatusVariant === 'low-stock' ? 'rgba(245,158,11,0.2)' : 'rgba(74,222,128,0.2)';

  const r = parseInt(cardColor.slice(1, 3), 16);
  const g = parseInt(cardColor.slice(3, 5), 16);
  const b = parseInt(cardColor.slice(5, 7), 16);

  return (
    <div
      className={`relative flex flex-col h-full rounded-2xl overflow-hidden ${className}`}
      style={featured ? {
        background: `linear-gradient(160deg, rgba(${r},${g},${b},0.07) 0%, #090909 60%)`,
        border: `1.5px solid rgba(${r},${g},${b},0.4)`,
        boxShadow: `0 0 50px rgba(${r},${g},${b},0.12), 0 0 0 1px rgba(${r},${g},${b},0.08) inset`,
      } : {
        background: '#0f0f0f',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Most Popular badge */}
      {featured && (
        <div className="flex justify-center pt-3">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold"
            style={{ backgroundColor: `rgba(${r},${g},${b},0.15)`, color: cardColor, border: `1px solid rgba(${r},${g},${b},0.3)` }}
          >
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 0l1.5 4.5H12L8.25 7.25 9.75 12 6 9.25 2.25 12l1.5-4.75L0 4.5h4.5z" />
            </svg>
            {featuredLabel}
          </span>
        </div>
      )}

      <div className={`flex flex-col flex-1 p-6 ${featured ? 'pt-4' : 'pt-6'}`}>
        {/* Card icon + plan name */}
        <div className="flex items-start gap-3 mb-4">
          {cardIcon && (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `rgba(${r},${g},${b},0.15)`, border: `1px solid rgba(${r},${g},${b},0.25)` }}
            >
              <span style={{ color: cardColor }}>{cardIcon}</span>
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">{title}</h3>
              {badge && (
                <span
                  className="text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded-full"
                  style={
                    badgeVariant === 'best-value'
                      ? { backgroundColor: 'rgba(234,179,8,0.15)', color: '#facc15', border: '1px solid rgba(234,179,8,0.25)' }
                      : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }
                  }
                >
                  {badge}
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs mt-0.5" style={{ color: `rgba(${r},${g},${b},0.75)` }}>{description}</p>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="mb-5">
          <div className="flex items-end gap-2">
            {originalPrice && (
              <div className="relative text-base font-medium mb-1 flex items-center gap-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {priceIcon ? <span className="opacity-50 grayscale">{priceIcon}</span> : <span>{currency}</span>}
                <span>{originalPrice}</span>
                <div className="absolute inset-y-[45%] left-0 w-full h-px bg-red-500/60 -rotate-6" />
              </div>
            )}
            <div className="flex items-start gap-0.5">
              {priceIcon ? (
                <span className="mt-1.5">{priceIcon}</span>
              ) : (
                <span className="text-xl font-medium mt-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{currency}</span>
              )}
              <span className="font-black text-white" style={{ fontSize: '3.25rem', letterSpacing: '-0.04em', lineHeight: 1 }}>{price}</span>
              {period && (
                <span className="text-sm mt-auto mb-1.5 ml-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{period}</span>
              )}
            </div>
          </div>
          {billingNote && (
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{billingNote}</p>
          )}
        </div>

        {/* Divider */}
        <div className="h-px mb-5" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />

        {/* Features */}
        <ul className="space-y-3 mb-6 flex-1">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `rgba(${r},${g},${b},0.18)` }}
              >
                <Check className="w-3 h-3" style={{ color: cardColor }} />
              </div>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Stock */}
        {stockStatusText && (
          <div
            className="mb-4 text-xs font-medium rounded-lg px-3 py-2 text-center"
            style={{ backgroundColor: stockBg, color: stockColor, border: `1px solid ${stockBorder}` }}
          >
            {stockStatusText}
          </div>
        )}

        {/* CTA */}
        {featured ? (
          <button
            onClick={onButtonClick}
            disabled={isOutOfStock}
            className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: cardColor, color: '#000', boxShadow: `0 0 24px rgba(${r},${g},${b},0.3)` }}
            onMouseEnter={e => { if (!isOutOfStock) (e.currentTarget as HTMLElement).style.filter = 'brightness(0.88)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = 'none'; }}
          >
            {buttonIcon}{buttonText}
          </button>
        ) : (
          <button
            onClick={onButtonClick}
            disabled={isOutOfStock}
            className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: `rgba(${r},${g},${b},0.1)`, color: cardColor, border: `1px solid rgba(${r},${g},${b},0.25)` }}
            onMouseEnter={e => { if (!isOutOfStock) { (e.currentTarget as HTMLElement).style.backgroundColor = `rgba(${r},${g},${b},0.18)`; } }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = `rgba(${r},${g},${b},0.1)`; }}
          >
            {buttonIcon}{buttonText}
          </button>
        )}
      </div>
    </div>
  );
}
