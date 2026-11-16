import {
  appDataSchema,
  settingsSchema,
  transactionSchema,
  type AppData,
  type BackupFile,
  type ProgramId,
  type Settings,
  type Transaction,
} from "@/core/model";
import { createBackup, parseBackup } from "./backup";
import { newId as defaultNewId } from "./ids";
import { StorageError, type DataRepository } from "./repository";
import { createSeedData } from "./seed";

export const STORAGE_KEY = "pointpilot:data";

/** Minimaler Ausschnitt aus der Web-Storage-API – in Tests durch eine Map ersetzbar. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LocalStorageRepositoryOptions {
  programIds: readonly ProgramId[];
  now?: () => Date;
  newId?: () => string;
  /** Für den storage-Event anderer Tabs. Im Browser: window. */
  eventTarget?: Pick<Window, "addEventListener" | "removeEventListener">;
}

export class LocalStorageRepository implements DataRepository {
  private readonly now: () => Date;
  private readonly newId: () => string;

  constructor(
    private readonly store: KeyValueStore,
    private readonly options: LocalStorageRepositoryOptions,
  ) {
    this.now = options.now ?? (() => new Date());
    this.newId = options.newId ?? defaultNewId;
  }

  async load(): Promise<AppData> {
    return this.read();
  }

  async addTransactions(transactions: Transaction[]): Promise<AppData> {
    for (const tx of transactions) {
      const result = transactionSchema.safeParse(tx);
      if (!result.success) {
        throw new StorageError("invalid-data", `Ungültige Buchung: ${result.error.issues[0]?.message ?? ""}`);
      }
    }
    const data = this.read();
    return this.write({ ...data, transactions: [...data.transactions, ...transactions] });
  }

  async deleteTransaction(id: string): Promise<AppData> {
    const data = this.read();
    return this.write({ ...data, transactions: data.transactions.filter((tx) => tx.id !== id) });
  }

  async saveSettings(settings: Settings): Promise<AppData> {
    const result = settingsSchema.safeParse(settings);
    if (!result.success) {
      throw new StorageError("invalid-data", `Ungültige Einstellungen: ${result.error.issues[0]?.message ?? ""}`);
    }
    const data = this.read();
    return this.write({ ...data, settings: result.data });
  }

  async exportBackup(): Promise<BackupFile> {
    return createBackup(this.read(), this.now());
  }

  async importBackup(raw: unknown): Promise<AppData> {
    const parsed = parseBackup(raw);
    if (!parsed.ok) throw new StorageError("invalid-backup", parsed.error);
    return this.write(parsed.backup.data);
  }

  async reset(): Promise<AppData> {
    return this.write(this.seed());
  }

  /** Unveränderter Inhalt des Speichers – zum Sichern, falls er beschädigt ist. */
  readRaw(): string | null {
    try {
      return this.store.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  subscribe(listener: () => void): () => void {
    const target = this.options.eventTarget;
    if (!target) return () => {};
    const handler = (event: Event) => {
      if ((event as StorageEvent).key === STORAGE_KEY || (event as StorageEvent).key === null) listener();
    };
    target.addEventListener("storage", handler);
    return () => target.removeEventListener("storage", handler);
  }

  private seed(): AppData {
    return createSeedData({ programIds: this.options.programIds, now: this.now(), newId: this.newId });
  }

  private read(): AppData {
    let raw: string | null;
    try {
      raw = this.store.getItem(STORAGE_KEY);
    } catch {
      throw new StorageError("unavailable", "Der lokale Speicher des Browsers ist nicht verfügbar.");
    }

    if (raw === null) return this.write(this.seed());

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      throw new StorageError("corrupt", "Die gespeicherten Daten sind beschädigt (kein gültiges JSON).");
    }
    const result = appDataSchema.safeParse(json);
    if (!result.success) {
      throw new StorageError("corrupt", "Die gespeicherten Daten passen nicht zum erwarteten Format.");
    }
    return result.data;
  }

  private write(data: AppData): AppData {
    const result = appDataSchema.safeParse(data);
    if (!result.success) {
      throw new StorageError("invalid-data", `Ungültige Daten: ${result.error.issues[0]?.message ?? ""}`);
    }
    try {
      this.store.setItem(STORAGE_KEY, JSON.stringify(result.data));
    } catch (error) {
      const quota = error instanceof Error && /quota/i.test(error.name + error.message);
      throw new StorageError(
        quota ? "quota" : "unavailable",
        quota ? "Der lokale Speicher ist voll." : "Speichern im Browser ist nicht möglich (privater Modus?).",
      );
    }
    return result.data;
  }
}
