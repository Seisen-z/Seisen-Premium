"use client";
import { useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { button, card } from './ui';
import type { Settings } from './settings';

const pill = (on: boolean) => `rounded-lg px-3 py-1.5 text-sm transition-colors ${on ? 'bg-ts-accent font-medium text-ts-accent-fg' : 'bg-ts-fg/[0.05] text-ts-fg/60 hover:text-ts-fg'}`;

function Row({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4">
      <div className="min-w-0 basis-64 flex-1"><p className="text-sm font-medium text-ts-fg">{title}</p><p className="mt-0.5 text-xs leading-5 text-ts-fg/45">{hint}</p></div>
      <div className="flex gap-1">{children}</div>
    </div>
  );
}

export default function SettingsPage({ settings, update, onClearData, children }: { settings: Settings; update: (change: Partial<Settings>) => void; onClearData: () => void; children?: ReactNode }) {
  const [cleared, setCleared] = useState(false);
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div><h2 className="text-xl font-semibold text-ts-fg">Settings</h2><p className="mt-0.5 text-xs text-ts-fg/40">Saved in this browser only.</p></div>
      <div className={`${card} divide-y divide-ts-fg/[0.06] px-5`}>
        <Row title="Number format" hint="Show large numbers as 1.5K or in full, like 1,500.">
          <button aria-pressed={!settings.fullNumbers} onClick={() => update({ fullNumbers: false })} className={pill(!settings.fullNumbers)}>1.5K</button>
          <button aria-pressed={settings.fullNumbers} onClick={() => update({ fullNumbers: true })} className={pill(settings.fullNumbers)}>1,500</button>
        </Row>
        <Row title="Refresh speed" hint="While a library is running the page refreshes every 15 seconds. Relaxed uses every 30 seconds and downloads half as much.">
          <button aria-pressed={!settings.relaxedRefresh} onClick={() => update({ relaxedRefresh: false })} className={pill(!settings.relaxedRefresh)}>Normal</button>
          <button aria-pressed={settings.relaxedRefresh} onClick={() => update({ relaxedRefresh: true })} className={pill(settings.relaxedRefresh)}>Relaxed</button>
        </Row>
        <Row title="Sidebar" hint="Collapse the sidebar to icons to leave more room for the page.">
          <button aria-pressed={!settings.collapsed} onClick={() => update({ collapsed: false })} className={pill(!settings.collapsed)}>Expanded</button>
          <button aria-pressed={settings.collapsed} onClick={() => update({ collapsed: true })} className={pill(settings.collapsed)}>Collapsed</button>
        </Row>
        <Row title="Account names and order" hint="Go back to the Roblox names and the default order.">
          <button onClick={() => update({ names: {}, order: [] })} className={button}>Reset</button>
        </Row>
        <Row title="Saved data" hint="Remove the copy of your accounts this browser keeps for faster loading. It is downloaded again on the next visit.">
          <button onClick={() => { onClearData(); setCleared(true); }} className={`${button} inline-flex items-center gap-2`}>{cleared && <Check size={14} />}{cleared ? 'Cleared' : 'Clear'}</button>
        </Row>
      </div>
      {children}
    </div>
  );
}
