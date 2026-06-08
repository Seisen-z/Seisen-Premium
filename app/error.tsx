'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
          Something went wrong
        </h2>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          An unexpected error occurred. Try refreshing, or go back home.
        </p>

        <div className="flex items-center gap-3 justify-center">
          <Button onClick={reset}>
            <RefreshCw className="w-4 h-4" /> Try Again
          </Button>
          <Link href="/">
            <Button variant="outline">
              <Home className="w-4 h-4" /> Go Home
            </Button>
          </Link>
        </div>

        {error.digest && (
          <p className="text-xs mt-6 tabular-nums" style={{ color: 'rgba(255,255,255,0.15)' }}>
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
