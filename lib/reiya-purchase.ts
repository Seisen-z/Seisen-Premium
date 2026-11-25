export const REIYA_TERMS_VERSION = 'seisen-reiya-2026-11-25';
export const REIYA_PURCHASE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const REIYA_PLANS = {
  monthly: { amount: '3.00', interval: 'MONTH', label: 'Monthly', period: 'month' },
  yearly: { amount: '30.00', interval: 'YEAR', label: 'Yearly', period: 'year' },
} as const;
export type ReiyaPlan = keyof typeof REIYA_PLANS;

export function isReiyaPlan(value: unknown): value is ReiyaPlan {
  return value === 'monthly' || value === 'yearly';
}
