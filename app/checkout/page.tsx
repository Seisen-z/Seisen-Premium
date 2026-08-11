'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, ArrowLeft, Loader2, AlertCircle, CheckCircle, AlertTriangle, X, ChevronDown } from 'lucide-react';
import { getApiUrl } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
type PaymentMethod = 'paypal' | 'maya' | 'gcash' | 'local_qr';

type CountryQRConfig = {
  code: string;
  name: string;
  currency: string;
  symbol: string;
  qrTypeLabel: string;
  prices: {
    weekly: number;
    monthly: number;
    lifetime: number;
  };
  qrImages: {
    weekly: string;
    monthly: string;
    lifetime: string;
  };
};

type PriceInfo = {
  amount: number;
  currency: string;
  label: string;
  originalLabel?: string;
  period: string;
  billingNote: string;
};

type PlanConfig = {
  title: string;
  description: string;
  badge?: string | null;
  cardColor: string;
  features: string[];
  methods: PaymentMethod[];
  prices: Partial<Record<PaymentMethod, PriceInfo>>;
  isMega?: boolean;
};

type DiscordSession = {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  email: string | null;
  tag: string;
};

const COUNTRY_QR_CONFIGS: Record<string, CountryQRConfig> = {
  usd: {
    code: 'usd',
    name: 'United States (USD)',
    currency: 'USD',
    symbol: '$',
    qrTypeLabel: 'Wise USD',
    prices: { weekly: 3.5, monthly: 7, lifetime: 11.50 },
    qrImages: {
      weekly: '',
      monthly: '',
      lifetime: '/images/wise-qr/lifetime/Wise USD Lifetime.png'
    }
  },
  eur: {
    code: 'eur',
    name: 'Europe (EUR)',
    currency: 'EUR',
    symbol: '€',
    qrTypeLabel: 'Wise Euro',
    prices: { weekly: 3, monthly: 6, lifetime: 10 },
    qrImages: {
      weekly: '',
      monthly: '',
      lifetime: '/images/wise-qr/lifetime/Wise Euro Lifetime.png'
    }
  },
  gbp: {
    code: 'gbp',
    name: 'United Kingdom (GBP)',
    currency: 'GBP',
    symbol: '£',
    qrTypeLabel: 'Wise GBP',
    prices: { weekly: 2.5, monthly: 5, lifetime: 8.50 },
    qrImages: {
      weekly: '',
      monthly: '',
      lifetime: '/images/wise-qr/lifetime/Wise GBP Lifetime.png'
    }
  },
  aud: {
    code: 'aud',
    name: 'Australia (AUD)',
    currency: 'AUD',
    symbol: 'A$',
    qrTypeLabel: 'Wise AUD',
    prices: { weekly: 5, monthly: 10, lifetime: 16.30 },
    qrImages: {
      weekly: '',
      monthly: '',
      lifetime: '/images/wise-qr/lifetime/Wise AUD Lifetime.png'
    }
  },
  cad: {
    code: 'cad',
    name: 'Canada (CAD)',
    currency: 'CAD',
    symbol: 'C$',
    qrTypeLabel: 'Wise CAD',
    prices: { weekly: 5, monthly: 10, lifetime: 16.10 },
    qrImages: {
      weekly: '',
      monthly: '',
      lifetime: '/images/wise-qr/lifetime/Wise CAD Lifetime.png'
    }
  },
  sgd: {
    code: 'sgd',
    name: 'Singapore (SGD)',
    currency: 'SGD',
    symbol: 'S$',
    qrTypeLabel: 'Wise SGD',
    prices: { weekly: 4.5, monthly: 9, lifetime: 15.20 },
    qrImages: {
      weekly: '',
      monthly: '',
      lifetime: '/images/wise-qr/lifetime/Wise SGD Lifetime.png'
    }
  },
  php: {
    code: 'php',
    name: 'Philippines (PHP)',
    currency: 'PHP',
    symbol: '₱',
    qrTypeLabel: 'Wise PHP',
    prices: { weekly: 215, monthly: 430, lifetime: 710 },
    qrImages: {
      weekly: '',
      monthly: '',
      lifetime: '/images/wise-qr/lifetime/Wise Php Lifetime.png'
    }
  },
  idr: {
    code: 'idr',
    name: 'Indonesia (IDR)',
    currency: 'IDR',
    symbol: 'Rp',
    qrTypeLabel: 'Wise IDR',
    prices: { weekly: 55000, monthly: 110000, lifetime: 184000 },
    qrImages: {
      weekly: '',
      monthly: '',
      lifetime: '/images/wise-qr/lifetime/Wise IDR Lifetime.png'
    }
  },
  vnd: {
    code: 'vnd',
    name: 'Vietnam (VND)',
    currency: 'VND',
    symbol: '₫',
    qrTypeLabel: 'Wise VND',
    prices: { weekly: 88000, monthly: 176000, lifetime: 295000 },
    qrImages: {
      weekly: '',
      monthly: '',
      lifetime: '/images/wise-qr/lifetime/Wise VND Lifetime.png'
    }
  },
  hkd: {
    code: 'hkd',
    name: 'Hong Kong (HKD)',
    currency: 'HKD',
    symbol: 'HK$',
    qrTypeLabel: 'Wise HKD',
    prices: { weekly: 27, monthly: 54, lifetime: 90 },
    qrImages: {
      weekly: '',
      monthly: '',
      lifetime: '/images/wise-qr/lifetime/Wise HKD Lifetime.png'
    }
  },
  jpy: {
    code: 'jpy',
    name: 'Japan (JPY)',
    currency: 'JPY',
    symbol: '¥',
    qrTypeLabel: 'Wise JPY',
    prices: { weekly: 475, monthly: 950, lifetime: 1580 },
    qrImages: {
      weekly: '',
      monthly: '',
      lifetime: '/images/wise-qr/lifetime/Wise JPS Lifetime.png'
    }
  },
  cny: {
    code: 'cny',
    name: 'China (CNY)',
    currency: 'CNY',
    symbol: '¥',
    qrTypeLabel: 'Wise CNY',
    prices: { weekly: 25, monthly: 50, lifetime: 83 },
    qrImages: {
      weekly: '',
      monthly: '',
      lifetime: '/images/wise-qr/lifetime/Wise CNY Lifetime.png'
    }
  },
  chf: {
    code: 'chf',
    name: 'Switzerland (CHF)',
    currency: 'CHF',
    symbol: 'CHF',
    qrTypeLabel: 'Wise CHF',
    prices: { weekly: 2.8, monthly: 5.6, lifetime: 9.40 },
    qrImages: {
      weekly: '',
      monthly: '',
      lifetime: '/images/wise-qr/lifetime/Wise CHF Lifetime.png'
    }
  },
  czk: {
    code: 'czk',
    name: 'Czech Republic (CZK)',
    currency: 'CZK',
    symbol: 'Kč',
    qrTypeLabel: 'Wise CZK',
    prices: { weekly: 81, monthly: 162, lifetime: 270 },
    qrImages: {
      weekly: '',
      monthly: '',
      lifetime: '/images/wise-qr/lifetime/Wise CZK Lifetime.png'
    }
  },
  dkk: {
    code: 'dkk',
    name: 'Denmark (DKK)',
    currency: 'DKK',
    symbol: 'kr.',
    qrTypeLabel: 'Wise DKK',
    prices: { weekly: 22, monthly: 45, lifetime: 75 },
    qrImages: {
      weekly: '',
      monthly: '',
      lifetime: '/images/wise-qr/lifetime/Wise DKK Lifetime.png'
    }
  },
  huf: {
    code: 'huf',
    name: 'Hungary (HUF)',
    currency: 'HUF',
    symbol: 'Ft',
    qrTypeLabel: 'Wise HUF',
    prices: { weekly: 1265, monthly: 2530, lifetime: 4220 },
    qrImages: {
      weekly: '',
      monthly: '',
      lifetime: '/images/wise-qr/lifetime/Wise HUF Lifetime.png'
    }
  },
  ils: {
    code: 'ils',
    name: 'Israel (ILS)',
    currency: 'ILS',
    symbol: '₪',
    qrTypeLabel: 'Wise ILS',
    prices: { weekly: 13, monthly: 26, lifetime: 43.50 },
    qrImages: {
      weekly: '',
      monthly: '',
      lifetime: '/images/wise-qr/lifetime/Wise ILS Lifetime.png'
    }
  },
  nok: {
    code: 'nok',
    name: 'Norway (NOK)',
    currency: 'NOK',
    symbol: 'kr',
    qrTypeLabel: 'Wise NOK',
    prices: { weekly: 38, monthly: 76, lifetime: 127 },
    qrImages: {
      weekly: '',
      monthly: '',
      lifetime: '/images/wise-qr/lifetime/Wise NOR Lifetime.png'
    }
  },
  nzd: {
    code: 'nzd',
    name: 'New Zealand (NZD)',
    currency: 'NZD',
    symbol: 'NZ$',
    qrTypeLabel: 'Wise NZD',
    prices: { weekly: 5.5, monthly: 11, lifetime: 17.80 },
    qrImages: {
      weekly: '',
      monthly: '',
      lifetime: '/images/wise-qr/lifetime/Wise NZD Lifetime.png'
    }
  },
  pln: {
    code: 'pln',
    name: 'Poland (PLN)',
    currency: 'PLN',
    symbol: 'zł',
    qrTypeLabel: 'Wise PLN',
    prices: { weekly: 14, monthly: 28, lifetime: 46 },
    qrImages: {
      weekly: '',
      monthly: '',
      lifetime: '/images/wise-qr/lifetime/Wise PLN Lifetime.png'
    }
  },
  sek: {
    code: 'sek',
    name: 'Sweden (SEK)',
    currency: 'SEK',
    symbol: 'kr',
    qrTypeLabel: 'Wise SEK',
    prices: { weekly: 36, monthly: 73, lifetime: 121 },
    qrImages: {
      weekly: '',
      monthly: '',
      lifetime: '/images/wise-qr/lifetime/Wise SEK Lifetime.png'
    }
  },
  ugx: {
    code: 'ugx',
    name: 'Uganda (UGX)',
    currency: 'UGX',
    symbol: 'USh',
    qrTypeLabel: 'Wise UGX',
    prices: { weekly: 13000, monthly: 26000, lifetime: 43500 },
    qrImages: {
      weekly: '',
      monthly: '',
      lifetime: '/images/wise-qr/lifetime/Wise UGX Lifetime.png'
    }
  },
  zar: {
    code: 'zar',
    name: 'South Africa (ZAR)',
    currency: 'ZAR',
    symbol: 'R',
    qrTypeLabel: 'Wise ZAR',
    prices: { weekly: 65, monthly: 130, lifetime: 215 },
    qrImages: {
      weekly: '',
      monthly: '',
      lifetime: '/images/wise-qr/lifetime/Wise ZAR Lifetiem.png'
    }
  },
  aed: {
    code: 'aed',
    name: 'United Arab Emirates (AED)',
    currency: 'AED',
    symbol: 'د.إ',
    qrTypeLabel: 'Wise AED',
    prices: { weekly: 13, monthly: 26, lifetime: 42.50 },
    qrImages: {
      weekly: '',
      monthly: '',
      lifetime: '/images/wise-qr/lifetime/Wise AED Lifetime.png'
    }
  }
};

// ─── Plan Config ──────────────────────────────────────────────────────────────
const PLAN_CONFIG: Record<string, PlanConfig> = {
  weekly: {
    title: 'Weekly',
    description: 'Try it risk-free for a week.',
    badge: '7 Days',
    cardColor: '#b89060',
    features: ['All premium scripts', 'No key system', 'Priority support', 'Early access'],
    methods: ['paypal', 'maya', 'gcash'],
    prices: {
      paypal: { amount: 3,   currency: '€', label: '€3',   period: '/week', billingNote: 'Billed once per week' },
      maya:   { amount: 180, currency: '₱', label: '₱180', period: '/week', billingNote: 'Billed once per week · QR payment via Discord ticket' },
      gcash:  { amount: 180, currency: '₱', label: '₱180', period: '/week', billingNote: 'Billed once per week · QR payment via Discord ticket' },
    },
  },
  monthly: {
    title: 'Monthly',
    description: 'Best for regular script users.',
    badge: '30 Days',
    cardColor: '#a08060',
    features: ['All premium scripts', 'No key system', 'Priority support', 'Early access', 'Exclusive updates'],
    methods: ['paypal', 'maya', 'gcash'],
    prices: {
      paypal: { amount: 6,   currency: '€', label: '€6',    period: '/month',    billingNote: 'Billed once per month' },
      maya:   { amount: 430, currency: '₱', label: '₱430',  period: '/month',    billingNote: 'Billed once per month' },
      gcash:  { amount: 430, currency: '₱', label: '₱430',  period: '/month',    billingNote: 'Billed once per month' },
    },
  },
  lifetime: {
    title: 'Lifetime',
    description: 'Pay once. Access forever.',
    badge: '28% OFF',
    cardColor: '#c9a97a',
    features: ['All premium scripts', 'No key system', 'Priority support', 'Early access', 'Exclusive updates', 'Lifetime access'],
    methods: ['paypal', 'maya', 'gcash', 'local_qr'],
    prices: {
      paypal: { amount: 10,  currency: '€', label: '€10',   originalLabel: '€14',    period: '',          billingNote: 'One-time payment' },
      maya:   { amount: 850, currency: '₱', label: '₱850',  originalLabel: '₱1,000', period: 'one-time',  billingNote: 'One-time payment' },
      gcash:  { amount: 850, currency: '₱', label: '₱850',  originalLabel: '₱1,000', period: 'one-time',  billingNote: 'One-time payment' },
    },
  },
  mega_1month: {
    title: 'Mega Key — 1 Month',
    description: 'For large-scale account farming.',
    cardColor: '#c9a97a',
    isMega: true,
    features: ['1 key — up to 100 tabs', 'No Hardware ID check', 'Any executor, anywhere', 'Equivalent to 10 normal keys', 'Hardware ID bypass built-in', 'Zero device binding restrictions'],
    methods: ['paypal'],
    prices: {
      paypal: { amount: 40, currency: '$', label: '$40', period: '', billingNote: '$40/month' },
    },
  },
  mega_2month: {
    title: 'Mega Key — 2 Months',
    description: 'Best value for large-scale farming.',
    badge: 'Best Value',
    cardColor: '#c9a97a',
    isMega: true,
    features: ['1 key — up to 100 tabs', 'No Hardware ID check', 'Any executor, anywhere', 'Equivalent to 10 normal keys', 'Hardware ID bypass built-in', 'Zero device binding restrictions'],
    methods: ['paypal'],
    prices: {
      paypal: { amount: 70, currency: '$', label: '$70', period: '', billingNote: '$35/month — save $10' },
    },
  },
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028z" />
  </svg>
);

const MayaIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="60" height="60" rx="13" fill="#00B14F"/>
    <g transform="translate(7.5, 15)">
      <path d="M32.4509 0C29.0563 0 25.6029 1.41908 23.3998 3.66813L24.65 6.15245L24.1215 6.57215C21.7858 2.57089 17.4914 0 12.9204 0C5.77684 0 0.00102172 6.21079 0.00102172 13.4868V29.1625C-0.00516045 29.2962 0.0167642 29.4297 0.0653878 29.5545C0.114011 29.6793 0.18827 29.7927 0.283437 29.8874C0.378604 29.9822 0.492584 30.0562 0.618124 30.1047C0.743665 30.1532 0.878017 30.1753 1.0126 30.1694H6.19359C6.44479 30.1694 6.68571 30.0702 6.86333 29.8938C7.04096 29.7173 7.14075 29.4779 7.14075 29.2284V13.3683C7.14075 9.76035 9.34386 6.80364 13.0946 6.80364C16.6067 6.80364 19.1072 9.40464 19.1072 13.2497V26.2641C19.0984 26.393 19.1163 26.5223 19.16 26.6439C19.2036 26.7656 19.272 26.877 19.3608 26.9713C19.4497 27.0656 19.5571 27.1407 19.6764 27.1919C19.7958 27.2431 19.9244 27.2694 20.0544 27.2691H25.0062C25.1362 27.2694 25.2648 27.2431 25.3842 27.1919C25.5035 27.1407 25.6109 27.0656 25.6998 26.9713C25.7886 26.877 25.857 26.7656 25.9006 26.6439C25.9442 26.5223 25.9622 26.393 25.9533 26.2641V13.2497C25.9533 9.40464 28.5732 6.80364 32.0853 6.80364C35.8361 6.80364 37.9198 9.76035 37.9198 13.3683V29.2227C37.9316 29.4796 38.044 29.7218 38.233 29.8976C38.422 30.0734 38.6726 30.1689 38.9314 30.1637H44.0461C44.1808 30.1699 44.3154 30.1481 44.4412 30.0996C44.5669 30.0512 44.6811 29.9773 44.7765 29.8825C44.8719 29.7878 44.9463 29.6743 44.9951 29.5493C45.0438 29.4244 45.0658 29.2907 45.0596 29.1568V13.4868C45.0596 6.21079 39.5224 0 32.4376 0" fill="white"/>
    </g>
  </svg>
);

const GCashIcon = ({ className }: { className?: string }) => (
  <img src="/images/gcash.png" alt="GCash" className={className} style={{ objectFit: 'contain' }} />
);

const WiseIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: '#9FE870' }}>
    <path d="M6.488 7.469L0 15.05h11.585l1.301-3.576H7.922l3.033-3.507.01-.092L8.993 4.48h8.873L10.988 23.405h4.706L24 .595H2.543z"/>
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function readDiscordSession(): DiscordSession | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)discord_session=([^;]+)/);
  if (!match) return null;
  try { return JSON.parse(atob(decodeURIComponent(match[1]))); } catch { return null; }
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  paypal: 'PayPal',
  maya:   'Maya',
  gcash:  'GCash',
  local_qr: 'Wise/Local QR',
};

// ─── Checkout Content ─────────────────────────────────────────────────────────
function CheckoutContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const planKey       = searchParams.get('plan') ?? '';
  const plan          = PLAN_CONFIG[planKey];
  const methodParam   = (searchParams.get('method') ?? 'paypal') as PaymentMethod;

  const [paymentMethod, setPaymentMethod]     = useState<PaymentMethod>(
    plan?.methods.includes(methodParam) ? methodParam : 'paypal'
  );
  const [selectedCountry, setSelectedCountry] = useState<string>('usd');
  const [methodStocks, setMethodStocks]       = useState<Record<string, Record<string, number>>>({});
  const [discordSession, setDiscordSession]   = useState<DiscordSession | null>(null);
  const [tosAccepted, setTosAccepted]         = useState(false);
  const [noRefundAccepted, setNoRefundAccepted] = useState(false);
  const [tosTimer, setTosTimer]               = useState(5);
  const [isProcessing, setIsProcessing]       = useState(false);
  const [showQRModal, setShowQRModal]         = useState(false);
  const [qrZoomed, setQrZoomed]               = useState(false);
  const [statusModal, setStatusModal]         = useState<{
    isOpen: boolean; type: 'success' | 'error'; title: string; message: string; details?: string;
  }>({ isOpen: false, type: 'success', title: '', message: '' });
  const [liveRates, setLiveRates]             = useState<Record<string, number> | null>(null);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch]     = useState('');
  const countryDropdownRef                    = useRef<HTMLDivElement>(null);

  // Redirect invalid plan
  useEffect(() => { if (!plan) router.replace('/premium'); }, []);

  // Load discord session
  useEffect(() => { setDiscordSession(readDiscordSession()); }, []);

  // Load stock
  useEffect(() => {
    fetch('/api/premium-stock')
      .then(r => r.json())
      .then(d => { if (d.methodStocks) setMethodStocks(d.methodStocks); })
      .catch(() => {});
  }, []);

  // Load live exchange rates (free API, no key needed)
  useEffect(() => {
    fetch('/api/exchange-rates')
      .then(r => r.json())
      .then(d => { setLiveRates(d.rates); })
      .catch(() => {});
  }, []);

  // Close country dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setCountryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Handle discord_error return
  useEffect(() => {
    const discordError = searchParams.get('discord_error');
    if (discordError) {
      router.replace(`/checkout?plan=${planKey}`, { scroll: false });
      const messages: Record<string, string> = {
        cancelled:         'Discord login was cancelled.',
        token_failed:      'Discord login failed. Please try again.',
        user_fetch_failed: 'Could not fetch your Discord profile.',
        server_error:      'A server error occurred during Discord login.',
      };
      setStatusModal({ isOpen: true, type: 'error', title: 'Discord Login Failed', message: messages[discordError] || 'Discord login failed.' });
    }
  }, [searchParams]);

  // Handle return from PayPal
  useEffect(() => {
    const token      = searchParams.get('token');
    const megaSource = searchParams.get('megaSource');
    if (token && !isProcessing) {
      router.replace(`/checkout?plan=${planKey}`, { scroll: false });
      if (megaSource === '1') { captureMegaKeyOrder(token); }
      else                    { capturePayPalOrder(token); }
    }
  }, [searchParams]);

  // TOS countdown timer
  useEffect(() => {
    if (!tosAccepted || !noRefundAccepted) { setTosTimer(5); return; }
    const interval = setInterval(() => setTosTimer(t => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, [tosAccepted, noRefundAccepted]);

  if (!plan) return null;

  // ── Live rate price helpers ──────────────────────────────────────────────
  const BASE_EUR: Record<string, number> = { weekly: 3, monthly: 6, lifetime: 10 };

  function roundPrice(amount: number, currency: string): number {
    if (['IDR', 'VND', 'UGX'].includes(currency)) return Math.round(amount / 500) * 500;
    if (['JPY', 'HUF', 'PHP', 'CZK', 'NOK', 'SEK', 'DKK', 'ZAR', 'ILS', 'PLN', 'HKD', 'CNY'].includes(currency))
      return Math.round(amount);
    return Math.round(amount * 100) / 100;
  }

  function getLivePrice(cfg: typeof countryConfig, plan: string): number {
    const baseEUR = BASE_EUR[plan] ?? BASE_EUR.lifetime;
    if (liveRates && liveRates[cfg.currency]) {
      return roundPrice(baseEUR * liveRates[cfg.currency], cfg.currency);
    }
    return cfg.prices[plan as 'weekly' | 'monthly' | 'lifetime'] || 0;
  }

  const countryConfig = COUNTRY_QR_CONFIGS[selectedCountry] || COUNTRY_QR_CONFIGS.usd;
  const liveAmount    = getLivePrice(countryConfig, planKey);
  const priceInfo = paymentMethod === 'local_qr' && countryConfig
    ? {
        amount: liveAmount,
        currency: countryConfig.currency,
        label: `${countryConfig.symbol}${liveAmount.toLocaleString()}`,
        period: plan.prices.paypal!.period,
        billingNote: `One-time payment · QR payment via Discord ticket`
      }
    : (plan.prices[paymentMethod] ?? plan.prices.paypal!);
  const r            = parseInt(plan.cardColor.slice(1, 3), 16);
  const g            = parseInt(plan.cardColor.slice(3, 5), 16);
  const b            = parseInt(plan.cardColor.slice(5, 7), 16);
  const returnUrl    = `/checkout?plan=${planKey}`;

  // Stock for current plan + payment method
  const currentStock = methodStocks[planKey]?.[paymentMethod] ?? null;
  const isOutOfStock = currentStock === 0;
  const canPay       = !!discordSession && tosAccepted && noRefundAccepted && tosTimer === 0 && !isProcessing && !isOutOfStock;
  const stockDisplay = currentStock === null ? null
    : currentStock === 0  ? { text: 'Out of stock',               color: '#f87171', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.2)' }
    : currentStock <= 3   ? { text: `${currentStock} slots left`, color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)' }
    : currentStock <= 10  ? { text: `${currentStock} slots left`, color: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)' }
    :                       { text: `${currentStock} in stock`,   color: '#86efac', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.15)' };

  // ── Payment handlers ────────────────────────────────────────────────────────
  const capturePayPalOrder = async (orderId: string) => {
    setIsProcessing(true);
    try {
      const res  = await fetch(`${getApiUrl()}/api/paypal/capture-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderID: orderId }),
      });
      const data = await res.json();
      if (data.success && data.keys?.length > 0) {
        localStorage.setItem('client_email', data.payerEmail || '');
        localStorage.setItem('client_auth', 'true');
        setStatusModal({ isOpen: true, type: 'success', title: 'Purchase Successful!', message: 'Your key has been generated. Redirecting to receipt...' });
        setTimeout(() => {
          router.push(`/success?${new URLSearchParams({
            orderId: data.transactionId || 'PAYPAL',
            tier: data.tier,
            amount: String(data.amount),
            currency: String(data.currency),
            key: JSON.stringify(data.keys),
            email: data.payerEmail || '',
            payerId: data.payerId || '',
            method: 'paypal',
            date: new Date().toISOString(),
          })}`);
        }, 1200);
      } else {
        let msg = data.junkieError || data.error || 'No key returned from server';
        if (typeof msg === 'string' && msg.trim().startsWith('<')) msg = 'The key service is unavailable. Contact support with your PayPal transaction ID.';
        setStatusModal({ isOpen: true, type: 'error', title: 'Activation Failed', message: msg, details: data.junkieDetails });
        setIsProcessing(false);
      }
    } catch (err: any) {
      setStatusModal({ isOpen: true, type: 'error', title: 'System Error', message: 'An unexpected error occurred.', details: err.message });
      setIsProcessing(false);
    }
  };

  const captureMegaKeyOrder = async (orderId: string) => {
    setIsProcessing(true);
    try {
      const res  = await fetch(`${getApiUrl()}/api/mega-key/capture-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderID: orderId }),
      });
      const data = await res.json();
      if (data.success && data.keys?.length > 0) {
        localStorage.setItem('client_email', data.payerEmail || '');
        localStorage.setItem('client_auth', 'true');
        setStatusModal({ isOpen: true, type: 'success', title: 'Mega Key Purchased!', message: 'Your Mega Key has been generated. Redirecting to receipt...' });
        setTimeout(() => {
          router.push(`/success?${new URLSearchParams({
            orderId: data.transactionId || 'PAYPAL',
            tier: data.tier,
            amount: String(data.amount),
            currency: 'USD',
            key: JSON.stringify(data.keys),
            email: data.payerEmail || '',
            payerId: data.payerId || '',
            method: 'paypal',
            date: new Date().toISOString(),
          })}`);
        }, 1200);
      } else {
        let msg = data.junkieError || data.error || 'No key returned.';
        if (typeof msg === 'string' && msg.trim().startsWith('<')) msg = 'The key service is unavailable. Contact support with your PayPal transaction ID.';
        setStatusModal({ isOpen: true, type: 'error', title: 'Activation Failed', message: msg });
        setIsProcessing(false);
      }
    } catch (err: any) {
      setStatusModal({ isOpen: true, type: 'error', title: 'System Error', message: err.message || 'Unexpected error.' });
      setIsProcessing(false);
    }
  };

  const handlePayPalPay = async () => {
    setIsProcessing(true);
    try {
      const res  = await fetch(`${getApiUrl()}/api/paypal/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: planKey, amount: priceInfo.amount, quantity: 1, currency: 'EUR', description: 'Seisen Hub Premium Access' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusModal({ isOpen: true, type: 'error', title: 'Purchase Blocked', message: data.error || 'Unable to start checkout.' });
        setIsProcessing(false);
        return;
      }
      const approvalLink = data.links?.find((l: any) => l.rel === 'approve');
      if (approvalLink) { window.location.href = approvalLink.href; }
      else {
        setStatusModal({ isOpen: true, type: 'error', title: 'PayPal Error', message: 'Failed to create PayPal order. Please try again.' });
        setIsProcessing(false);
      }
    } catch (err: any) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Connection Error', message: err.message || 'Failed to initiate payment.' });
      setIsProcessing(false);
    }
  };

  const handleMegaPay = async () => {
    setIsProcessing(true);
    try {
      const res  = await fetch(`${getApiUrl()}/api/mega-key/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusModal({ isOpen: true, type: 'error', title: 'Checkout Blocked', message: data.error || 'Unable to start checkout.' });
        setIsProcessing(false);
        return;
      }
      const approvalLink = data.links?.find((l: any) => l.rel === 'approve');
      if (approvalLink) { window.location.href = approvalLink.href; }
      else {
        setStatusModal({ isOpen: true, type: 'error', title: 'PayPal Error', message: 'Failed to create PayPal order.' });
        setIsProcessing(false);
      }
    } catch (err: any) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Connection Error', message: err.message || 'Failed to initiate payment.' });
      setIsProcessing(false);
    }
  };

  const handlePay = () => {
    if (!canPay) return;
    if (plan.isMega)             { handleMegaPay();          return; }
    if (paymentMethod === 'paypal') { handlePayPalPay();     return; }
    setShowQRModal(true);
  };

  const handleDiscordLogout = () => {
    document.cookie = 'discord_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setDiscordSession(null);
  };

  const payButtonLabel = () => {
    if (isProcessing) return 'Processing...';
    const method = METHOD_LABELS[paymentMethod];
    return `Pay ${priceInfo.label} with ${method}`;
  };

  return (
    <div className="min-h-screen pt-14 pb-24 px-6 md:pl-24 md:pr-14 lg:pl-28 lg:pr-20">

      {/* ── Back + header ── */}
      <div className="mb-8">
        <Link
          href="/premium"
          className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'white'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Premium
        </Link>

        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>
            Complete your purchase
          </h1>
          {plan.badge && (
            <span
              className="text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `rgba(${r},${g},${b},0.15)`, color: plan.cardColor, border: `1px solid rgba(${r},${g},${b},0.3)` }}
            >
              {plan.badge}
            </span>
          )}
        </div>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {plan.title} — {plan.description}
        </p>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid md:grid-cols-5 gap-6 lg:gap-10">

        {/* ── Left: Order Summary ── */}
        <div className="md:col-span-2">
          <div
            className="rounded-2xl p-6 sticky top-24"
            style={{
              background: `linear-gradient(160deg, rgba(${r},${g},${b},0.07) 0%, #090909 60%)`,
              border: `1px solid rgba(${r},${g},${b},0.2)`,
            }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-4" style={{ color: `rgba(${r},${g},${b},0.6)` }}>
              Order Summary
            </p>

            {/* Price */}
            <div className="mb-5">
              {priceInfo.originalLabel && (
                <div className="relative inline-flex items-center text-base font-medium mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {priceInfo.originalLabel}
                  <div className="absolute inset-y-[45%] left-0 w-full h-px bg-red-500/60 -rotate-6" />
                </div>
              )}
              <div className="flex items-end gap-1">
                <span className="font-black text-white" style={{ fontSize: '3rem', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {priceInfo.label}
                </span>
                {priceInfo.period && (
                  <span className="text-sm mb-1 ml-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{priceInfo.period}</span>
                )}
              </div>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{priceInfo.billingNote}</p>
            </div>

            {/* Stock indicator */}
            {stockDisplay && (
              <div
                className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 mb-5"
                style={{ backgroundColor: stockDisplay.bg, color: stockDisplay.color, border: `1px solid ${stockDisplay.border}` }}
              >
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: stockDisplay.color }} />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: stockDisplay.color }} />
                </span>
                {stockDisplay.text} via {paymentMethod === 'paypal' ? 'PayPal' : paymentMethod === 'maya' ? 'Maya' : 'GCash'}
              </div>
            )}

            <div className="h-px mb-5" style={{ backgroundColor: `rgba(${r},${g},${b},0.12)` }} />

            {/* Features */}
            <ul className="space-y-2.5">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `rgba(${r},${g},${b},0.15)` }}
                  >
                    <Check className="w-3 h-3" style={{ color: plan.cardColor }} />
                  </div>
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{feature}</span>
                </li>
              ))}
            </ul>

            {/* Price note when method changes */}
            {plan.methods.length > 1 && paymentMethod !== 'paypal' && (
              <p className="text-xs mt-5 pt-5 border-t" style={{ color: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.06)' }}>
                Showing {METHOD_LABELS[paymentMethod]} price. Switch method to compare.
              </p>
            )}
          </div>
        </div>

        {/* ── Right: Payment Flow ── */}
        <div className="md:col-span-3 space-y-4">

          {/* Payment Method */}
          {plan.methods.length > 1 && (
            <div className="rounded-2xl p-5" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-xs font-semibold text-white mb-3">Payment Method</p>
              <div className="flex flex-wrap gap-2">
                {plan.methods.map(method => {
                  const active = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                      style={{
                        backgroundColor: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                        border: active ? '1.5px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.07)',
                        color: active ? 'white' : 'var(--text-muted)',
                      }}
                    >
                      {method === 'paypal' && <img src="/images/paypal.png" alt="PayPal" className="w-4 h-4 object-contain" />}
                      {method === 'maya'   && <MayaIcon className="w-4 h-4 rounded-sm" />}
                      {method === 'gcash'  && <GCashIcon className="w-4 h-4 rounded-sm" />}
                      {method === 'local_qr' && <WiseIcon className="w-4 h-4" />}
                      {METHOD_LABELS[method]}
                    </button>
                  );
                })}
              </div>
              {paymentMethod !== 'paypal' && paymentMethod !== 'local_qr' && plan.prices[paymentMethod] && (
                <p className="text-xs mt-3 pt-3 border-t" style={{ color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  Price in PHP: <strong className="text-white">{plan.prices[paymentMethod]!.label}</strong> · Payment via QR code, Discord ticket required
                </p>
              )}
              {paymentMethod === 'local_qr' && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <label className="text-xs font-semibold text-white block mb-2">Select your Country</label>
                  {(() => {
                    const FLAGS: Record<string, string> = {
                      usd: '🇺🇸', eur: '🇪🇺', gbp: '🇬🇧', aud: '🇦🇺', cad: '🇨🇦',
                      sgd: '🇸🇬', php: '🇵🇭', idr: '🇮🇩', vnd: '🇻🇳', hkd: '🇭🇰',
                      jpy: '🇯🇵', cny: '🇨🇳', chf: '🇨🇭', czk: '🇨🇿', dkk: '🇩🇰',
                      huf: '🇭🇺', ils: '🇮🇱', nok: '🇳🇴', nzd: '🇳🇿', pln: '🇵🇱',
                      sek: '🇸🇪', ugx: '🇺🇬', zar: '🇿🇦', aed: '🇦🇪',
                    };
                    const all = Object.values(COUNTRY_QR_CONFIGS);
                    const filtered = countrySearch
                      ? all.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.currency.toLowerCase().includes(countrySearch.toLowerCase()))
                      : all;
                    const sel = COUNTRY_QR_CONFIGS[selectedCountry];
                    return (
                      <div ref={countryDropdownRef} className="relative">
                        <button
                          type="button"
                          onClick={() => { setCountryDropdownOpen(o => !o); setCountrySearch(''); }}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm text-white transition-all duration-150"
                          style={{
                            backgroundColor: countryDropdownOpen ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
                            border: countryDropdownOpen ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.09)',
                          }}
                        >
                          <span className="flex items-center gap-2.5">
                            <span className="text-base leading-none">{FLAGS[selectedCountry] ?? '🌐'}</span>
                            <span className="font-medium">{sel?.name ?? 'Select country'}</span>
                          </span>
                          <span className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>{sel?.currency}</span>
                            <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200" style={{ color: 'rgba(255,255,255,0.35)', transform: countryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                          </span>
                        </button>
                        {countryDropdownOpen && (
                          <div className="absolute z-50 w-full mt-1.5 rounded-xl overflow-hidden" style={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.75)' }}>
                            <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                              <svg className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                              <input autoFocus type="text" placeholder="Search country or currency..." value={countrySearch} onChange={e => setCountrySearch(e.target.value)} className="w-full bg-transparent text-sm text-white placeholder:text-white/25 outline-none" />
                              {countrySearch && <button type="button" onClick={() => setCountrySearch('')} style={{ color: 'rgba(255,255,255,0.3)' }}><X className="w-3.5 h-3.5" /></button>}
                            </div>
                            <ul className="max-h-60 overflow-y-auto py-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                              {filtered.length === 0 && <li className="px-4 py-4 text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>No countries found</li>}
                              {filtered.map(c => {
                                const active = selectedCountry === c.code;
                                return (
                                  <li key={c.code}>
                                    <button
                                      type="button"
                                      onClick={() => { setSelectedCountry(c.code); setCountryDropdownOpen(false); setCountrySearch(''); }}
                                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors duration-100"
                                      style={{ backgroundColor: active ? 'rgba(255,255,255,0.07)' : 'transparent', color: active ? 'white' : 'rgba(255,255,255,0.65)' }}
                                      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
                                      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                                    >
                                      <span className="flex items-center gap-2.5">
                                        <span className="text-base leading-none w-5 text-center">{FLAGS[c.code] ?? '🌐'}</span>
                                        <span className="font-medium text-left">{c.name}</span>
                                      </span>
                                      <span className="flex items-center gap-1.5 shrink-0 ml-2">
                                        <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>{c.symbol}</span>
                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>{c.currency}</span>
                                        {active && <span className="w-1.5 h-1.5 rounded-full bg-white/50 shrink-0" />}
                                      </span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <p className="text-xs mt-3 text-white/50">
                    Price: <strong className="text-white">{priceInfo.label}</strong> · Local QR payment via {countryConfig.qrTypeLabel}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Discord Gate */}
          <div className="rounded-2xl p-5" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-white">Discord Account</p>
              <span className="text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                Required
              </span>
            </div>

            {discordSession ? (
              <div className="flex items-center gap-3">
                <img
                  src={discordSession.avatar}
                  alt={discordSession.tag}
                  className="w-9 h-9 rounded-full ring-2 ring-[#5865F2]/40 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <DiscordIcon className="w-3.5 h-3.5 text-[#5865F2] flex-shrink-0" />
                    <p className="text-white text-sm font-semibold truncate">{discordSession.tag}</p>
                  </div>
                  <p className="text-[11px] truncate" style={{ color: 'rgba(88,101,242,0.6)' }}>ID: {discordSession.id}</p>
                </div>
                <button
                  onClick={handleDiscordLogout}
                  className="flex-shrink-0 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                  style={{ color: '#f87171', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,68,68,0.15)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,68,68,0.08)'; }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Connect your Discord account to verify your identity and handle any support requests.
                </p>
                <a href={`/api/auth/discord?return=${encodeURIComponent(returnUrl)}`}>
                  <button className="flex items-center gap-2.5 w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#5865F2] hover:bg-[#4752C4] transition-colors shadow-lg shadow-[#5865F2]/20">
                    <DiscordIcon className="w-4 h-4" />
                    Login with Discord
                  </button>
                </a>
              </div>
            )}
          </div>

          {/* Terms of Service */}
          <div className="rounded-2xl p-5 space-y-3" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', opacity: isOutOfStock ? 0.4 : 1, pointerEvents: isOutOfStock ? 'none' : 'auto' }}>
            <p className="text-xs font-semibold text-white">Terms & Conditions</p>

            <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <p className="text-xs font-bold flex items-center gap-2 mb-1" style={{ color: '#f87171' }}>
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> No Refund Policy
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(248,113,113,0.75)' }}>
                All sales are <strong>final</strong>. Once a key is generated, no refund will be issued for any reason.
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl transition-colors" style={{ backgroundColor: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,68,68,0.08)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,68,68,0.04)'; }}
            >
              <input
                type="checkbox"
                checked={noRefundAccepted}
                onChange={e => setNoRefundAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 flex-shrink-0"
              />
              <span className="text-xs leading-relaxed" style={{ color: '#fca5a5' }}>
                I understand all sales are <strong>final</strong> and no refunds will be issued.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.02)'; }}
            >
              <input
                type="checkbox"
                checked={tosAccepted}
                onChange={e => setTosAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 flex-shrink-0"
              />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                I have read and agree to the{' '}
                <a href="/legal" className="underline" style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">
                  Terms of Service
                </a>.
              </span>
            </label>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePay}
            disabled={!canPay}
            className="w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: plan.cardColor,
              color: '#000',
              boxShadow: canPay ? `0 0 32px rgba(${r},${g},${b},0.3)` : 'none',
            }}
            onMouseEnter={e => { if (canPay) (e.currentTarget as HTMLElement).style.filter = 'brightness(0.88)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = 'none'; }}
          >
            {isProcessing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
            ) : isOutOfStock ? (
              'Out of stock — switch payment method'
            ) : tosAccepted && noRefundAccepted && tosTimer > 0 ? (
              `Please wait ${tosTimer}s...`
            ) : !discordSession ? (
              'Connect Discord to continue'
            ) : !tosAccepted || !noRefundAccepted ? (
              'Accept terms to continue'
            ) : (
              <>
                {paymentMethod === 'paypal' && <img src="/images/paypal.png" alt="" className="w-4 h-4 object-contain" />}
                {paymentMethod === 'maya'   && <MayaIcon className="w-4 h-4 rounded-sm" />}
                {paymentMethod === 'gcash'  && <GCashIcon className="w-4 h-4 rounded-sm" />}
                {paymentMethod === 'local_qr' && <WiseIcon className="w-4 h-4" />}
                {payButtonLabel()}
              </>
            )}
          </button>

          <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Secured by PayPal · Protected by Discord verification
          </p>
        </div>
      </div>

      {/* ── Processing Overlay ── */}
      {isProcessing && !statusModal.isOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: plan.cardColor }} />
            <h2 className="text-xl font-bold text-white mb-2">Processing Payment...</h2>
            <p className="text-sm max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
              Do not close this window. This may take a few seconds.
            </p>
          </div>
        </div>
      )}

      {/* ── Status Modal ── */}
      {statusModal.isOpen && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl p-6 text-center" style={{ backgroundColor: '#0e0e0e', border: '1px solid rgba(255,255,255,0.09)' }}>
            <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${
              statusModal.type === 'success' ? '' : 'bg-red-500/20'
            }`} style={statusModal.type === 'success' ? { backgroundColor: `rgba(${r},${g},${b},0.15)` } : {}}>
              {statusModal.type === 'success'
                ? <CheckCircle className="w-7 h-7" style={{ color: plan.cardColor }} />
                : <AlertCircle className="w-7 h-7 text-red-500" />}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{statusModal.title}</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>{statusModal.message}</p>
            {statusModal.details && (
              <div className="rounded-lg p-3 text-left mb-5" style={{ backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Error Details</p>
                <code className="text-xs text-red-400 block break-words">{statusModal.details}</code>
              </div>
            )}
            <button
              onClick={() => setStatusModal(s => ({ ...s, isOpen: false }))}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
              style={statusModal.type === 'success'
                ? { backgroundColor: plan.cardColor, color: '#000' }
                : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {statusModal.type === 'success' ? 'Continue' : 'Close and try again'}
            </button>
          </div>
        </div>
      )}

      {/* ── QR Payment Modal (Maya / GCash) ── */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-0.5" style={{ color: 'var(--text-muted)' }}>
                  {paymentMethod === 'gcash' ? 'GCash' : paymentMethod === 'maya' ? 'Maya' : countryConfig.qrTypeLabel}
                </p>
                <h2 className="font-bold text-white text-base capitalize">{plan.title}</h2>
              </div>
              <button
                onClick={() => setShowQRModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'white'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: `rgba(${r},${g},${b},0.04)` }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Amount to send</p>
              <p className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>
                {priceInfo.label}
              </p>
            </div>

            <div className="px-5 py-6 flex flex-col items-center gap-4">
              <div
                className="w-52 h-52 rounded-xl overflow-hidden cursor-zoom-in relative group"
                style={{ backgroundColor: 'white' }}
                onClick={() => setQrZoomed(true)}
                title="Tap to enlarge"
              >
                <img
                  src={
                    paymentMethod === 'gcash'
                      ? `/images/gcash-qr-${planKey}.jpg`
                      : paymentMethod === 'maya'
                      ? `/images/maya-qr-${planKey}.jpg`
                      : countryConfig.qrImages[planKey as 'weekly' | 'monthly' | 'lifetime']
                  }
                  alt="QR Code"
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100">
                  <span className="text-[10px] font-mono bg-black/60 text-white px-2 py-0.5 rounded">tap to enlarge</span>
                </div>
              </div>

              <div className="w-full space-y-2">
                {[
                  `Scan the QR with your ${
                    paymentMethod === 'gcash'
                      ? 'GCash'
                      : paymentMethod === 'maya'
                      ? 'Maya'
                      : countryConfig.qrTypeLabel
                  } app and send exactly ${priceInfo.label}`,
                  'Screenshot your payment receipt',
                  'Open a ticket in Discord with the screenshot and your Discord ID',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg px-3 py-2.5" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="font-mono text-[10px] pt-0.5 shrink-0" style={{ color: 'var(--text-muted)' }}>0{i + 1}</span>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 pb-5">
              <a
                href="https://discord.gg/F4sAf6z8Ph"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ backgroundColor: '#5865F2' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#4752C4'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#5865F2'; }}
              >
                <DiscordIcon className="w-4 h-4" />
                Open a ticket on Discord
              </a>
            </div>
          </div>
        </div>
      )}

      {/* QR Fullscreen Zoom */}
      {qrZoomed && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black p-4 cursor-zoom-out" onClick={() => setQrZoomed(false)}>
          <div className="flex flex-col items-center gap-3 w-full h-full justify-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
              {paymentMethod === 'gcash'
                ? 'GCash'
                : paymentMethod === 'maya'
                ? 'Maya'
                : countryConfig.qrTypeLabel} — Scan with your app
            </p>
            <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: 'white', width: 'min(92vw, 92vh)', height: 'min(92vw, 92vh)' }}>
              <img
                src={
                  paymentMethod === 'gcash'
                    ? `/images/gcash-qr-${planKey}.jpg`
                    : paymentMethod === 'maya'
                    ? `/images/maya-qr-${planKey}.jpg`
                    : countryConfig.qrImages[planKey as 'weekly' | 'monthly' | 'lifetime']
                }
                alt="QR Code"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Tap anywhere to close</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
