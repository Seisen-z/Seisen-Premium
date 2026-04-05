// Cart utility — persists to localStorage under 'seisen_cart'
// PayPal-only cart. Each plan can appear once; quantity controls number of keys.

export interface CartItem {
  plan: string;       // 'weekly' | 'monthly' | 'lifetime'
  title: string;      // 'Weekly' | 'Monthly' | 'Lifetime'
  quantity: number;   // 1–10
  pricePerUnit: number; // base price in EUR per unit
  currency: string;   // 'EUR'
}

const CART_KEY = 'seisen_cart';

function isClient(): boolean {
  return typeof window !== 'undefined';
}

export function getCart(): CartItem[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  if (!isClient()) return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function addToCart(item: CartItem): CartItem[] {
  const cart = getCart();
  const existing = cart.find(c => c.plan === item.plan);
  if (existing) {
    // Increase quantity, cap at 10
    existing.quantity = Math.min(10, existing.quantity + item.quantity);
  } else {
    cart.push({ ...item, quantity: Math.min(10, Math.max(1, item.quantity)) });
  }
  saveCart(cart);
  return cart;
}

export function removeFromCart(plan: string): CartItem[] {
  const cart = getCart().filter(c => c.plan !== plan);
  saveCart(cart);
  return cart;
}

export function updateCartItemQuantity(plan: string, quantity: number): CartItem[] {
  const cart = getCart();
  const item = cart.find(c => c.plan === plan);
  if (item) {
    item.quantity = Math.max(1, Math.min(10, quantity));
    if (item.quantity <= 0) return removeFromCart(plan);
  }
  saveCart(cart);
  return cart;
}

export function clearCart(): void {
  if (!isClient()) return;
  localStorage.removeItem(CART_KEY);
}

export function getCartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0);
}

export function getCartCount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}
