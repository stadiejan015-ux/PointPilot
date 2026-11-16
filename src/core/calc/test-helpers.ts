import type { Transaction, TransferRoute } from "../model/types";

export function route(overrides: Partial<TransferRoute> & Pick<TransferRoute, "from" | "to">): TransferRoute {
  return {
    id: `${overrides.from}__${overrides.to}`,
    ratio: { from: 1, to: 1 },
    minAmount: null,
    step: null,
    source: "https://example.com",
    asOf: "2026-11-16",
    verified: true,
    ...overrides,
  };
}

let counter = 0;
export function tx(overrides: Partial<Transaction> & Pick<Transaction, "programId" | "delta">): Transaction {
  counter += 1;
  return {
    id: `tx-${counter}`,
    type: overrides.delta > 0 ? "earned" : "redeemed",
    occurredAt: "2026-11-16T10:00:00.000Z",
    ...overrides,
  };
}
