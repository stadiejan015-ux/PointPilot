import { describe, expect, it } from "vitest";
import { calculateGoal } from "./goal";
import { route } from "./test-helpers";

const routes = [
  route({ from: "payback", to: "miles-and-more", minAmount: 200, verified: false }),
  route({ from: "revolut", to: "miles-and-more", ratio: null, verified: false }),
  route({ from: "revolut", to: "avios", ratio: { from: 2, to: 1 } }),
];

describe("calculateGoal", () => {
  it("Beispiel: 10.000 Miles & More mit PAYBACK 5.822 und 0 Meilen", () => {
    const result = calculateGoal({
      targetProgramId: "miles-and-more",
      targetAmount: 10000,
      balances: { payback: 5822, revolut: 5510, "miles-and-more": 0 },
      routes,
    });
    expect(result).not.toBeNull();
    expect(result!.currentInTarget).toBe(0);
    expect(result!.missingWithoutTransfer).toBe(10000);
    expect(result!.reachedAlready).toBe(false);

    // Nur Routen zum Ziel, nicht revolut → avios
    expect(result!.options.map((o) => o.sourceProgramId)).toEqual(["payback", "revolut"]);

    const payback = result!.options[0]!;
    expect(payback).toMatchObject({
      status: "ok",
      pointsReceived: 5822,
      totalAfter: 5822,
      stillMissing: 4178, // 10.000 − 5.822
      sourceNeededForGap: 10000,
      coversGap: false,
    });

    const revolut = result!.options[1]!;
    expect(revolut).toMatchObject({
      status: "ratio-unknown",
      pointsReceived: null,
      stillMissing: null,
      sourceNeededForGap: null,
      coversGap: null,
    });

    // "Alle Quellen" enthält nur berechenbare Quellen
    expect(result!.combined).toEqual({
      pointsReceived: 5822,
      totalAfter: 5822,
      stillMissing: 4178,
      sourceProgramIds: ["payback"],
      includesUnverified: true,
    });
  });

  it("rechnet vorhandenen Zielstand mit ein und meldet erreichte Ziele", () => {
    const result = calculateGoal({
      targetProgramId: "miles-and-more",
      targetAmount: 3000,
      balances: { payback: 5822, "miles-and-more": 3500 },
      routes,
    })!;
    expect(result.reachedAlready).toBe(true);
    expect(result.missingWithoutTransfer).toBe(0);
    expect(result.options[0]).toMatchObject({ sourceNeededForGap: 0, coversGap: true, stillMissing: 0 });
  });

  it("zeigt, wie viele Quellpunkte die Lücke schließen", () => {
    const result = calculateGoal({
      targetProgramId: "miles-and-more",
      targetAmount: 5000,
      balances: { payback: 5822, "miles-and-more": 1000 },
      routes,
    })!;
    expect(result.options[0]).toMatchObject({
      sourceNeededForGap: 4000,
      coversGap: true,
      totalAfter: 6822,
      stillMissing: 0,
    });
  });

  it("unterscheidet 'kein Stand' und 'unter Mindestmenge'", () => {
    const empty = calculateGoal({
      targetProgramId: "miles-and-more",
      targetAmount: 1000,
      balances: { payback: 0 },
      routes,
    })!;
    expect(empty.options[0]).toMatchObject({ status: "no-balance", pointsReceived: 0, stillMissing: 1000 });

    const small = calculateGoal({
      targetProgramId: "miles-and-more",
      targetAmount: 1000,
      balances: { payback: 150 },
      routes,
    })!;
    expect(small.options[0]).toMatchObject({ status: "below-minimum", pointsReceived: 0, stillMissing: 1000 });
    expect(small.combined).toBeNull();
  });

  it("addiert im Szenario 'alle Quellen' erst nach Umrechnung in die Zieleinheit", () => {
    const result = calculateGoal({
      targetProgramId: "avios",
      targetAmount: 10000,
      balances: { revolut: 5510, payback: 5822 },
      routes: [...routes, route({ from: "payback", to: "avios", ratio: { from: 3, to: 1 } })],
    })!;
    // 5.510 / 2 = 2.755 und 5.822 / 3 = 1.940,67 → 1.940
    expect(result.combined).toMatchObject({ pointsReceived: 4695, stillMissing: 5305 });
  });

  it("gibt bei ungültiger Zielmenge null zurück und liefert ohne Routen keine Optionen", () => {
    expect(calculateGoal({ targetProgramId: "avios", targetAmount: 0, balances: {}, routes })).toBeNull();
    expect(calculateGoal({ targetProgramId: "avios", targetAmount: 1.5, balances: {}, routes })).toBeNull();
    const none = calculateGoal({ targetProgramId: "flying-blue", targetAmount: 100, balances: {}, routes })!;
    expect(none.options).toEqual([]);
    expect(none.combined).toBeNull();
  });
});
