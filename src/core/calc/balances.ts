import type { Balances, ProgramId, Transaction, TransactionType } from "../model/types";

/**
 * Der Stand eines Programms ist immer die Summe seiner Buchungen.
 * Es gibt keinen separat gespeicherten Stand, der davon abweichen könnte.
 */
export function balanceOf(transactions: readonly Transaction[], programId: ProgramId): number {
  let sum = 0;
  for (const tx of transactions) {
    if (tx.programId === programId) sum += tx.delta;
  }
  return sum;
}

/** Stände je Programm. Programme ohne Buchung stehen auf 0. */
export function balancesByProgram(
  transactions: readonly Transaction[],
  programIds: readonly ProgramId[],
): Balances {
  const balances: Balances = {};
  for (const id of programIds) balances[id] = 0;
  for (const tx of transactions) {
    balances[tx.programId] = (balances[tx.programId] ?? 0) + tx.delta;
  }
  return balances;
}

export type BalanceChangeCheck =
  | { ok: true; delta: number }
  | { ok: false; reason: "not-integer" | "negative" | "unchanged" };

/** Differenz zwischen aktuellem und neu eingegebenem Stand. */
export function deltaForNewBalance(current: number, next: number): BalanceChangeCheck {
  if (!Number.isInteger(next)) return { ok: false, reason: "not-integer" };
  if (next < 0) return { ok: false, reason: "negative" };
  const delta = next - current;
  if (delta === 0) return { ok: false, reason: "unchanged" };
  return { ok: true, delta };
}

/** Welche Buchungsarten zu einer Änderung passen. Die erste ist die Vorauswahl. */
export function allowedTypesForDelta(delta: number): TransactionType[] {
  if (delta > 0) return ["earned", "purchased", "transferred", "correction"];
  if (delta < 0) return ["redeemed", "transferred", "correction"];
  return [];
}

export function suggestedTypeForDelta(delta: number): TransactionType | null {
  return allowedTypesForDelta(delta)[0] ?? null;
}

/** Neueste zuerst. Bei gleichem Zeitpunkt bleibt die spätere Erfassung vorn. */
export function sortNewestFirst(transactions: readonly Transaction[]): Transaction[] {
  return transactions
    .map((tx, index) => ({ tx, index }))
    .sort((a, b) => {
      const byTime = Date.parse(b.tx.occurredAt) - Date.parse(a.tx.occurredAt);
      return byTime !== 0 ? byTime : b.index - a.index;
    })
    .map(({ tx }) => tx);
}

export function recentTransactions(transactions: readonly Transaction[], limit: number): Transaction[] {
  return sortNewestFirst(transactions).slice(0, Math.max(0, limit));
}

/** Stand des jeweiligen Programms direkt nach jeder Buchung (chronologisch gerechnet). */
export function balanceAfterEach(transactions: readonly Transaction[]): Map<string, number> {
  const chronological = sortNewestFirst(transactions).reverse();
  const running: Balances = {};
  const result = new Map<string, number>();
  for (const tx of chronological) {
    const next = (running[tx.programId] ?? 0) + tx.delta;
    running[tx.programId] = next;
    result.set(tx.id, next);
  }
  return result;
}
