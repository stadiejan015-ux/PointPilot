import type { ProgramCategory, TransactionType } from "./types";

/** Deutsche Bezeichnungen – zentral, damit UI und Export dieselben Wörter nutzen. */
export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  earned: "gesammelt",
  transferred: "übertragen",
  redeemed: "eingelöst",
  purchased: "gekauft",
  correction: "Korrektur",
};

export const TRANSACTION_TYPES: TransactionType[] = ["earned", "transferred", "redeemed", "purchased", "correction"];

export const PROGRAM_CATEGORY_LABELS: Record<ProgramCategory, string> = {
  bank: "Bank",
  retail: "Bonusprogramm",
  airline: "Airline",
  hotel: "Hotel",
  other: "Sonstiges",
};
