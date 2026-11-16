import { catalog } from "@/core/catalog";
import { LocalStorageRepository } from "./local-storage-repository";
import type { DataRepository } from "./repository";
import { StorageError } from "./repository";

export interface BrowserRepository {
  repository: DataRepository;
  /** Rohdaten zum Sichern, falls der Speicher beschädigt ist (nur bei localStorage). */
  readRaw?: () => string | null;
}

/**
 * Die eine Stelle, an der entschieden wird, wo Daten liegen.
 * Für Supabase: hier eine SupabaseRepository-Instanz zurückgeben.
 */
export function createBrowserRepository(): BrowserRepository {
  let storage: Storage;
  try {
    storage = window.localStorage;
    // Manche Browser werfen erst beim Zugriff (z. B. blockierte Website-Daten).
    storage.getItem("pointpilot:probe");
  } catch {
    throw new StorageError("unavailable", "Der lokale Speicher des Browsers ist nicht verfügbar.");
  }
  const repository = new LocalStorageRepository(storage, {
    programIds: catalog.programs.map((p) => p.id),
    eventTarget: window,
  });
  return { repository, readRaw: () => repository.readRaw() };
}
