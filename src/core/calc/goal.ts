import type { Balances, ProgramId, TransferRoute } from "../model/types";
import { calculateTransfer, sourceAmountForTarget, type TransferResult } from "./transfer";

export type GoalOptionStatus =
  /** Übertragung des ganzen Stands ist möglich und berechenbar. */
  | "ok"
  /** Route existiert, Verhältnis fehlt in der Transfer-Tabelle. */
  | "ratio-unknown"
  /** Stand reicht nicht für die Mindestmenge. */
  | "below-minimum"
  /** Kein Stand in der Quelle. */
  | "no-balance";

export interface GoalSourceOption {
  route: TransferRoute;
  sourceProgramId: ProgramId;
  sourceBalance: number;
  status: GoalOptionStatus;
  /** Ergebnis, wenn der gesamte Stand der Quelle übertragen würde. */
  transfer: TransferResult | null;
  /** Zielpunkte aus dieser Quelle (ganzer Stand). null = nicht berechenbar. */
  pointsReceived: number | null;
  /** Stand im Zielprogramm nach diesem Transfer. */
  totalAfter: number | null;
  /** Was danach noch zur Zielmenge fehlt (0 = Ziel erreicht). */
  stillMissing: number | null;
  /** Quellpunkte, die die Lücke ohne Transfer schließen würden. 0 = keine Lücke. */
  sourceNeededForGap: number | null;
  /** Reicht der Stand der Quelle, um die Lücke allein zu schließen? */
  coversGap: boolean | null;
}

export interface GoalCombined {
  /** Zielpunkte aus allen berechenbaren Quellen zusammen (alle in Einheit des Zielprogramms). */
  pointsReceived: number;
  totalAfter: number;
  stillMissing: number;
  sourceProgramIds: ProgramId[];
  includesUnverified: boolean;
}

export interface GoalResult {
  targetProgramId: ProgramId;
  targetAmount: number;
  currentInTarget: number;
  missingWithoutTransfer: number;
  reachedAlready: boolean;
  options: GoalSourceOption[];
  /** null, wenn keine Quelle berechenbar ist. */
  combined: GoalCombined | null;
}

export interface GoalInput {
  targetProgramId: ProgramId;
  targetAmount: number;
  balances: Balances;
  routes: readonly TransferRoute[];
}

/**
 * Wie nah komme ich an `targetAmount` im Zielprogramm, wenn ich aus meinen
 * anderen Programmen übertrage? Nur direkte Routen (A → Ziel), keine Ketten.
 */
export function calculateGoal(input: GoalInput): GoalResult | null {
  const { targetProgramId, targetAmount, balances, routes } = input;
  if (!Number.isInteger(targetAmount) || targetAmount <= 0) return null;

  const currentInTarget = balances[targetProgramId] ?? 0;
  const gap = Math.max(0, targetAmount - currentInTarget);

  const options = routes
    .filter((r) => r.to === targetProgramId && r.from !== targetProgramId)
    .map((route) => buildOption(route, balances[route.from] ?? 0, currentInTarget, targetAmount, gap));

  const usable = options.filter((o) => o.status === "ok" && o.pointsReceived !== null);
  const combined: GoalCombined | null =
    usable.length === 0
      ? null
      : (() => {
          const pointsReceived = usable.reduce((sum, o) => sum + (o.pointsReceived ?? 0), 0);
          const totalAfter = currentInTarget + pointsReceived;
          return {
            pointsReceived,
            totalAfter,
            stillMissing: Math.max(0, targetAmount - totalAfter),
            sourceProgramIds: usable.map((o) => o.sourceProgramId),
            includesUnverified: usable.some((o) => !o.route.verified),
          };
        })();

  return {
    targetProgramId,
    targetAmount,
    currentInTarget,
    missingWithoutTransfer: gap,
    reachedAlready: gap === 0,
    options,
    combined,
  };
}

function buildOption(
  route: TransferRoute,
  sourceBalance: number,
  currentInTarget: number,
  targetAmount: number,
  gap: number,
): GoalSourceOption {
  const sourceNeededForGap = gap === 0 ? 0 : sourceAmountForTarget(route, gap);
  const coversGap = sourceNeededForGap === null ? null : sourceBalance >= sourceNeededForGap;
  const base = { route, sourceProgramId: route.from, sourceBalance, sourceNeededForGap, coversGap };

  if (sourceBalance <= 0) {
    const received = route.ratio ? 0 : null;
    return {
      ...base,
      status: "no-balance",
      transfer: null,
      pointsReceived: received,
      totalAfter: received === null ? null : currentInTarget,
      stillMissing: received === null ? null : gap,
    };
  }

  const transfer = calculateTransfer(route, sourceBalance);

  if (transfer.status === "ratio-unknown") {
    return { ...base, status: "ratio-unknown", transfer, pointsReceived: null, totalAfter: null, stillMissing: null };
  }

  if (transfer.status === "below-minimum") {
    const received = route.ratio ? 0 : null;
    return {
      ...base,
      status: route.ratio ? "below-minimum" : "ratio-unknown",
      transfer,
      pointsReceived: received,
      totalAfter: received === null ? null : currentInTarget,
      stillMissing: received === null ? null : gap,
    };
  }

  const pointsReceived = transfer.targetPoints ?? 0;
  const totalAfter = currentInTarget + pointsReceived;
  return {
    ...base,
    status: "ok",
    transfer,
    pointsReceived,
    totalAfter,
    stillMissing: Math.max(0, targetAmount - totalAfter),
  };
}
