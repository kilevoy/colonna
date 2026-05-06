import type { OracleMetadata, OracleSource } from "./types";

export interface ExcelOracle<TInput, TOutput> {
  name: string;
  source: OracleSource;
  metadata?: OracleMetadata;
  calculate(input: TInput): TOutput | Promise<TOutput>;
}
