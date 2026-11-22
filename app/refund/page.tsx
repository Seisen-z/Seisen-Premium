import type { Metadata } from 'next';
import LegalView from '@/components/legal/LegalView';

export const metadata: Metadata = { title: 'Refund Policy' };

export default function RefundPage() {
  return <LegalView initialTab="refund" />;
}
