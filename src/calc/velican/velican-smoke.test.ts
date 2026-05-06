import { describe, expect, it } from "vitest";
import {
  calculateVelicanBeamCell,
  calculateVelicanColumn,
  calculateVelicanCraneBeam,
  calculateVelicanMolodechno,
  calculateVelicanPurlin,
  calculateVelicanWindowRiegel,
  defaultVelicanBeamCellInputs,
  defaultVelicanColumnInputs,
  defaultVelicanCraneInputs,
  defaultVelicanMolodechnoInputs,
  defaultVelicanPurlinInputs,
  defaultVelicanWindowRiegelInputs,
  velicanColumnOptions,
} from "./index";

describe("VELICAN oracle smoke tests", () => {
  it("runs crane-beam default inputs", () => {
    const result = calculateVelicanCraneBeam(defaultVelicanCraneInputs);

    expect(result.profile || result.warnings.length > 0).toBeTruthy();
  }, 20_000);

  it("runs column-oracle default inputs", () => {
    const result = calculateVelicanColumn(defaultVelicanColumnInputs);

    expect(result.normalForceKn).not.toBeNull();
    expect(result.momentKnM).not.toBeNull();
    expect(velicanColumnOptions).toBeTruthy();
  }, 20_000);

  it("runs molodechno-oracle default inputs", () => {
    const result = calculateVelicanMolodechno(defaultVelicanMolodechnoInputs);

    expect(result.members.length).toBeGreaterThan(0);
  }, 20_000);

  it("runs purlin-oracle default inputs", async () => {
    const result = await calculateVelicanPurlin(defaultVelicanPurlinInputs);

    expect(
      result.hotRolled.length > 0 ||
        result.mp350.length > 0 ||
        result.mp390.length > 0,
    ).toBe(true);
  }, 20_000);

  it("runs window-riegel default inputs", () => {
    const result = calculateVelicanWindowRiegel(defaultVelicanWindowRiegelInputs);

    expect(result.lowerAndUpperProfiles.length).toBeGreaterThan(0);
  }, 20_000);

  it("runs beam-cell default inputs", () => {
    const result = calculateVelicanBeamCell(defaultVelicanBeamCellInputs);

    expect(result.main).toBeTruthy();
  });
});
