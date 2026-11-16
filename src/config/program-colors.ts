import type { ProgramId } from "@/core/model";

/** Akzentfarben je Programm – nur zur Unterscheidung, nicht zur Bewertung. */
const PROGRAM_COLORS: Record<ProgramId, string> = {
  payback: "#60a5fa",
  revolut: "#a78bfa",
  "miles-and-more": "#e3c47e",
  "flying-blue": "#22d3ee",
  avios: "#f9a8d4",
};

const FALLBACK = ["#93c5fd", "#c4b5fd", "#fcd34d", "#67e8f9", "#f0abfc", "#86efac"];

export function programColor(id: ProgramId): string {
  const known = PROGRAM_COLORS[id];
  if (known) return known;
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return FALLBACK[hash % FALLBACK.length]!;
}
