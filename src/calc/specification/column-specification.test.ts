import { describe, expect, it } from "vitest";
import { defaultProjectInput, type ProjectInput } from "../project";
import {
  deriveEdgeColumnGroup,
  deriveEndFakhverkColumnGroup,
  deriveFrameCount,
  deriveInteriorFrameCount,
  deriveMiddleColumnGroup,
  resolveColumnHeightAtX,
} from "./column-specification";

function withSpanCount(project: ProjectInput, spanCount: number): ProjectInput {
  return {
    ...project,
    geometry: {
      ...project.geometry,
      spanCount: spanCount as unknown as ProjectInput["geometry"]["spanCount"],
    },
  };
}

describe("column specification groups", () => {
  it("derives frame and interior frame counts", () => {
    expect(deriveFrameCount(defaultProjectInput)).toBe(11);
    expect(deriveInteriorFrameCount(defaultProjectInput)).toBe(9);
  });

  it("derives edge columns for interior frames", () => {
    const group = deriveEdgeColumnGroup(defaultProjectInput, null);

    expect(group.quantity).toBe(18);
    expect(group.rows).toHaveLength(2);
    expect(group.notes.join(" ")).toContain("interior frames");
  });

  it("derives end fakhverk posts across the end walls", () => {
    const group = deriveEndFakhverkColumnGroup(defaultProjectInput, null);

    expect(group.rows.map((row) => row.xM)).toEqual([0, 6, 12, 18, 24]);
    expect(group.quantity).toBe(10);
    expect(group.notes.join(" ")).toContain("insi-next");
  });

  it("keeps middle columns empty for a single-span building", () => {
    const group = deriveMiddleColumnGroup(defaultProjectInput, null);

    expect(group.quantity).toBe(0);
    expect(group.rows).toEqual([]);
  });

  it("derives middle columns for two- and three-span buildings", () => {
    const twoSpan = deriveMiddleColumnGroup(withSpanCount(defaultProjectInput, 2), null);
    const threeSpan = deriveMiddleColumnGroup(withSpanCount(defaultProjectInput, 3), null);

    expect(twoSpan.quantity).toBe(9);
    expect(twoSpan.rows).toHaveLength(1);
    expect(threeSpan.quantity).toBe(18);
    expect(threeSpan.rows).toHaveLength(2);
  });

  it("resolves greater gable height near the middle of the span", () => {
    const edgeHeight = resolveColumnHeightAtX(defaultProjectInput, 0);
    const middleHeight = resolveColumnHeightAtX(defaultProjectInput, defaultProjectInput.geometry.buildingSpanM / 2);

    expect(edgeHeight).not.toBeNull();
    expect(middleHeight).not.toBeNull();
    expect(middleHeight ?? 0).toBeGreaterThanOrEqual(edgeHeight ?? 0);
  });
});
