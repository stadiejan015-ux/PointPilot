import type { z } from "zod";
import type {
  appDataSchema,
  backupFileSchema,
  programCategorySchema,
  programSchema,
  programSettingsSchema,
  ratioSchema,
  settingsSchema,
  transactionSchema,
  transactionTypeSchema,
  transferRouteSchema,
} from "./schemas";

export type ProgramId = string;

// Katalog (Repo: data/*.json)
export type ProgramCategory = z.infer<typeof programCategorySchema>;
export type Program = z.infer<typeof programSchema>;
export type Ratio = z.infer<typeof ratioSchema>;
export type TransferRoute = z.infer<typeof transferRouteSchema>;

export interface Catalog {
  programs: Program[];
  routes: TransferRoute[];
}

// Nutzerdaten (localStorage)
export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type ProgramSettings = z.infer<typeof programSettingsSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type AppData = z.infer<typeof appDataSchema>;
export type BackupFile = z.infer<typeof backupFileSchema>;

export type Balances = Record<ProgramId, number>;
