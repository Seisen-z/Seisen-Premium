'use client';

import { useCart } from '@/lib/client/cart';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function CartBadge() {
  const { count } = useCart();
  if (count === 0) return null;

  return (
    <Link
      href="/cart"
      className="fixed bottom-24 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
      style={{
        backgroundColor: '#c9a97a',
        color: '#000',
        boxShadow: '0 4px 24px rgba(201,169,122,0.35)',
      }}
    >
      <ShoppingCart className="w-4 h-4" />
      <span className="text-sm font-bold">Cart</span>
      <span className="flex items-center justify-center w-5 h-5 rounded-full text-xs font-black"
        style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
        {count}
      </span>
    </Link>
  );
}
