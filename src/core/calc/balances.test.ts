import { describe, expect, it } from "vitest";
import {
  allowedTypesForDelta,
  balanceAfterEach,
  balanceOf,
  balancesByProgram,
  deltaForNewBalance,
  recentTransactions,
  sortNewestFirst,
  suggestedTypeForDelta,
} from "./balances";
import { tx } from "./test-helpers";

describe("balanceOf / balancesByProgram", () => {
  it("summiert nur Buchungen des jeweiligen Programms", () => {
    const txs = [
      tx({ programId: "payback", delta: 5822 }),
      tx({ programId: "revolut", delta: 5510 }),
      tx({ programId: "payback", delta: -1000 }),
    ];
    expect(balanceOf(txs, "payback")).toBe(4822);
    expect(balanceOf(txs, "revolut")).toBe(5510);
    expect(balanceOf(txs, "avios")).toBe(0);
  });

  it("führt jedes Programm getrennt – nie eine Gesamtsumme", () => {
    const balances = balancesByProgram(
      [tx({ programId: "payback", delta: 5822 }), tx({ programId: "revolut", delta: 5510 })],
      ["payback", "revolut", "miles-and-more"],
    );
    expect(balances).toEqual({ payback: 5822, revolut: 5510, "miles-and-more": 0 });
  });

  it("liefert 0 für Programme ohne Buchungen bei leerer Liste", () => {
    expect(balancesByProgram([], ["avios"])).toEqual({ avios: 0 });
  });
});

describe("deltaForNewBalance", () => {
  it("berechnet die Differenz zum neuen Stand", () => {
    expect(deltaForNewBalance(5822, 6000)).toEqual({ ok: true, delta: 178 });
    expect(deltaForNewBalance(5822, 0)).toEqual({ ok: true, delta: -5822 });
  });

  it("lehnt unveränderte, negative und gebrochene Stände ab", () => {
    expect(deltaForNewBalance(100, 100)).toEqual({ ok: false, reason: "unchanged" });
    expect(deltaForNewBalance(100, -1)).toEqual({ ok: false, reason: "negative" });
    expect(deltaForNewBalance(100, 100.5)).toEqual({ ok: false, reason: "not-integer" });
  });
});

describe("Buchungsarten passend zur Richtung", () => {
  it("schlägt bei Plus 'gesammelt' und bei Minus 'eingelöst' vor", () => {
    expect(suggestedTypeForDelta(178)).toBe("earned");
    expect(suggestedTypeForDelta(-500)).toBe("redeemed");
    expect(suggestedTypeForDelta(0)).toBeNull();
  });

  it("erlaubt 'eingelöst' nicht bei Plus und 'gesammelt'/'gekauft' nicht bei Minus", () => {
    expect(allowedTypesForDelta(10)).not.toContain("redeemed");
    expect(allowedTypesForDelta(-10)).not.toContain("earned");
    expect(allowedTypesForDelta(-10)).not.toContain("purchased");
    expect(allowedTypesForDelta(10)).toContain("correction");
    expect(allowedTypesForDelta(-10)).toContain("transferred");
  });
});

describe("Sortierung und laufender Stand", () => {
  const a = tx({ id: "a", programId: "payback", delta: 100, occurredAt: "2026-11-01T10:00:00.000Z" });
  const b = tx({ id: "b", programId: "payback", delta: -30, occurredAt: "2026-11-03T10:00:00.000Z" });
  const c = tx({ id: "c", programId: "revolut", delta: 50, occurredAt: "2026-11-02T10:00:00.000Z" });
  const d = tx({ id: "d", programId: "payback", delta: 5, occurredAt: "2026-11-03T10:00:00.000Z" });

  it("sortiert neueste zuerst, bei gleichem Zeitpunkt die später erfasste zuerst", () => {
    expect(sortNewestFirst([a, b, c, d]).map((t) => t.id)).toEqual(["d", "b", "c", "a"]);
  });

  it("begrenzt die letzten Buchungen", () => {
    expect(recentTransactions([a, b, c, d], 2).map((t) => t.id)).toEqual(["d", "b"]);
    expect(recentTransactions([a], 0)).toEqual([]);
  });

  it("rechnet den Stand nach jeder Buchung je Programm", () => {
    const after = balanceAfterEach([b, a, d, c]);
    expect(after.get("a")).toBe(100);
    expect(after.get("b")).toBe(70);
    expect(after.get("d")).toBe(75);
    expect(after.get("c")).toBe(50);
  });
});
