import type { Program } from "@/core/model";

/** Einzahl der Einheit für "pro …"-Angaben: Meilen → Meile, °Punkte → Punkt, Avios → Avios. */
export function singularUnit(program: Pick<Program, "unit">): string {
  switch (program.unit) {
    case "Meilen":
      return "Meile";
    case "Avios":
      return "Avios";
    case "RevPoints":
      return "RevPoint";
    default:
      return "Punkt";
  }
}
