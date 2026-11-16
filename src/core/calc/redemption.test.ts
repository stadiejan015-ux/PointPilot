import { describe, expect, it } from "vitest";
import { rateRedemption, valuePerPointCents } from "./redemption";

describe("valuePerPointCents", () => {
  it("rechnet (Cash − Zuzahlung) / Meilen in Cent", () => {
    // 450 € Cash, 30.000 Meilen, 90 € Zuzahlung → 36.000 ct / 30.000 = 1,2 ct
    const r = valuePerPointCents({ cashPriceCents: 45000, points: 30000, copayCents: 9000 });
    expect(r).toEqual({ ok: true, valueCents: 1.2, savedCents: 36000 });
  });

  it("wird negativ, wenn die Zuzahlung den Cash-Preis übersteigt", () => {
    const r = valuePerPointCents({ cashPriceCents: 10000, points: 10000, copayCents: 15000 });
    expect(r).toEqual({ ok: true, valueCents: -0.5, savedCents: -5000 });
  });

  it("verlangt eine positive ganze Meilenzahl und gültige Beträge", () => {
    expect(valuePerPointCents({ cashPriceCents: 100, points: 0, copayCents: 0 })).toEqual({
      ok: false,
      reason: "points-missing",
    });
    expect(valuePerPointCents({ cashPriceCents: -1, points: 10, copayCents: 0 })).toEqual({
      ok: false,
      reason: "invalid-amount",
    });
    expect(valuePerPointCents({ cashPriceCents: 100, points: 10, copayCents: Number.NaN })).toEqual({
      ok: false,
      reason: "invalid-amount",
    });
  });
});

describe("rateRedemption (Mindestwert 1,0 ct, Toleranz 10 %)", () => {
  it("lohnt sich ab 1,1 ct – auch genau auf der Grenze trotz Gleitkomma", () => {
    expect(rateRedemption(1.1, 1.0, 10).rating).toBe("good");
    expect(rateRedemption(2.0, 1.0, 10).rating).toBe("good");
  });

  it("wertet exakte Grenzwerte trotz Gleitkomma-Rundung richtig", () => {
    // Mindestwert 0,2 ct: 0.2 × 1.1 = 0.22000000000000003 und 0.2 × 0.9 = 0.18000000000000002
    expect(rateRedemption(2200 / 10000, 0.2, 10).rating).toBe("good");
    expect(rateRedemption(1800 / 10000, 0.2, 10).rating).toBe("borderline");
  });

  it("ist grenzwertig zwischen 0,9 und 1,1 ct", () => {
    expect(rateRedemption(1.0999, 1.0, 10).rating).toBe("borderline");
    expect(rateRedemption(1.0, 1.0, 10).rating).toBe("borderline");
    expect(rateRedemption(0.9, 1.0, 10).rating).toBe("borderline");
  });

  it("ist eine schlechte Einlösung unter 0,9 ct und bei negativem Wert", () => {
    expect(rateRedemption(0.8999, 1.0, 10).rating).toBe("poor");
    expect(rateRedemption(-0.5, 1.0, 10).rating).toBe("poor");
  });

  it("liefert die Grenzen mit", () => {
    const r = rateRedemption(1.0, 1.2, 10);
    expect(r.upperBoundCents).toBeCloseTo(1.32);
    expect(r.lowerBoundCents).toBeCloseTo(1.08);
  });

  it("bewertet ohne Mindestwert nicht", () => {
    expect(rateRedemption(1.5, null, 10)).toEqual({
      rating: "no-threshold",
      upperBoundCents: null,
      lowerBoundCents: null,
    });
  });

  it("hat bei Toleranz 0 keine grenzwertige Zone außer genau dem Mindestwert", () => {
    expect(rateRedemption(1.0, 1.0, 0).rating).toBe("good");
    expect(rateRedemption(0.99, 1.0, 0).rating).toBe("poor");
  });
});
