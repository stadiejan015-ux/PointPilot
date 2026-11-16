import { programsFileSchema, transfersFileSchema } from "../model/schemas";
import type { Catalog, Program, ProgramId, TransferRoute } from "../model/types";

export class CatalogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogError";
  }
}

/**
 * Prüft den Inhalt von data/programs.json und data/transfers.json.
 * Wirft bei Fehlern – dadurch schlägt der Build fehl, statt mit kaputten Daten zu rechnen.
 */
export function loadCatalog(programsRaw: unknown, transfersRaw: unknown): Catalog {
  const programsResult = programsFileSchema.safeParse(programsRaw);
  if (!programsResult.success) {
    throw new CatalogError(`data/programs.json ist ungültig: ${programsResult.error.message}`);
  }
  const transfersResult = transfersFileSchema.safeParse(transfersRaw);
  if (!transfersResult.success) {
    throw new CatalogError(`data/transfers.json ist ungültig: ${transfersResult.error.message}`);
  }

  const programs = programsResult.data.programs;
  const routes = transfersResult.data.routes;

  assertUnique(programs.map((p) => p.id), "Programm-ID", "data/programs.json");
  assertUnique(routes.map((r) => r.id), "Routen-ID", "data/transfers.json");
  assertUnique(routes.map((r) => `${r.from}→${r.to}`), "Route", "data/transfers.json");

  const ids = new Set(programs.map((p) => p.id));
  for (const route of routes) {
    for (const end of [route.from, route.to]) {
      if (!ids.has(end)) {
        throw new CatalogError(`data/transfers.json: Route "${route.id}" verweist auf unbekanntes Programm "${end}"`);
      }
    }
  }

  return { programs, routes };
}

function assertUnique(values: string[], what: string, file: string) {
  const seen = new Set<string>();
  for (const v of values) {
    if (seen.has(v)) throw new CatalogError(`${file}: ${what} "${v}" ist doppelt`);
    seen.add(v);
  }
}

export function findProgram(catalog: Catalog, id: ProgramId): Program | undefined {
  return catalog.programs.find((p) => p.id === id);
}

export function findRoute(catalog: Catalog, from: ProgramId, to: ProgramId): TransferRoute | undefined {
  return catalog.routes.find((r) => r.from === from && r.to === to);
}

export function routesFrom(catalog: Catalog, from: ProgramId): TransferRoute[] {
  return catalog.routes.filter((r) => r.from === from);
}

export function routesTo(catalog: Catalog, to: ProgramId): TransferRoute[] {
  return catalog.routes.filter((r) => r.to === to);
}
