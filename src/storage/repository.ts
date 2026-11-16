import type { AppData, BackupFile, Settings, Transaction } from "@/core/model";

/**
 * Datenzugriffsschicht. Die UI kennt nur dieses Interface – nicht localStorage.
 * Für einen späteren Umstieg auf Supabase reicht eine zweite Implementierung
 * (z. B. SupabaseRepository) und ein Tausch in src/hooks/use-app-data.tsx.
 *
 * Alle Methoden sind async, auch wenn localStorage synchron ist, damit
 * eine Netzwerk-Implementierung dieselbe Form hat. Schreibende Methoden
 * geben den neuen Gesamtzustand zurück.
 */
export interface DataRepository {
  /** Lädt alle Daten. Beim allerersten Start werden die Startwerte angelegt. */
  load(): Promise<AppData>;
  addTransactions(transactions: Transaction[]): Promise<AppData>;
  deleteTransaction(id: string): Promise<AppData>;
  saveSettings(settings: Settings): Promise<AppData>;
  exportBackup(): Promise<BackupFile>;
  /** Prüft die Datei und ersetzt danach ALLE Daten. */
  importBackup(raw: unknown): Promise<AppData>;
  /** Löscht alles und legt die Startwerte neu an. */
  reset(): Promise<AppData>;
  /** Meldet Änderungen von außen (z. B. anderer Tab). Gibt eine Abmeldefunktion zurück. */
  subscribe?(listener: () => void): () => void;
}

export type StorageErrorKind = "unavailable" | "corrupt" | "quota" | "invalid-data" | "invalid-backup";

export class StorageError extends Error {
  constructor(
    readonly kind: StorageErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "StorageError";
  }
}
