import { cn } from "@/lib/utils";

/** Bildmarke: Kompassnadel auf Navy – „Pilot“ für Punkte. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <defs>
        <linearGradient id="pp-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1b2f57" />
          <stop offset="1" stopColor="#0a1530" />
        </linearGradient>
        <linearGradient id="pp-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3dca4" />
          <stop offset="1" stopColor="#c9a456" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="url(#pp-bg)" stroke="#2c4374" />
      <circle cx="16" cy="16" r="9.5" fill="none" stroke="#8fb3ff" strokeOpacity="0.35" strokeWidth="1.2" />
      <path d="M22.5 9.5 L17.6 17.6 L9.5 22.5 L14.4 14.4 Z" fill="url(#pp-gold)" />
      <path d="M22.5 9.5 L17.6 17.6 L14.4 14.4 Z" fill="#fff4d6" fillOpacity="0.55" />
      <circle cx="16" cy="16" r="1.4" fill="#0a1530" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      {!compact ? (
        <span className="text-[17px] font-semibold tracking-tight">
          Point<span className="text-gold">Pilot</span>
        </span>
      ) : null}
    </span>
  );
}
