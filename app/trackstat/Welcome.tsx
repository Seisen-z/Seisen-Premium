"use client";
import Link from 'next/link';
import { ArrowRight, Download, KeyRound, Loader2, Play } from 'lucide-react';
import { button, card } from './ui';

// Shown until the first account is connected, and again while its first sync is on the way
export default function Welcome({ onConnect, waiting = false }: { onConnect: () => void; waiting?: boolean }) {
  if (waiting) {
    return (
      <div className={`${card} flex items-center gap-4 p-6`} role="status">
        <Loader2 size={22} className="shrink-0 animate-spin text-ts-accent" />
        <div><h3 className="font-semibold text-ts-fg">Waiting for your first sync</h3><p className="mt-1 text-sm leading-6 text-ts-fg/50">Your key is connected. Keep a supported game open with the library running and your data appears here within about 15 seconds.</p></div>
      </div>
    );
  }
  const steps = [
    { icon: Download, title: 'Get the script', text: 'Grab Seisen Hub and load it in Pet Simulator 99, Tap Simulator or Anime Dice.', action: <Link href="/getkey" className={`${button} inline-flex items-center gap-2`}>Get the script <ArrowRight size={14} /></Link> },
    { icon: Play, title: 'Open the Trackstat tab', text: 'In the library window, open Trackstat and press Copy connection key.' },
    { icon: KeyRound, title: 'Paste your key here', text: 'Each Roblox account has its own private key. No website account is needed.', action: <button onClick={onConnect} className={`${button} inline-flex items-center gap-2 border-ts-accent/40 bg-ts-accent/10 text-ts-accent`}>Paste a key <ArrowRight size={14} /></button> },
  ];
  return (
    <div className={`${card} p-6 md:p-8`}>
      <h2 className="text-xl font-semibold text-ts-fg">Start tracking in three steps</h2>
      <p className="mt-1 text-sm text-ts-fg/45">Your inventory, gains and history, in any browser.</p>
      <ol className="mt-6 grid gap-4 md:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step.title} className="flex flex-col rounded-xl bg-ts-fg/[0.03] p-5">
            <span className="mb-4 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-ts-accent/15 text-ts-accent"><step.icon size={17} /></span><span className="font-mono text-xs text-ts-fg/35">Step {i + 1}</span></span>
            <h3 className="font-medium text-ts-fg">{step.title}</h3>
            <p className="mb-5 mt-1 flex-1 text-sm leading-6 text-ts-fg/50">{step.text}</p>
            {step.action}
          </li>
        ))}
      </ol>
    </div>
  );
}
