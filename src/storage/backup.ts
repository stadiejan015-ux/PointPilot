import { backupFileSchema, SCHEMA_VERSION, type AppData, type BackupFile } from "@/core/model";
import { toDateInputValue } from "@/core/format";

export function createBackup(data: AppData, now: Date): BackupFile {
  return { app: "pointpilot", schemaVersion: SCHEMA_VERSION, exportedAt: now.toISOString(), data };
}

export function backupFileName(now: Date): string {
  return `pointpilot-backup-${toDateInputValue(now)}.json`;
}

export type BackupParseResult = { ok: true; backup: BackupFile } | { ok: false; error: string };

/** Prüft ein bereits geparstes Objekt. */
export function parseBackup(raw: unknown): BackupParseResult {
  if (typeof raw !== "object" || raw === null) return { ok: false, error: "Die Datei enthält kein gültiges Backup." };
  const candidate = raw as Record<string, unknown>;
  if (candidate.app !== "pointpilot") {
    return { ok: false, error: "Das ist kein PointPilot-Backup." };
  }
  if (candidate.schemaVersion !== SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Backup-Version ${String(candidate.schemaVersion)} wird nicht unterstützt (erwartet: ${SCHEMA_VERSION}).`,
    };
  }
  const result = backupFileSchema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    const where = first?.path.length ? ` (bei ${first.path.join(".")})` : "";
    return { ok: false, error: `Das Backup ist beschädigt${where}: ${first?.message ?? "unbekannter Fehler"}` };
  }
  return { ok: true, backup: result.data };
}

/** Prüft den Text einer hochgeladenen Datei. */
export function parseBackupText(text: string): BackupParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "Die Datei ist kein gültiges JSON." };
  }
  return parseBackup(raw);
}
