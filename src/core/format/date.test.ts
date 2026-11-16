import { describe, expect, it } from "vitest";
import { dateInputToIso, formatAsOf, formatDate, toDateInputValue } from "./date";

describe("Datumsfunktionen", () => {
  it("formatiert deutsch", () => {
    expect(formatDate(new Date(2026, 10, 16, 12).toISOString())).toBe("16.11.2026");
    expect(formatAsOf("2026-11-16")).toBe("16. November 2026");
  });

  it("erzeugt Werte für <input type=date> in Ortszeit", () => {
    expect(toDateInputValue(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });

  it("nimmt für heute die aktuelle Uhrzeit, sonst 12:00 Uhr", () => {
    const now = new Date(2026, 10, 16, 9, 15);
    expect(dateInputToIso("2026-11-16", now)).toBe(now.toISOString());
    expect(dateInputToIso("2026-11-10", now)).toBe(new Date(2026, 10, 10, 12).toISOString());
  });

  it("lehnt ungültige Daten ab", () => {
    const now = new Date(2026, 10, 16);
    expect(dateInputToIso("", now)).toBeNull();
    expect(dateInputToIso("2026-02-30", now)).toBeNull();
    expect(dateInputToIso("16.11.2026", now)).toBeNull();
  });
});
