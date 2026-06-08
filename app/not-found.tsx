'use client';

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: 'var(--accent)' }}>404</p>
        <h1
          className="font-bold text-white leading-none mb-4"
          style={{ fontSize: 'clamp(6rem, 20vw, 14rem)', letterSpacing: '-0.05em', color: 'rgba(255,255,255,0.07)' }}
        >
          404
        </h1>
        <h2 className="text-2xl font-bold text-white mb-3 -mt-6" style={{ letterSpacing: '-0.02em' }}>Page not found</h2>
        <p className="text-sm mb-10 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center gap-3 justify-center">
          <Link href="/">
            <Button>
              <Home className="w-4 h-4" /> Go Home
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" /> Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
