import { describe, expect, it } from "vitest";
import { defaultProjectInput } from "./defaults";
import { setProjectPurlinSystemPreference } from "./purlin-system-updates";

describe("ProjectInput purlin system preference updates", () => {
  it("keeps default purlin system preference as auto", () => {
    expect(defaultProjectInput.calculationSettings.purlinSystemPreference).toBe("auto");
  });

  it("updates only draft ProjectInput settings for purlin system preference", () => {
    const next = setProjectPurlinSystemPreference(defaultProjectInput, "mp390");

    expect(next.calculationSettings.purlinSystemPreference).toBe("mp390");
    expect(defaultProjectInput.calculationSettings.purlinSystemPreference).toBe("auto");
    expect(next.projectInfo).toBe(defaultProjectInput.projectInfo);
    expect(next.geometry).toBe(defaultProjectInput.geometry);
  });
});
