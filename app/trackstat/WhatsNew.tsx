"use client";
import { card } from './ui';
import { trackstatChangelog } from './changelog';

export default function WhatsNew() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div><h2 className="text-xl font-semibold text-ts-fg">What&apos;s new</h2><p className="mt-0.5 text-xs text-ts-fg/40">Recent changes to Trackstat.</p></div>
      {trackstatChangelog.map(entry => (
        <div key={entry.date} className={`${card} p-5`}>
          <p className="font-mono text-xs text-ts-accent">{entry.date}</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-ts-fg/70">{entry.items.map(item => <li key={item} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ts-accent/60" />{item}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}
