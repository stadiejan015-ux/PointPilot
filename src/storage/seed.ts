import { SCHEMA_VERSION, type AppData, type ProgramId, type Settings, type Transaction } from "@/core/model";

/** Startwerte beim ersten Öffnen. Programme mit 0 brauchen keine Buchung. */
export const START_BALANCES: Record<ProgramId, number> = {
  payback: 5822,
  revolut: 5510,
  "miles-and-more": 0,
  "flying-blue": 0,
  avios: 0,
};

export const DEFAULT_BORDERLINE_TOLERANCE_PCT = 10;

export function createDefaultSettings(programIds: readonly ProgramId[]): Settings {
  const programs: Settings["programs"] = {};
  for (const id of programIds) programs[id] = { pointValueCents: null, minRedemptionCents: null };
  return { programs, borderlineTolerancePct: DEFAULT_BORDERLINE_TOLERANCE_PCT };
}

export interface SeedOptions {
  programIds: readonly ProgramId[];
  now: Date;
  newId: () => string;
}

export function createSeedData({ programIds, now, newId }: SeedOptions): AppData {
  const occurredAt = now.toISOString();
  const transactions: Transaction[] = [];
  for (const id of programIds) {
    const amount = START_BALANCES[id] ?? 0;
    if (amount === 0) continue;
    transactions.push({ id: newId(), programId: id, type: "correction", delta: amount, occurredAt, note: "Startbestand" });
  }
  return { schemaVersion: SCHEMA_VERSION, transactions, settings: createDefaultSettings(programIds) };
}
