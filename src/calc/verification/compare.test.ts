import { describe, expect, it } from "vitest";
import { compareWithTolerance } from "./compare";

describe("compareWithTolerance", () => {
  it("returns ok when the value is within tolerance", () => {
    const result = compareWithTolerance(10.02, 10, 0.05);

    expect(result.status).toBe("ok");
    expect(result.actual).toBe(10.02);
    expect(result.expected).toBe(10);
    expect(result.absDelta).toBeCloseTo(0.02);
  });

  it("returns fail when the value is outside tolerance", () => {
    const result = compareWithTolerance(10.2, 10, 0.05);

    expect(result.status).toBe("fail");
    expect(result.delta).toBeCloseTo(0.2);
    expect(result.absDelta).toBeCloseTo(0.2);
  });
});
