import type { Metadata } from 'next';
import { Inter, Fira_Code } from 'next/font/google';
import './globals.css';
import Dock from '@/components/layout/Dock';
import Footer from '@/components/layout/Footer';
import LoadingScreen from '@/components/layout/LoadingScreen';
import VisitorTracker from '@/components/layout/VisitorTracker';
import CustomCursor from '@/components/ui/CustomCursor';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import ThemeSelector from '@/components/ui/ThemeSelector';
import TabTitleAnimation from '@/components/layout/TabTitleAnimation';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-fira-code',
});

export const metadata: Metadata = {
  title: 'Seisen',
  description:
    'Seisen - Premium scripts and tools for enhanced gaming experiences. Access powerful scripts with advanced features.',
  keywords: 'scripts, gaming, seisen, premium scripts, game scripts, roblox scripts',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico', 
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/favicon.ico',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${firaCode.variable}`} suppressHydrationWarning>
      <body className="min-h-screen" suppressHydrationWarning>
        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            <TabTitleAnimation />
            <LoadingScreen />
            <VisitorTracker />
            <CustomCursor />

            {/* Dock */}
            <Dock />
            
            {/* Theme Selector */}
            <ThemeSelector />
            
            {/* Main Content */}
            <main className="flex-1 pt-14 relative z-10">
              {children}
            </main>
            
            {/* Footer */}
            <footer className="mt-auto">
              <Footer />
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
