'use client';

import { Users } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function PurchaseCounter() {
  const [count, setCount] = useState<string>('0'); // Default/Fallback

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/stats/purchases');
        const data = await res.json();
        if (data.formatted) {
          setCount(data.formatted);
        }
      } catch (err) {
        console.error('Failed to load purchase stats', err);
      }
    };

    fetchCount();
  }, []);

  return (
    <div className="inline-flex items-center gap-2 text-xs animate-fade-in" style={{ color: 'rgba(255,255,255,0.3)' }}>
      <Users className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
      <span>
        <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{count} people</span> have purchased premium
      </span>
    </div>
  );
}
