import { describe, expect, it } from "vitest";
import { balancesByProgram } from "@/core/calc";
import type { Transaction } from "@/core/model";
import { backupFileName, parseBackupText } from "./backup";
import { LocalStorageRepository, STORAGE_KEY, type KeyValueStore } from "./local-storage-repository";
import { StorageError } from "./repository";

const PROGRAMS = ["payback", "revolut", "miles-and-more", "flying-blue", "avios"];
const NOW = new Date("2026-11-16T09:00:00.000Z");

class MemoryStore implements KeyValueStore {
  map = new Map<string, string>();
  failWrites: Error | null = null;
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.failWrites) throw this.failWrites;
    this.map.set(key, value);
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
}

function setup() {
  const store = new MemoryStore();
  let n = 0;
  const repo = new LocalStorageRepository(store, {
    programIds: PROGRAMS,
    now: () => NOW,
    newId: () => `id-${++n}`,
  });
  return { store, repo };
}

const tx = (overrides: Partial<Transaction>): Transaction => ({
  id: "t1",
  programId: "payback",
  type: "earned",
  delta: 178,
  occurredAt: "2026-11-16T10:00:00.000Z",
  ...overrides,
});

describe("Erster Start", () => {
  it("legt die Startwerte als Korrektur-Buchungen 'Startbestand' an", async () => {
    const { repo, store } = setup();
    const data = await repo.load();
    expect(balancesByProgram(data.transactions, PROGRAMS)).toEqual({
      payback: 5822,
      revolut: 5510,
      "miles-and-more": 0,
      "flying-blue": 0,
      avios: 0,
    });
    expect(data.transactions).toHaveLength(2);
    expect(data.transactions.every((t) => t.type === "correction" && t.note === "Startbestand")).toBe(true);
    expect(data.settings.borderlineTolerancePct).toBe(10);
    expect(data.settings.programs.payback).toEqual({ pointValueCents: null, minRedemptionCents: null });
    expect(store.map.has(STORAGE_KEY)).toBe(true);
  });

  it("legt die Startwerte nur einmal an", async () => {
    const { repo } = setup();
    await repo.load();
    const again = await repo.load();
    expect(again.transactions).toHaveLength(2);
  });
});

describe("Buchungen und Einstellungen", () => {
  it("speichert Buchungen dauerhaft", async () => {
    const { repo, store } = setup();
    await repo.load();
    await repo.addTransactions([tx({ id: "a" })]);
    const fresh = new LocalStorageRepository(store, { programIds: PROGRAMS });
    const data = await fresh.load();
    expect(balancesByProgram(data.transactions, PROGRAMS).payback).toBe(6000);
  });

  it("lehnt ungültige Buchungen ab und lässt die Daten unverändert", async () => {
    const { repo } = setup();
    await repo.load();
    await expect(repo.addTransactions([tx({ delta: 0 })])).rejects.toBeInstanceOf(StorageError);
    await expect(repo.addTransactions([tx({ delta: 1.5 })])).rejects.toThrow(/Ungültige Buchung/);
    expect((await repo.load()).transactions).toHaveLength(2);
  });

  it("löscht eine Buchung", async () => {
    const { repo } = setup();
    await repo.load();
    await repo.addTransactions([tx({ id: "weg" })]);
    const data = await repo.deleteTransaction("weg");
    expect(data.transactions.find((t) => t.id === "weg")).toBeUndefined();
  });

  it("speichert Einstellungen und prüft sie", async () => {
    const { repo } = setup();
    const data = await repo.load();
    const settings = {
      ...data.settings,
      programs: { ...data.settings.programs, payback: { pointValueCents: 1, minRedemptionCents: 0.8 } },
    };
    expect((await repo.saveSettings(settings)).settings.programs.payback?.pointValueCents).toBe(1);
    await expect(repo.saveSettings({ ...settings, borderlineTolerancePct: -5 })).rejects.toBeInstanceOf(StorageError);
  });
});

describe("Fehlerfälle des Speichers", () => {
  it("überschreibt beschädigte Daten nicht stillschweigend", async () => {
    const { repo, store } = setup();
    store.map.set(STORAGE_KEY, "{kaputt");
    await expect(repo.load()).rejects.toMatchObject({ kind: "corrupt" });
    expect(store.map.get(STORAGE_KEY)).toBe("{kaputt");
    expect(repo.readRaw()).toBe("{kaputt");
  });

  it("meldet vollen Speicher", async () => {
    const { repo, store } = setup();
    await repo.load();
    const quota = new Error("The quota has been exceeded.");
    quota.name = "QuotaExceededError";
    store.failWrites = quota;
    await expect(repo.addTransactions([tx({})])).rejects.toMatchObject({ kind: "quota" });
  });

  it("setzt auf Startwerte zurück", async () => {
    const { repo } = setup();
    await repo.load();
    await repo.addTransactions([tx({})]);
    const data = await repo.reset();
    expect(balancesByProgram(data.transactions, PROGRAMS).payback).toBe(5822);
  });
});

describe("Backup", () => {
  it("Export → Import ergibt dieselben Daten", async () => {
    const a = setup();
    await a.repo.load();
    await a.repo.addTransactions([tx({ id: "x", programId: "avios", delta: 12000, type: "purchased", note: "Kauf" })]);
    const backup = await a.repo.exportBackup();
    expect(backup).toMatchObject({ app: "pointpilot", schemaVersion: 1, exportedAt: NOW.toISOString() });

    const text = JSON.stringify(backup);
    const parsed = parseBackupText(text);
    expect(parsed.ok).toBe(true);

    const b = setup();
    await b.repo.load();
    const imported = await b.repo.importBackup(JSON.parse(text));
    expect(imported).toEqual(backup.data);
    expect(balancesByProgram(imported.transactions, PROGRAMS).avios).toBe(12000);
  });

  it("lehnt fremde, kaputte und falsche Versionen ab – ohne Daten zu verändern", async () => {
    const { repo } = setup();
    const before = await repo.load();
    expect(parseBackupText("nicht json")).toEqual({ ok: false, error: "Die Datei ist kein gültiges JSON." });
    expect(parseBackupText('{"app":"andere"}')).toMatchObject({ ok: false, error: "Das ist kein PointPilot-Backup." });
    expect(parseBackupText('{"app":"pointpilot","schemaVersion":2}')).toMatchObject({ ok: false });

    const broken = { app: "pointpilot", schemaVersion: 1, exportedAt: NOW.toISOString(), data: { transactions: "x" } };
    await expect(repo.importBackup(broken)).rejects.toMatchObject({ kind: "invalid-backup" });
    expect(await repo.load()).toEqual(before);
  });

  it("benennt die Datei mit Datum", () => {
    expect(backupFileName(new Date(2026, 10, 16, 8))).toBe("pointpilot-backup-2026-11-16.json");
  });
});
