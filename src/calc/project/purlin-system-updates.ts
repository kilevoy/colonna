import type { ProjectInput, PurlinSystemPreference } from "./types";

export function setProjectPurlinSystemPreference(
  project: ProjectInput,
  purlinSystemPreference: PurlinSystemPreference,
): ProjectInput {
  return {
    ...project,
    calculationSettings: {
      ...project.calculationSettings,
      purlinSystemPreference,
    },
  };
}
