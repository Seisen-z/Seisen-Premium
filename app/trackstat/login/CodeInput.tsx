"use client";
import { useEffect, useRef } from 'react';

export default function CodeInput({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled: boolean }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => { inputs.current[0]?.focus(); }, []);
  function fill(index: number, raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 6);
    if (raw && !digits) return;
    const start = digits.length === 6 ? 0 : index;
    const next = value.padEnd(6, ' ').split('');
    if (!digits) next[index] = ' ';
    else for (let i = 0; i < digits.length && start + i < 6; i++) next[start + i] = digits[i];
    onChange(next.join('').trimEnd());
    if (digits) inputs.current[Math.min(start + digits.length, 5)]?.focus();
  }
  return <fieldset disabled={disabled}>
    <legend className="mb-2 text-xs text-ts-fg/60">Verification code</legend>
    <div className="grid grid-cols-6 gap-2" aria-label="Six-digit verification code">
      {Array.from({ length: 6 }, (_, index) => <input key={index} ref={node => { inputs.current[index] = node; }}
        aria-label={`Digit ${index + 1} of 6`} type="text" inputMode="numeric" autoComplete={index === 0 ? 'one-time-code' : 'off'}
        pattern="[0-9]" required maxLength={index === 0 ? 6 : 1} value={(value[index] ?? '').trim()} disabled={disabled}
        onFocus={event => event.currentTarget.select()}
        onChange={event => fill(index, event.target.value)}
        onPaste={event => { event.preventDefault(); fill(index, event.clipboardData.getData('text')); }}
        onKeyDown={event => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault(); inputs.current[Math.max(0, Math.min(5, index + (event.key === 'ArrowLeft' ? -1 : 1)))]?.focus();
          } else if (event.key === 'Backspace' && !(value[index] ?? '').trim() && index > 0) {
            event.preventDefault(); fill(index - 1, ''); inputs.current[index - 1]?.focus();
          }
        }}
        className="h-12 w-full min-w-0 rounded-lg border border-ts-fg/15 bg-ts-inset text-center font-mono text-xl text-ts-fg outline-none transition-colors focus:border-ts-accent focus:ring-2 focus:ring-ts-accent/15 disabled:opacity-50" />)}
    </div>
  </fieldset>;
}
