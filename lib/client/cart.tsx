'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type CartItem = {
  tier: string;
  label: string;
  price: number;   // per-unit EUR
  quantity: number;
};

type CartCtx = {
  items: CartItem[];
  addItem: (tier: string, label: string, price: number) => void;
  removeItem: (tier: string) => void;
  updateQty: (tier: string, qty: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
};

const CartContext = createContext<CartCtx | null>(null);

const STORAGE_KEY = 'seisen_cart';
const MAX_QTY = 5;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items, hydrated]);

  const addItem = useCallback((tier: string, label: string, price: number) => {
    setItems(prev => {
      const existing = prev.find(i => i.tier === tier);
      if (existing) {
        return prev.map(i => i.tier === tier
          ? { ...i, quantity: Math.min(i.quantity + 1, MAX_QTY) }
          : i
        );
      }
      return [...prev, { tier, label, price, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((tier: string) => {
    setItems(prev => prev.filter(i => i.tier !== tier));
  }, []);

  const updateQty = useCallback((tier: string, qty: number) => {
    if (qty < 1) { removeItem(tier); return; }
    setItems(prev => prev.map(i => i.tier === tier
      ? { ...i, quantity: Math.min(qty, MAX_QTY) }
      : i
    ));
  }, [removeItem]);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartCtx {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
