import type { Metadata } from 'next';
import AdminPanel from './AdminPanel';
import { savedTheme } from '../themeServer';

export const metadata: Metadata = { title: 'Trackstat Admin | Seisen Hub', robots: { index: false, follow: false } };

export default async function TrackstatAdminPage() {
  return <AdminPanel initialTheme={await savedTheme()} />;
}
