import type { Metadata } from 'next';
import TrackstatPanel from './TrackstatPanel';
import { savedTheme } from './themeServer';

export const metadata: Metadata = { title: 'Trackstat | Seisen Hub', description: 'Connect your library and follow your Pet Simulator 99 inventory and session gains.' };

export default async function TrackstatPage() {
  return <TrackstatPanel initialTheme={await savedTheme()} />;
}
