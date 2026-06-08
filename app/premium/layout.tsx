import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Premium',
  description: 'Full access to every Roblox script — no key system, no limits. Weekly, monthly, or lifetime plans.',
  openGraph: {
    title: 'Seisen Premium — No Key System, Full Access',
    description: 'Full access to every Roblox script — no key system, no limits. Weekly, monthly, or lifetime plans.',
  },
  twitter: {
    title: 'Seisen Premium — No Key System, Full Access',
    description: 'Full access to every Roblox script — no key system, no limits. Weekly, monthly, or lifetime plans.',
  },
};

export default function PremiumLayout({ children }: { children: React.ReactNode }) {
  return children;
}
