import type { Ratio, TransferRoute } from "../model/types";

export type TransferStatus =
  /** Berechnung möglich. */
  | "ok"
  /** Route bekannt, aber kein Verhältnis hinterlegt. */
  | "ratio-unknown"
  /** Menge liegt unter der (effektiven) Mindestmenge. */
  | "below-minimum"
  /** Keine gültige Menge (leer, negativ, keine ganze Zahl). */
  | "invalid-amount";

export interface TransferResult {
  status: TransferStatus;
  requestedAmount: number;
  /** Tatsächlich übertragbare Quellpunkte (abgerundet auf step). */
  usableAmount: number;
  /** Quellpunkte, die wegen step nicht übertragen werden können. */
  remainder: number;
  /** Zielpunkte, abgerundet. null, wenn das Verhältnis unbekannt ist. */
  targetPoints: number | null;
  /** Kleinste übertragbare Menge unter Berücksichtigung von minAmount und step. */
  effectiveMinimum: number;
  ratio: Ratio | null;
  verified: boolean;
}

function stepOf(route: TransferRoute): number {
  return route.step ?? 1;
}

/** Kleinste Menge, die sowohl minAmount erfüllt als auch ein Vielfaches von step ist. */
export function effectiveMinimum(route: TransferRoute): number {
  const step = stepOf(route);
  const min = Math.max(route.minAmount ?? 1, 1);
  return Math.ceil(min / step) * step;
}

/** Zielpunkte für eine Quellmenge – immer abgerundet, nie zu optimistisch. */
export function convert(amount: number, ratio: Ratio): number {
  return Math.floor((amount * ratio.to) / ratio.from);
}

/**
 * Was kommt beim Ziel an, wenn ich `amount` Quellpunkte übertrage?
 * Rechnet nur – führt nichts aus.
 */
export function calculateTransfer(route: TransferRoute, amount: number): TransferResult {
  const base = {
    requestedAmount: amount,
    effectiveMinimum: effectiveMinimum(route),
    ratio: route.ratio,
    verified: route.verified,
  };

  if (!Number.isInteger(amount) || amount <= 0) {
    return { ...base, status: "invalid-amount", usableAmount: 0, remainder: 0, targetPoints: null };
  }

  if (amount < base.effectiveMinimum) {
    return {
      ...base,
      status: "below-minimum",
      usableAmount: 0,
      remainder: amount,
      targetPoints: route.ratio ? 0 : null,
    };
  }

  const step = stepOf(route);
  const usableAmount = Math.floor(amount / step) * step;
  const remainder = amount - usableAmount;

  if (route.ratio === null) {
    return { ...base, status: "ratio-unknown", usableAmount, remainder, targetPoints: null };
  }

  return {
    ...base,
    status: "ok",
    usableAmount,
    remainder,
    targetPoints: convert(usableAmount, route.ratio),
  };
}

/**
 * Wie viele Quellpunkte braucht es mindestens, damit beim Ziel `targetPoints` ankommen?
 * Berücksichtigt Mindestmenge und step. null, wenn das Verhältnis unbekannt ist.
 */
export function sourceAmountForTarget(route: TransferRoute, targetPoints: number): number | null {
  if (route.ratio === null) return null;
  if (targetPoints <= 0) return 0;
  const step = stepOf(route);
  const raw = Math.ceil((targetPoints * route.ratio.from) / route.ratio.to);
  const stepped = Math.ceil(raw / step) * step;
  return Math.max(stepped, effectiveMinimum(route));
}
