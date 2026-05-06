import type { PurlinInput } from "../purlin/types";
import type { PurlinInputs } from "../velican/purlin-oracle";
import { compareInputField, createInputComparisonResult } from "./input-comparison";
import type { InputComparisonResult, InputComparisonRow } from "./input-comparison";
import { defaultNativePurlinLstkComparisonInput } from "./purlin-comparison";

export { defaultNativePurlinLstkComparisonInput };

function roofType(input: PurlinInput): string {
  return input.roofShape === "gable" ? "двускатная" : "односкатная";
}

function terrainType(input: PurlinInput): string {
  if (input.terrainType === "A") return "А";
  if (input.terrainType === "B") return "В";
  return "С";
}

function snowBag(input: PurlinInput): string {
  if (input.snowDrift === "none") return "нет";
  if (input.snowDrift === "along") return "вдоль здания";
  return "поперек здания";
}

export function comparePurlinInputs(
  nativeInput: PurlinInput,
  oracleInput: PurlinInputs,
): InputComparisonResult {
  const rows: InputComparisonRow[] = [
    compareInputField("city", undefined, oracleInput.city, "Native comparison fixture uses manual climate loads and has no city input."),
    compareInputField("windLoadKpa", nativeInput.w0_kPa, oracleInput.windLoadKpa),
    compareInputField("snowLoadKpa", nativeInput.Sg_kPa, oracleInput.snowLoadKpa),
    compareInputField("terrainType", terrainType(nativeInput), oracleInput.terrainType),
    compareInputField("responsibility level", nativeInput.gamma_n, oracleInput.responsibilityLevel),
    compareInputField("building span", nativeInput.span_m, oracleInput.buildingSpanM),
    compareInputField("building length", nativeInput.length_m, oracleInput.buildingLengthM),
    compareInputField("building height", nativeInput.height_m, oracleInput.buildingHeightM),
    compareInputField("roof slope", nativeInput.roofSlope_deg, oracleInput.roofSlopeDeg),
    compareInputField("frame step", nativeInput.framePitch_m, oracleInput.frameStepM),
    compareInputField("facade/fakhverk spacing", undefined, oracleInput.facadePostStepM, "Native purlin input has no facade/fakhverk spacing field."),
    compareInputField("roof type", roofType(nativeInput), oracleInput.roofType),
    compareInputField("roof construction / covering type", nativeInput.roofStructure, oracleInput.roofConstruction),
    compareInputField("deck/profile sheet", undefined, oracleInput.deckProfile, "Native purlin input has no deck/profile sheet field."),
    compareInputField("snow bag mode", snowBag(nativeInput), oracleInput.snowBag),
    compareInputField("height difference", nativeInput.drift_dropHeight_m, oracleInput.heightDifferenceM),
    compareInputField("adjacent/existing building size", nativeInput.drift_existingSize_m, oracleInput.existingBuildingSizeM),
    compareInputField("manual max step", nativeInput.maxStep_mm, oracleInput.maxStepMm),
    compareInputField("manual min step", nativeInput.minStep_mm, oracleInput.minStepMm),
    compareInputField("max utilization", nativeInput.maxUtilization === "default" ? "default" : nativeInput.maxUtilization, oracleInput.maxUtilization),
    compareInputField("tie installation", undefined, oracleInput.tieInstallation, "Native purlin input has no tie installation field."),
    compareInputField("brace step", undefined, oracleInput.braceStepM, "Native purlin input has no brace step field."),
    compareInputField("snow retention purlin", nativeInput.snowGuardPurlin ? "да" : "нет", oracleInput.snowRetentionPurlin),
    compareInputField("barrier/wall purlin", nativeInput.fencePurlin ? "да" : "нет", oracleInput.wallPurlin),
    compareInputField("price iBeam C255", nativeInput.prices?.["С255Б"], oracleInput.priceIbeamC255),
    compareInputField("price iBeam C355", nativeInput.prices?.["С355Б"], oracleInput.priceIbeamC355),
    compareInputField("price tube C245", nativeInput.prices?.["С245"], oracleInput.priceTubeC245),
    compareInputField("price tube C345", nativeInput.prices?.["С345"], oracleInput.priceTubeC345),
    compareInputField("price channel C245", undefined, oracleInput.priceChannelC245, "Native purlin prices do not separate channel prices."),
    compareInputField("price channel C345", undefined, oracleInput.priceChannelC345, "Native purlin prices do not separate channel prices."),
    compareInputField("price LSTK MP350", undefined, undefined, "VELICAN facade hardcodes LSTK price in runtime mapping; default input does not expose it."),
    compareInputField("price LSTK MP390", undefined, undefined, "VELICAN facade hardcodes LSTK price in runtime mapping; default input does not expose it."),
  ];

  return createInputComparisonResult("purlin", rows);
}
