import { describe, expect, it } from "vitest";
import {
  getRoofConstructionLoadKpa,
  getWallConstructionLoadKpa,
  roofConstructionOptions,
  wallConstructionOptions,
} from "./envelope-constructions";

describe("shared envelope construction catalog", () => {
  it("exposes roof and wall construction options from the existing column catalog", () => {
    expect(roofConstructionOptions.length).toBeGreaterThan(0);
    expect(wallConstructionOptions.length).toBeGreaterThan(0);
    expect(roofConstructionOptions.map((option) => option.id)).toContain("профлист");
    expect(wallConstructionOptions.map((option) => option.id)).toContain("профлист");
  });

  it("returns numeric loads for known roof and wall constructions", () => {
    expect(getRoofConstructionLoadKpa("профлист")).toBe(0.105);
    expect(getWallConstructionLoadKpa("профлист")).toBe(0.105);
    expect(getRoofConstructionLoadKpa("С-П 150 мм")).toBe(0.32028);
  });
});
