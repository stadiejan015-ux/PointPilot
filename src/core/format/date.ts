const dateFormatter = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
const longDateFormatter = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });

/** ISO-Zeitpunkt → "16.11.2026" */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

/** "2026-11-16" (Stand-Datum) → "16. November 2026" */
export function formatAsOf(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return longDateFormatter.format(new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}

/** Lokales Datum als "JJJJ-MM-TT" (für <input type="date">). */
export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Datum aus <input type="date"> → ISO-Zeitpunkt.
 * Ist es der heutige Tag, wird die aktuelle Uhrzeit genommen (damit die Reihenfolge stimmt),
 * sonst 12:00 Uhr Ortszeit.
 */
export function dateInputToIso(value: string, now: Date): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  if (toDateInputValue(now) === value) return now.toISOString();
  const date = new Date(y, m - 1, d, 12, 0, 0, 0);
  if (Number.isNaN(date.getTime()) || date.getMonth() !== m - 1) return null;
  return date.toISOString();
}
