"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Copy, Home, Download, Shield, ShoppingBag, Calendar, CreditCard, Key, Clock, MessageCircle, Gamepad2, Loader2 } from 'lucide-react';
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { copyToClipboard } from "@/lib/utils";
import Link from "next/link";

function GameSelectionModal({
  orderId,
  onDone,
}: {
  orderId: string;
  onDone: () => void;
}) {
  const [games, setGames] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch('/api/games')
      .then((r) => r.json())
      .then((d) => {
        if (d.games) setGames(d.games);
      })
      .catch(() => {
        setGames([
          'Blox Fruits', 'Pet Simulator 99', 'Anime Defenders', 'Fisch',
          'Rivals', 'Slap Battles', 'Murder Mystery 2', 'Da Hood',
          'Brookhaven', 'Arsenal',
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleGame = (game: string) => {
    setSelected((prev) =>
      prev.includes(game) ? prev.filter((g) => g !== game) : [...prev, game]
    );
  };

  const handleSubmit = async () => {
    if (selected.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      await fetch(`/api/orders/${orderId}/game-selection`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ games: selected }),
      });
    } catch {
      // non-critical — proceed regardless
    }
    setSubmitted(true);
    setTimeout(onDone, 1400);
  };

  return (
    /* Full-screen lock — no pointer events outside modal, no close on backdrop click */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#141414] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-4 px-6 pt-6 pb-5 border-b border-[#2a2a2a]">
          <div className="w-12 h-12 rounded-xl accent-bg flex items-center justify-center flex-shrink-0">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">
              One last step before your order!
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">
              Which game(s) will you use this script for? <span className="text-red-400">*Required</span>
            </p>
          </div>
        </div>

        {/* Body */}
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-14 px-6 gap-3">
            <div className="w-16 h-16 rounded-full accent-bg flex items-center justify-center mb-2">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <p className="text-white font-semibold text-xl">All set!</p>
            <p className="text-gray-400 text-sm text-center">Loading your order receipt…</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 className="w-8 h-8 accent-text animate-spin" />
          </div>
        ) : (
          <>
            <div className="px-6 py-4 grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {games.map((game) => {
                const active = selected.includes(game);
                return (
                  <button
                    key={game}
                    onClick={() => toggleGame(game)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                      active
                        ? 'accent-bg text-white border-[var(--accent)]'
                        : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a] hover:text-white'
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        active ? 'border-white bg-white/20' : 'border-gray-600'
                      }`}
                    >
                      {active && <CheckCircle className="w-3 h-3 text-white" />}
                    </span>
                    <span className="truncate">{game}</span>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#2a2a2a]">
              {selected.length === 0 && (
                <p className="text-center text-xs text-red-400 mb-3">
                  Please select at least one game to continue.
                </p>
              )}
              <button
                onClick={handleSubmit}
                disabled={selected.length === 0 || submitting}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  selected.length === 0
                    ? 'bg-[#2a2a2a] text-gray-600 cursor-not-allowed'
                    : 'accent-bg text-white hover:opacity-90 shadow-lg'
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirm &amp; View My Order
                    {selected.length > 0 && ` (${selected.length} selected)`}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Discord session type + reader ──────────────────────────────────────────
type DiscordSession = {
  id: string; username: string; discriminator: string;
  avatar: string; email: string | null; tag: string;
};

function readDiscordSession(): DiscordSession | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)discord_session=([^;]+)/);
  if (!match) return null;
  try { return JSON.parse(atob(decodeURIComponent(match[1]))); }
  catch { return null; }
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const isAdminView = searchParams.get('admin') === '1';
  const [gameModalDone, setGameModalDone] = useState(false);
  const [discordSession, setDiscordSession] = useState<DiscordSession | null>(null);

  useEffect(() => {
    setDiscordSession(readDiscordSession());
  }, []);

  // Extract params and construct mock 'order' object to match client page structure
  const orderId = searchParams.get('orderId');
  const tier = searchParams.get('tier');
  const amount = searchParams.get('amount');
  const currency = searchParams.get('currency');
  const keyParam = searchParams.get('key');
  const email = searchParams.get('email');
  const payerId = searchParams.get('payerId');
  const method = searchParams.get('method'); 
  const dateStr = searchParams.get('date');
  const date = dateStr ? new Date(dateStr) : new Date();

  // Parse keys if it looks like a JSON array or just use the string
  let keys: string[] = [];
  if (keyParam) {
    if (keyParam.startsWith('[')) {
        try {
            keys = JSON.parse(keyParam);
        } catch {
            keys = [keyParam];
        }
    } else {
        keys = [keyParam];
    }
  }

  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedKey(text);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!orderId) {
     return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <Card className="text-center p-8 max-w-md">
                <Shield className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                <h1 className="text-xl font-bold text-white mb-2">Invalid Request</h1>
                <p className="text-gray-500 mb-6">No order details found.</p>
                <Link href="/">
                    <Button>Go Home</Button>
                </Link>
            </Card>
        </div>
     );
  }

  return (
    <div className="min-h-screen py-10 px-4 flex items-center justify-center animate-fade-in">
        {/* Required Game Selection Modal — shown over blurred content until user confirms */}
        {!isAdminView && !gameModalDone && orderId && (
          <GameSelectionModal
            orderId={orderId}
            onDone={() => setGameModalDone(true)}
          />
        )}

        {/* Order content — blurred & non-interactive until game selection is done */}
        <div className={`max-w-5xl w-full space-y-8 transition-all duration-300 ${!isAdminView && !gameModalDone ? 'blur-sm pointer-events-none select-none' : ''}`}>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        Order #{orderId.substring(0, 18)}...
                    </h1>
                    <p className="text-gray-500 text-sm">Placed on {date.toLocaleString()}</p>
                </div>
                <div className="accent-bg accent-text border accent-border px-4 py-2 rounded-lg flex items-center gap-2 font-medium print:border-black print:text-black">
                    <CheckCircle className="w-4 h-4" />
                    Status: COMPLETED
                </div>
            </div>

            {/* Delivered Items (Key) - Prominent at Top */}
            <Card className="p-6 border-l-4 border-l-[var(--accent)] print:border p-6 shadow-none">
                 <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 print:text-black">
                    <Key className="w-5 h-5 accent-text print:text-black" />
                    Delivered Items
                </h3>
                
                {keys.length > 0 ? (
                    <div className="space-y-3">
                         {keys.map((k, i) => (
                            <div key={i} className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 flex items-center justify-between gap-4 group hover-accent-border transition-colors print:bg-white print:border-gray-300">
                                <code className="accent-text font-mono text-lg truncate print:text-black">{k}</code>
                                <button 
                                    onClick={() => handleCopy(k)}
                                    className={`p-2 rounded text-sm font-medium transition-colors flex items-center gap-2 print:hidden ${copiedKey === k ? "accent-bg accent-text" : "bg-[#1f1f1f] text-gray-400 hover:text-white"}`}
                                >
                                    {copiedKey === k ? <CheckCircle className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
                                    {copiedKey === k ? "Copied" : "Copy"}
                                </button>
                            </div>
                         ))}
                    </div>
                ) : (
                     <div className="text-gray-500 italic">No keys found for this order.</div>
                )}
                <p className="text-xs text-gray-500 mt-4">
                    Delivered instantly on {date.toLocaleDateString()}
                </p>
            </Card>

            {/* Discord Account Card */}
            {discordSession && (
              <Card className="p-5 border-l-4 border-l-[#5865F2] bg-[#5865F2]/5 shadow-none print:border">
                <div className="flex items-center gap-4">
                  <img
                    src={discordSession.avatar}
                    alt={discordSession.tag}
                    className="w-12 h-12 rounded-full ring-2 ring-[#5865F2]/40 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[#5865F2] font-semibold uppercase tracking-wide mb-0.5">Linked Discord Account</p>
                    <p className="text-white font-bold text-base truncate">{discordSession.tag}</p>
                    <p className="text-gray-500 text-xs font-mono">ID: {discordSession.id}</p>
                  </div>
                  <svg viewBox="0 0 24 24" fill="#5865F2" className="w-8 h-8 flex-shrink-0 opacity-60">
                    <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028z"/>
                  </svg>
                </div>
              </Card>
            )}

            {/* Premium Redemption Guide - IMPORTANT */}
            <Card className="p-6 border-l-4 border-l-indigo-500 bg-indigo-500/10 print:border shadow-none">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2 print:text-black">
                    <MessageCircle className="w-5 h-5 text-indigo-400 print:text-black" />
                    Activate Your Premium
                </h3>
                <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                    To activate your premium features, you must redeem your key in our verified Discord server. 
                    This step links your Discord account to your premium access.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-black/20 p-4 rounded-lg border border-indigo-500/20">
                    <div className="flex-1">
                        <div className="text-xs text-indigo-300 font-bold uppercase tracking-wider mb-1">Step 1</div>
                        <div className="text-sm text-white">Copy your key from above</div>
                    </div>
                    <div className="hidden sm:block text-gray-600">→</div>
                    <div className="flex-1">
                        <div className="text-xs text-indigo-300 font-bold uppercase tracking-wider mb-1">Step 2</div>
                        <div className="text-sm text-white">Join Discord & Go to Premium Script Channel</div>
                    </div>
                    <div className="hidden sm:block text-gray-600">→</div>
                    <div className="flex-1">
                        <div className="text-xs text-indigo-300 font-bold uppercase tracking-wider mb-1">Step 3</div>
                        <div className="text-sm text-white">Send Key to Redeem</div>
                    </div>
                </div>
                
                <div className="mt-6">
                    <a 
                        href="https://discord.com/channels/1333251917098520628/1421560929425817662" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex"
                    >
                        <Button className="bg-[#5865F2] hover:bg-[#4752C4] text-white border-none shadow-lg shadow-indigo-500/20">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Go to Premium Script Channel
                        </Button>
                    </a>
                </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                
                {/* Order Items */}
                <Card className="p-6 h-full flex flex-col print:border shadow-none">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 print:text-black">
                        <ShoppingBag className="w-5 h-5 accent-text print:text-black" />
                        Order Items
                    </h3>
                    
                    <div className="flex justify-between items-center py-4 border-b border-[#2a2a2a] print:border-gray-300">
                        <div>
                            <div className="font-medium text-white capitalize print:text-black">{tier} Plan</div>
                            <div className="text-sm text-gray-500">Seisen Hub Premium x 1</div>
                        </div>
                        <div className="font-mono text-white print:text-black">
                            {currency === 'ROBUX' ? '' : (currency === 'USD' ? '$' : '€')}
                            {amount}
                            {currency === 'ROBUX' ? ' Robux' : ''}
                        </div>
                    </div>
                    
                    <div className="mt-auto pt-4 flex justify-between items-center border-t border-[#2a2a2a] print:border-gray-300">
                        <span className="text-gray-400">Total</span>
                        <span className="text-xl font-bold text-white print:text-black">
                             {currency === 'ROBUX' ? '' : (currency === 'USD' ? '$' : '€')}
                             {amount}
                             {currency === 'ROBUX' ? ' Robux' : ''}
                        </span>
                    </div>
                </Card>

                {/* Payment Information */}
                <Card className="p-6 print:border shadow-none">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 print:text-black">
                        <CreditCard className="w-5 h-5 accent-text print:text-black" />
                        Payment Information
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Payment Status</span>
                            <span className="text-white capitalize print:text-black">COMPLETED</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Email</span>
                            <span className="text-white truncate max-w-[200px] print:text-black">{email}</span>
                        </div>
                        {discordSession && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Discord</span>
                            <span className="text-[#5865F2] font-medium text-sm">{discordSession.tag}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-gray-500">Transaction ID</span>
                            <span className="text-white font-mono text-sm truncate max-w-[150px] print:text-black">{orderId}</span>
                        </div>
                        {payerId && (
                             <div className="flex justify-between">
                                <span className="text-gray-500">Payer ID</span>
                                <span className="text-white font-mono text-sm print:text-black">{payerId}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-gray-500">Method</span>
                            <span className="text-white capitalize print:text-black">{method || 'N/A'}</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Order Timeline */}
            <Card className="p-6 print:border shadow-none">
                 <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 print:text-black">
                    <Calendar className="w-5 h-5 accent-text print:text-black" />
                    Order Timeline
                </h3>
                
                <div className="space-y-6 ml-2 border-l-2 border-[#2a2a2a] pl-6 relative print:border-gray-300">
                     <div className="relative">
                        <div className="absolute -left-[31px] w-6 h-6 rounded-full bg-[#1a1a1a] border-2 border-[var(--accent)] flex items-center justify-center print:bg-white print:border-black">
                            <CreditCard className="w-3 h-3 accent-text print:text-black" />
                        </div>
                        <div>
                            <h4 className="text-white font-medium print:text-black">Order Placed</h4>
                            <p className="text-sm text-gray-500">{date.toLocaleString()}</p>
                        </div>
                    </div>
                    
                    <div className="relative">
                        <div className="absolute -left-[31px] w-6 h-6 rounded-full flex items-center justify-center shadow-lg print:shadow-none print:bg-black" style={{ backgroundColor: 'var(--accent)', boxShadow: '0 10px 15px -3px rgba(var(--accent-rgb), 0.2)' }}>
                            <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                        <div>
                            <h4 className="text-white font-medium print:text-black">Order Delivered</h4>
                            <p className="text-sm text-gray-500">Instant Delivery</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Footer Buttons */}
            <div className="flex gap-3 print:hidden">
                <Link href="/" className="flex-1">
                    <Button variant="secondary" className="w-full">
                        <Home className="w-4 h-4 mr-2" />
                        Return Home
                    </Button>
                </Link>
                <Button className="flex-1" onClick={handlePrint}>
                    <Download className="w-4 h-4 mr-2" />
                    Save Receipt
                </Button>
            </div>
            
            <div className="text-center pt-8 print:hidden">
                <Link href="/client/support" className="text-gray-500 hover:text-white text-sm underline">
                    Need help with this order? Contact Support
                </Link>
            </div>
        </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center accent-text">
          <Clock className="animate-spin w-8 h-8" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
