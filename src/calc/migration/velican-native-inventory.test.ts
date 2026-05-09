import { describe, expect, it } from "vitest";
import {
  getVelicanNativeMigrationBlock,
  velicanNativeMigrationInventory,
  type VelicanNativeMigrationBlockKey,
} from "./velican-native-inventory";

describe("VELICAN native migration inventory", () => {
  it("contains the three oracle-only project blocks", () => {
    expect(velicanNativeMigrationInventory.map((block) => block.blockKey)).toEqual([
      "windowRiegel",
      "beamCell",
      "craneBeam",
    ]);
  });

  it("uses unique migration priorities", () => {
    const priorities = velicanNativeMigrationInventory.map((block) => block.priority);
    expect(new Set(priorities).size).toBe(priorities.length);
  });

  it("orders migration as window riegel, beam cell, crane beam", () => {
    const windowRiegel = getVelicanNativeMigrationBlock("windowRiegel");
    const beamCell = getVelicanNativeMigrationBlock("beamCell");
    const craneBeam = getVelicanNativeMigrationBlock("craneBeam");

    expect(windowRiegel.priority).toBeLessThan(beamCell.priority);
    expect(beamCell.priority).toBeLessThan(craneBeam.priority);
  });

  it("records public and oracle module paths for every block", () => {
    for (const block of velicanNativeMigrationInventory) {
      expect(block.publicModulePath.trim()).not.toBe("");
      expect(block.oracleModulePath.trim()).not.toBe("");
    }
  });

  it("records risks for every block", () => {
    for (const block of velicanNativeMigrationInventory) {
      expect(block.risks.length).toBeGreaterThan(0);
    }
  });

  it("returns the requested block by key", () => {
    expect(getVelicanNativeMigrationBlock("beamCell").blockKey).toBe("beamCell");
  });

  it("throws a readable error for an unknown block key", () => {
    expect(() => getVelicanNativeMigrationBlock("unknown" as VelicanNativeMigrationBlockKey)).toThrow(
      "Unknown VELICAN native migration block: unknown",
    );
  });
});
