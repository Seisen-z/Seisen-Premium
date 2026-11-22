import type { Metadata } from 'next';
import LegalView from '@/components/legal/LegalView';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return <LegalView initialTab="terms" />;
}
