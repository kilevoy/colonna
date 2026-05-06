import { describe, expect, it } from "vitest";
import {
  buildInputComparisonReport,
  buildNormalizedInputComparisonReport,
  formatInputComparisonMarkdown,
} from "./input-comparison";
import { compareColumnInputs, defaultNativeColumnComparisonInput } from "./column-input-mapping";
import { comparePurlinInputs, defaultNativePurlinLstkComparisonInput } from "./purlin-input-mapping";
import { compareTrussInputs, defaultNativeTrussComparisonInput } from "./truss-input-mapping";
import { defaultVelicanColumnInputs } from "../velican/column-oracle";
import { defaultVelicanMolodechnoInputs } from "../velican/molodechno-oracle";
import { defaultVelicanPurlinInputs } from "../velican/purlin-oracle";
import {
  columnNormalizedScenario,
  purlinNormalizedScenario,
  trussNormalizedScenario,
} from "./scenarios";

describe("native vs VELICAN input comparisons", () => {
  it("column input comparison returns rows", () => {
    const result = compareColumnInputs(defaultNativeColumnComparisonInput, defaultVelicanColumnInputs);

    expect(result.block).toBe("column");
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it("purlin input comparison returns rows", () => {
    const result = comparePurlinInputs(defaultNativePurlinLstkComparisonInput, defaultVelicanPurlinInputs);

    expect(result.block).toBe("purlin");
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it("truss input comparison does not throw", () => {
    const result = compareTrussInputs(defaultNativeTrussComparisonInput, defaultVelicanMolodechnoInputs);

    expect(result.block).toBe("truss");
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it("markdown formatter returns a string", () => {
    const markdown = formatInputComparisonMarkdown(buildInputComparisonReport());

    expect(markdown).toContain("Native vs VELICAN Input Comparison");
  });

  it("report contains summaries", () => {
    const report = buildInputComparisonReport();

    expect(report.column.summary.total).toBeGreaterThan(0);
    expect(report.purlin.summary.different + report.purlin.summary.ok).toBeGreaterThan(0);
    expect(report.truss.summary.missingNative + report.truss.summary.missingOracle).toBeGreaterThanOrEqual(0);
  });

  it("normalized scenarios contain native and oracle inputs", () => {
    expect(columnNormalizedScenario.nativeInput).toBeTruthy();
    expect(columnNormalizedScenario.oracleInput).toBeTruthy();
    expect(trussNormalizedScenario.nativeInput).toBeTruthy();
    expect(trussNormalizedScenario.oracleInput).toBeTruthy();
    expect(purlinNormalizedScenario.nativeInput).toBeTruthy();
    expect(purlinNormalizedScenario.oracleInput).toBeTruthy();
  });

  it("normalized column inputs have fewer different rows than legacy defaults", () => {
    const legacy = buildInputComparisonReport().column;
    const normalized = buildNormalizedInputComparisonReport().column;

    expect(normalized.summary.different).toBeLessThan(legacy.summary.different);
  });

  it("normalized purlin inputs have fewer different rows than legacy defaults", () => {
    const legacy = buildInputComparisonReport().purlin;
    const normalized = buildNormalizedInputComparisonReport().purlin;

    expect(normalized.summary.different).toBeLessThan(legacy.summary.different);
  });

  it("normalized markdown formatter returns a string", () => {
    const markdown = formatInputComparisonMarkdown(buildNormalizedInputComparisonReport());

    expect(markdown).toContain("Input Comparison");
  });
});
