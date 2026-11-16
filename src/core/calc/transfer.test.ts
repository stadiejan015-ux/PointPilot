import { describe, expect, it } from "vitest";
import { calculateTransfer, convert, effectiveMinimum, sourceAmountForTarget } from "./transfer";
import { route } from "./test-helpers";

describe("convert", () => {
  it("rechnet 1:1, 3:2 und 2:1 und rundet ab", () => {
    expect(convert(5822, { from: 1, to: 1 })).toBe(5822);
    expect(convert(1000, { from: 3, to: 2 })).toBe(666); // 666,67 → 666
    expect(convert(5510, { from: 2, to: 1 })).toBe(2755);
    expect(convert(5511, { from: 2, to: 1 })).toBe(2755); // 2755,5 → 2755
  });
});

describe("effectiveMinimum", () => {
  it("nimmt minAmount, wenn kein step gilt", () => {
    expect(effectiveMinimum(route({ from: "a", to: "b", minAmount: 200 }))).toBe(200);
  });
  it("ist 1 ohne Mindestmenge und ohne step", () => {
    expect(effectiveMinimum(route({ from: "a", to: "b" }))).toBe(1);
  });
  it("rundet die Mindestmenge auf das nächste Vielfache von step auf", () => {
    expect(effectiveMinimum(route({ from: "a", to: "b", minAmount: 200, step: 500 }))).toBe(500);
    expect(effectiveMinimum(route({ from: "a", to: "b", minAmount: null, step: 1000 }))).toBe(1000);
    expect(effectiveMinimum(route({ from: "a", to: "b", minAmount: 3000, step: 1000 }))).toBe(3000);
  });
});

describe("calculateTransfer", () => {
  const payback = route({ from: "payback", to: "miles-and-more", minAmount: 200, verified: false });

  it("PAYBACK 5.822 → 5.822 Meilen bei 1:1 ab 200", () => {
    const r = calculateTransfer(payback, 5822);
    expect(r).toMatchObject({
      status: "ok",
      usableAmount: 5822,
      remainder: 0,
      targetPoints: 5822,
      effectiveMinimum: 200,
      verified: false,
    });
  });

  it("meldet 'below-minimum' knapp unter der Mindestmenge und 'ok' genau darauf", () => {
    expect(calculateTransfer(payback, 199)).toMatchObject({ status: "below-minimum", targetPoints: 0, usableAmount: 0 });
    expect(calculateTransfer(payback, 200)).toMatchObject({ status: "ok", targetPoints: 200 });
  });

  it("überträgt nur Vielfache von step und weist den Rest aus", () => {
    const stepped = route({ from: "a", to: "b", ratio: { from: 3, to: 2 }, minAmount: 1000, step: 1000 });
    expect(calculateTransfer(stepped, 5510)).toMatchObject({
      status: "ok",
      usableAmount: 5000,
      remainder: 510,
      targetPoints: 3333, // 5000 × 2/3 = 3333,33 → 3333
    });
  });

  it("liefert ohne Verhältnis keine Zielpunkte, aber Mindestmenge und Rest", () => {
    const unknown = route({ from: "revolut", to: "avios", ratio: null, verified: false });
    expect(calculateTransfer(unknown, 5510)).toMatchObject({
      status: "ratio-unknown",
      targetPoints: null,
      usableAmount: 5510,
    });
  });

  it("lehnt leere, negative und gebrochene Mengen ab", () => {
    for (const amount of [0, -5, 1.5, Number.NaN]) {
      expect(calculateTransfer(payback, amount).status).toBe("invalid-amount");
    }
  });

  it("gibt den verified-Status der Route weiter", () => {
    expect(calculateTransfer(route({ from: "a", to: "b", verified: true }), 10).verified).toBe(true);
  });
});

describe("sourceAmountForTarget", () => {
  it("rechnet die nötige Quellmenge zurück und rundet auf", () => {
    const r = route({ from: "a", to: "b", ratio: { from: 3, to: 2 } });
    expect(sourceAmountForTarget(r, 1000)).toBe(1500);
    expect(sourceAmountForTarget(r, 1001)).toBe(1502); // 1501,5 → 1502
    // Gegenprobe: so viele Quellpunkte erreichen das Ziel wirklich
    expect(calculateTransfer(r, 1502).targetPoints).toBeGreaterThanOrEqual(1001);
    expect(calculateTransfer(r, 1501).targetPoints).toBeLessThan(1001);
  });

  it("respektiert Mindestmenge und step", () => {
    const r = route({ from: "a", to: "b", minAmount: 200 });
    expect(sourceAmountForTarget(r, 50)).toBe(200);
    const stepped = route({ from: "a", to: "b", step: 1000 });
    expect(sourceAmountForTarget(stepped, 1200)).toBe(2000);
  });

  it("ist 0 ohne Lücke und null ohne Verhältnis", () => {
    expect(sourceAmountForTarget(route({ from: "a", to: "b" }), 0)).toBe(0);
    expect(sourceAmountForTarget(route({ from: "a", to: "b", ratio: null }), 100)).toBeNull();
  });
});
