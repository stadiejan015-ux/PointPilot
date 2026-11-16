import programsJson from "@data/programs.json";
import transfersJson from "@data/transfers.json";
import { loadCatalog } from "./load-catalog";

export * from "./load-catalog";

/** Der geprüfte Katalog aus dem Repo. */
export const catalog = loadCatalog(programsJson, transfersJson);
