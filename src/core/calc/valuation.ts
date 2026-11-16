import type { ProgramId, ProgramSettings, Settings } from "../model/types";

const EMPTY_PROGRAM_SETTINGS: ProgramSettings = { pointValueCents: null, minRedemptionCents: null };

/** Einstellungen eines Programms; fehlt ein Eintrag, gelten leere Werte. */
export function programSettingsFor(settings: Settings, programId: ProgramId): ProgramSettings {
  return settings.programs[programId] ?? EMPTY_PROGRAM_SETTINGS;
}

/**
 * Geschätzter Wert eines Stands in Cent (auf ganze Cent gerundet).
 * null, wenn kein eigener Punktwert festgelegt ist.
 * Bewusst nur je Programm – Werte verschiedener Programme werden nicht addiert.
 */
export function estimateValueCents(balance: number, pointValueCents: number | null): number | null {
  if (pointValueCents === null || !Number.isFinite(pointValueCents)) return null;
  return Math.round(balance * pointValueCents);
}
