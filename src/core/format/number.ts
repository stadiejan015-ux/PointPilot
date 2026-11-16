import type { Ratio } from "../model/types";

const LOCALE = "de-DE";

const pointsFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const euroFormatter = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "EUR" });
const centsFormatter = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percentFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 });

/** 5822 → "5.822" */
export function formatPoints(value: number): string {
  return pointsFormatter.format(value);
}

/** +178 → "+178", −5822 → "−5.822" (mit echtem Minuszeichen) */
export function formatSignedPoints(value: number): string {
  if (value > 0) return `+${formatPoints(value)}`;
  if (value < 0) return `−${formatPoints(Math.abs(value))}`;
  return formatPoints(0);
}

/** 5822 → "58,22 €" */
export function formatEuroFromCents(cents: number): string {
  return euroFormatter.format(cents / 100);
}

/** 1.2345 → "1,23 ct" */
export function formatCentsPerPoint(cents: number): string {
  return `${centsFormatter.format(cents)} ct`;
}

export function formatPercent(value: number): string {
  return `${percentFormatter.format(value)} %`;
}

/** {from: 1, to: 1} → "1 : 1" */
export function formatRatio(ratio: Ratio): string {
  return `${formatPoints(ratio.from)} : ${formatPoints(ratio.to)}`;
}

/**
 * Liest eine ganze, nicht negative Zahl, wie man sie auf Deutsch tippt:
 * "5822", "5.822", "5 822" → 5822. Dezimalstellen ("1,5") sind ungültig.
 * Gibt null zurück, wenn die Eingabe leer oder ungültig ist.
 */
export function parseWholeNumber(input: string): number | null {
  const trimmed = input.trim().replace(/[\s  ']/g, "");
  if (trimmed === "") return null;
  if (/^\d{1,3}(\.\d{3})+$/.test(trimmed)) return Number(trimmed.replace(/\./g, ""));
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  return null;
}

/**
 * Liest eine nicht negative Dezimalzahl in deutscher Schreibweise:
 * "1.234,56" → 1234.56, "12,5" → 12.5, "1.500" → 1500 (Tausenderpunkt),
 * "12.50" → 12.5 (Punkt als Dezimaltrenner, wenn nicht genau 3 Ziffern folgen).
 */
export function parseDecimal(input: string): number | null {
  const trimmed = input.trim().replace(/[\s  €']/g, "");
  if (trimmed === "") return null;

  let normalized: string;
  if (trimmed.includes(",")) {
    if (!/^\d{1,3}(\.\d{3})*,\d+$|^\d+,\d+$|^\d+,$/.test(trimmed)) return null;
    normalized = trimmed.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(trimmed)) {
    normalized = trimmed.replace(/\./g, "");
  } else if (/^\d+(\.\d+)?$/.test(trimmed)) {
    normalized = trimmed;
  } else {
    return null;
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** Euro-Betrag (z. B. aus parseDecimal) → ganze Cent. */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

/** Zahl für ein Eingabefeld in deutscher Schreibweise, ohne Tausenderpunkte: 1.2 → "1,2" */
export function toInputDecimal(value: number | null): string {
  if (value === null) return "";
  return String(value).replace(".", ",");
}
