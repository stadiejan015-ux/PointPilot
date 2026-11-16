import { describe, expect, it } from "vitest";
import {
  eurosToCents,
  formatCentsPerPoint,
  formatEuroFromCents,
  formatPoints,
  formatRatio,
  formatSignedPoints,
  parseDecimal,
  parseWholeNumber,
  toInputDecimal,
} from "./number";

// Intl nutzt je nach Umgebung geschützte Leerzeichen – für Vergleiche normalisieren.
const plain = (s: string) => s.replace(/[  ]/g, " ");

describe("Formatierung (de-DE)", () => {
  it("formatiert Punkte mit Tausenderpunkt", () => {
    expect(formatPoints(5822)).toBe("5.822");
    expect(formatPoints(1234567)).toBe("1.234.567");
    expect(formatPoints(0)).toBe("0");
  });

  it("zeigt Vorzeichen bei Änderungen", () => {
    expect(formatSignedPoints(178)).toBe("+178");
    expect(formatSignedPoints(-5822)).toBe("−5.822");
    expect(formatSignedPoints(0)).toBe("0");
  });

  it("formatiert Euro aus Cent und Cent pro Punkt", () => {
    expect(plain(formatEuroFromCents(5822))).toBe("58,22 €");
    expect(plain(formatEuroFromCents(123456))).toBe("1.234,56 €");
    expect(formatCentsPerPoint(1.2)).toBe("1,20 ct");
    expect(formatCentsPerPoint(1.23456)).toBe("1,23 ct");
  });

  it("formatiert Verhältnisse", () => {
    expect(formatRatio({ from: 1, to: 1 })).toBe("1 : 1");
    expect(formatRatio({ from: 3, to: 2 })).toBe("3 : 2");
  });
});

describe("parseWholeNumber", () => {
  it.each([
    ["5822", 5822],
    ["5.822", 5822],
    ["1.234.567", 1234567],
    [" 5 822 ", 5822],
    ["0", 0],
  ])("liest %j als %d", (input, expected) => {
    expect(parseWholeNumber(input)).toBe(expected);
  });

  it.each(["", "  ", "1,5", "-5", "5.82", "abc", "5.8222", "1e3"])("lehnt %j ab", (input) => {
    expect(parseWholeNumber(input)).toBeNull();
  });
});

describe("parseDecimal", () => {
  it.each([
    ["1.234,56", 1234.56],
    ["12,5", 12.5],
    ["450", 450],
    ["1.500", 1500],
    ["12.50", 12.5],
    ["1.5", 1.5],
    ["89,90 €", 89.9],
    ["0,8", 0.8],
    ["12,", 12],
  ])("liest %j als %d", (input, expected) => {
    expect(parseDecimal(input)).toBe(expected);
  });

  it.each(["", "abc", "-3", "1,2,3", "1.23.4", "12.345,6.7"])("lehnt %j ab", (input) => {
    expect(parseDecimal(input)).toBeNull();
  });
});

describe("Hilfen für Eingabefelder", () => {
  it("rechnet Euro exakt in Cent um", () => {
    expect(eurosToCents(89.9)).toBe(8990);
    expect(eurosToCents(0.29)).toBe(29); // 0.29 × 100 = 28.999999999999996
  });

  it("schreibt Dezimalzahlen mit Komma", () => {
    expect(toInputDecimal(1.2)).toBe("1,2");
    expect(toInputDecimal(null)).toBe("");
  });
});
