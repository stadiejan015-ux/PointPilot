import { describe, expect, it } from "vitest";
import { estimateValueCents, programSettingsFor } from "./valuation";

describe("estimateValueCents", () => {
  it("rechnet Stand × eigener Punktwert", () => {
    expect(estimateValueCents(5822, 1)).toBe(5822); // 58,22 €
    expect(estimateValueCents(5510, 1.2)).toBe(6612); // 66,12 €
    expect(estimateValueCents(333, 0.5)).toBe(167); // 166,5 → 167 ct
  });

  it("ist null ohne festgelegten Punktwert", () => {
    expect(estimateValueCents(5822, null)).toBeNull();
  });

  it("ist 0 bei Stand 0", () => {
    expect(estimateValueCents(0, 1.5)).toBe(0);
  });
});

describe("programSettingsFor", () => {
  it("liefert leere Werte für Programme ohne Eintrag", () => {
    const settings = { programs: { payback: { pointValueCents: 1, minRedemptionCents: 0.8 } }, borderlineTolerancePct: 10 };
    expect(programSettingsFor(settings, "payback")).toEqual({ pointValueCents: 1, minRedemptionCents: 0.8 });
    expect(programSettingsFor(settings, "avios")).toEqual({ pointValueCents: null, minRedemptionCents: null });
  });
});
