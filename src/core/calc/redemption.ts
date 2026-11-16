export interface RedemptionInput {
  /** Cash-Preis der Leistung in Cent. */
  cashPriceCents: number;
  /** Benötigte Meilen/Punkte. */
  points: number;
  /** Zuzahlung (Steuern, Gebühren, Zuschläge) in Cent. */
  copayCents: number;
}

export type RedemptionValue =
  | { ok: true; valueCents: number; savedCents: number }
  | { ok: false; reason: "points-missing" | "invalid-amount" };

/**
 * Wert pro Punkt in Cent = (Cash-Preis − Zuzahlung) / Meilen.
 * Ist die Zuzahlung höher als der Cash-Preis, wird der Wert negativ.
 */
export function valuePerPointCents(input: RedemptionInput): RedemptionValue {
  const { cashPriceCents, points, copayCents } = input;
  if (!Number.isInteger(points) || points <= 0) return { ok: false, reason: "points-missing" };
  if (!Number.isFinite(cashPriceCents) || !Number.isFinite(copayCents) || cashPriceCents < 0 || copayCents < 0) {
    return { ok: false, reason: "invalid-amount" };
  }
  const savedCents = cashPriceCents - copayCents;
  return { ok: true, valueCents: savedCents / points, savedCents };
}

export type RedemptionRating = "good" | "borderline" | "poor" | "no-threshold";

export interface RedemptionAssessment {
  rating: RedemptionRating;
  /** Ab diesem Wert (ct/Punkt) gilt: lohnt sich. */
  upperBoundCents: number | null;
  /** Unter diesem Wert (ct/Punkt) gilt: schlechte Einlösung. */
  lowerBoundCents: number | null;
}

/** Kleine Toleranz gegen Rundungsfehler bei Gleitkommazahlen (z. B. 1,1 vs. 1,1000000000000001). */
const EPSILON = 1e-9;

/**
 * Bewertung gegen deinen Mindestwert mit einer Zone ± tolerancePct:
 * - lohnt sich:   Wert ≥ Mindestwert × (1 + t)
 * - grenzwertig:  Mindestwert × (1 − t) ≤ Wert < Mindestwert × (1 + t)
 * - schlecht:     Wert < Mindestwert × (1 − t)
 */
export function rateRedemption(
  valueCents: number,
  minValueCents: number | null,
  tolerancePct: number,
): RedemptionAssessment {
  if (minValueCents === null || !Number.isFinite(minValueCents)) {
    return { rating: "no-threshold", upperBoundCents: null, lowerBoundCents: null };
  }
  const t = Math.min(Math.max(tolerancePct, 0), 100) / 100;
  const upperBoundCents = minValueCents * (1 + t);
  const lowerBoundCents = minValueCents * (1 - t);

  let rating: RedemptionRating;
  if (valueCents >= upperBoundCents - EPSILON) rating = "good";
  else if (valueCents >= lowerBoundCents - EPSILON) rating = "borderline";
  else rating = "poor";

  return { rating, upperBoundCents, lowerBoundCents };
}
