import type { Metadata } from 'next';
import LegalView from '@/components/legal/LegalView';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return <LegalView initialTab="privacy" />;
}
