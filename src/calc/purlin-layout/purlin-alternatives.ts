import { isLstkOutput, runPurlinCalculation } from "../purlin";
import type { LstkCandidate, LstkOutput, PurlinInput, PurlinOutput, RolledOutput } from "../purlin";
import { mapProjectToPurlinInput } from "../project/map-project-to-purlin";
import type { ProjectInput } from "../project/types";
import type { PurlinAlternative, PurlinAlternativesSummary, PurlinSystemKey } from "./types";

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function statusFor(profile: string | null, massKg: number | null, warnings: string[]): PurlinAlternative["status"] {
  if (!profile) return "missing";
  if (warnings.length > 0 || massKg === null) return "warning";
  return "ok";
}

function missingAlternative(system: PurlinSystemKey, label: string, warning: string): PurlinAlternative {
  return {
    system,
    label,
    profile: null,
    stepMm: null,
    utilization: null,
    massKg: null,
    costRub: null,
    status: "missing",
    notes: [],
    warnings: [warning],
  };
}

function bestLstkForSystem(output: LstkOutput, system: "mp350" | "mp390"): LstkCandidate | null {
  const grade = system === "mp350" ? "MP350" : "MP390";
  const candidates = output.sections
    .filter((section) => section.grade === grade)
    .map((section) => section.best)
    .filter((candidate): candidate is LstkCandidate => candidate !== null);
  candidates.sort((a, b) => a.massPerBuilding_kg - b.massPerBuilding_kg);
  return candidates[0] ?? null;
}

function tryRunPurlin(input: PurlinInput): { output: PurlinOutput | null; warning: string | null } {
  try {
    return { output: runPurlinCalculation(input), warning: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { output: null, warning: message };
  }
}

function ensureLstkOutput(project: ProjectInput, purlinResult: PurlinOutput | null): {
  output: LstkOutput | null;
  warnings: string[];
} {
  if (purlinResult && isLstkOutput(purlinResult)) return { output: purlinResult, warnings: [] };
  const input = mapProjectToPurlinInput(project).input;
  const calculated = tryRunPurlin({ ...input, materialType: "lstk" });
  if (!calculated.output) return { output: null, warnings: [`LSTK purlin calculation failed: ${calculated.warning}`] };
  return isLstkOutput(calculated.output)
    ? { output: calculated.output, warnings: [] }
    : { output: null, warnings: ["LSTK purlin calculation did not return an LSTK output."] };
}

function ensureRolledOutput(project: ProjectInput, purlinResult: PurlinOutput | null): {
  output: RolledOutput | null;
  warnings: string[];
} {
  if (purlinResult && !isLstkOutput(purlinResult)) return { output: purlinResult, warnings: [] };
  const input = mapProjectToPurlinInput(project).input;
  const calculated = tryRunPurlin({ ...input, materialType: "rolled" });
  if (!calculated.output) return { output: null, warnings: [`Hot-rolled purlin calculation failed: ${calculated.warning}`] };
  return !isLstkOutput(calculated.output)
    ? { output: calculated.output, warnings: [] }
    : { output: null, warnings: ["Hot-rolled purlin calculation did not return a rolled output."] };
}

function buildSortSteelAlternative(project: ProjectInput, purlinResult: PurlinOutput | null): PurlinAlternative {
  const rolled = ensureRolledOutput(project, purlinResult);
  const warning = rolled.warnings[0];
  if (!rolled.output) {
    return missingAlternative("sortSteel", "Сортовой металл", warning ?? "SortSteel purlin result is missing.");
  }
  const best = rolled.output.top10[0] ?? null;
  const warnings = best ? rolled.warnings : [...rolled.warnings, "No accepted hot-rolled purlin candidate."];

  return {
    system: "sortSteel",
    label: "Сортовой металл",
    profile: best?.profile.name ?? null,
    stepMm: finiteNumber(best?.spacing_mm),
    utilization: finiteNumber(best?.K_max),
    massKg: finiteNumber(best?.massPerBuilding_kg),
    costRub: null,
    status: statusFor(best?.profile.name ?? null, finiteNumber(best?.massPerBuilding_kg), warnings),
    notes: ["Alternative is calculated with existing native rolled purlin engine."],
    warnings,
  };
}

function buildLstkAlternative(
  project: ProjectInput,
  purlinResult: PurlinOutput | null,
  system: "mp350" | "mp390",
): PurlinAlternative {
  const label = system === "mp350" ? "ЛСТК MP350" : "ЛСТК MP390";
  const lstk = ensureLstkOutput(project, purlinResult);
  const warning = lstk.warnings[0];
  if (!lstk.output) {
    return missingAlternative(system, label, warning ?? `${label} purlin result is missing.`);
  }
  const best = bestLstkForSystem(lstk.output, system);
  const warnings = best ? lstk.warnings : [...lstk.warnings, `No accepted ${label} purlin candidate.`];

  return {
    system,
    label,
    profile: best?.profile.name ?? null,
    stepMm: finiteNumber(best?.spacing_mm),
    utilization: finiteNumber(best?.K),
    massKg: finiteNumber(best?.massPerBuilding_kg),
    costRub: null,
    status: statusFor(best?.profile.name ?? null, finiteNumber(best?.massPerBuilding_kg), warnings),
    notes: ["Alternative is calculated with existing native LSTK purlin engine."],
    warnings,
  };
}

function firstAvailable(alternatives: PurlinAlternative[]): PurlinSystemKey {
  return alternatives.find((item) => item.status !== "missing")?.system ?? alternatives[0]?.system ?? "mp350";
}

export function selectPurlinSystem(
  preference: ProjectInput["calculationSettings"]["purlinSystemPreference"],
  alternatives: PurlinAlternative[],
): { selectedSystem: PurlinSystemKey; autoSelectedSystem: PurlinSystemKey | null; notes: string[] } {
  if (preference === "sortSteel" || preference === "mp350" || preference === "mp390") {
    return {
      selectedSystem: preference,
      autoSelectedSystem: null,
      notes: ["Selected purlin system follows ProjectInput.calculationSettings.purlinSystemPreference."],
    };
  }

  const bySystem = new Map(alternatives.map((alternative) => [alternative.system, alternative]));
  const selectedSystem =
    bySystem.get("mp350")?.status === "ok"
      ? "mp350"
      : bySystem.get("mp390")?.status === "ok"
        ? "mp390"
        : bySystem.get("sortSteel")?.status === "ok"
          ? "sortSteel"
          : firstAvailable(alternatives);

  return {
    selectedSystem,
    autoSelectedSystem: selectedSystem,
    notes: ["Auto purlin selection is preliminary; optimization by cost/mass will be added later."],
  };
}

export function buildPurlinAlternatives(
  projectInput: ProjectInput,
  purlinResult: PurlinOutput | null,
): PurlinAlternativesSummary {
  const alternatives = [
    buildSortSteelAlternative(projectInput, purlinResult),
    buildLstkAlternative(projectInput, purlinResult, "mp350"),
    buildLstkAlternative(projectInput, purlinResult, "mp390"),
  ];
  const selection = selectPurlinSystem(projectInput.calculationSettings.purlinSystemPreference, alternatives);

  return {
    alternatives,
    selectedSystem: selection.selectedSystem,
    autoSelectedSystem: selection.autoSelectedSystem,
    notes: [
      ...selection.notes,
      "Purlin alternatives preserve the insi-next idea: sortSteel / MP350 / MP390 are separate specification choices.",
    ],
    warnings: alternatives.flatMap((alternative) =>
      alternative.warnings.map((warning) => `${alternative.system}: ${warning}`),
    ),
  };
}
