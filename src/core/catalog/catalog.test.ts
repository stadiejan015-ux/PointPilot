import { describe, expect, it } from "vitest";
import programsJson from "@data/programs.json";
import transfersJson from "@data/transfers.json";
import { catalog, CatalogError, findRoute, loadCatalog, routesFrom, routesTo } from "./index";

const program = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  name: id,
  unit: "Punkte",
  category: "other",
  source: null,
  asOf: null,
  verified: false,
  ...extra,
});

const rawRoute = (extra: Record<string, unknown> = {}) => ({
  id: "a__b",
  from: "a",
  to: "b",
  ratio: null,
  minAmount: null,
  step: null,
  source: null,
  asOf: null,
  verified: false,
  ...extra,
});

describe("Katalog aus dem Repo (data/*.json)", () => {
  it("ist gültig und enthält die fünf Startprogramme", () => {
    expect(() => loadCatalog(programsJson, transfersJson)).not.toThrow();
    expect(catalog.programs.map((p) => p.id)).toEqual(["payback", "revolut", "miles-and-more", "flying-blue", "avios"]);
  });

  it("enthält nur Verhältnisse mit Quelle und Stand-Datum", () => {
    for (const r of catalog.routes) {
      if (r.ratio !== null) {
        expect(r.source).not.toBeNull();
        expect(r.asOf).not.toBeNull();
      }
    }
  });

  it("findet Routen", () => {
    expect(findRoute(catalog, "payback", "miles-and-more")?.ratio).toEqual({ from: 1, to: 1 });
    expect(findRoute(catalog, "miles-and-more", "payback")).toBeUndefined();
    expect(routesFrom(catalog, "revolut").map((r) => r.to).sort()).toEqual(["avios", "flying-blue"]);
    expect(routesTo(catalog, "miles-and-more").map((r) => r.from)).toEqual(["payback"]);
  });
});

describe("loadCatalog lehnt fehlerhafte Daten ab", () => {
  const programs = { programs: [program("a"), program("b")] };

  it("Verhältnis ohne Quelle", () => {
    expect(() => loadCatalog(programs, { routes: [rawRoute({ ratio: { from: 1, to: 1 } })] })).toThrow(CatalogError);
  });

  it("verified=true ohne Quelle", () => {
    expect(() => loadCatalog({ programs: [program("a", { verified: true })] }, { routes: [] })).toThrow(/verified/);
  });

  it("Verhältnis mit Dezimalzahl oder 0", () => {
    const withSource = { source: "https://example.com", asOf: "2026-11-16" };
    expect(() => loadCatalog(programs, { routes: [rawRoute({ ...withSource, ratio: { from: 1, to: 0.8 } })] })).toThrow();
    expect(() => loadCatalog(programs, { routes: [rawRoute({ ...withSource, ratio: { from: 0, to: 1 } })] })).toThrow();
  });

  it("unbekanntes Programm in einer Route", () => {
    expect(() => loadCatalog(programs, { routes: [rawRoute({ to: "zzz" })] })).toThrow(/unbekanntes Programm/);
  });

  it("doppelte IDs und doppelte Routen", () => {
    expect(() => loadCatalog({ programs: [program("a"), program("a")] }, { routes: [] })).toThrow(/doppelt/);
    expect(() => loadCatalog(programs, { routes: [rawRoute(), rawRoute({ id: "x" })] })).toThrow(/doppelt/);
  });

  it("Route auf sich selbst und falsches Datumsformat", () => {
    expect(() => loadCatalog(programs, { routes: [rawRoute({ to: "a" })] })).toThrow();
    expect(() => loadCatalog({ programs: [program("a", { asOf: "16.11.2026" })] }, { routes: [] })).toThrow();
  });
});
