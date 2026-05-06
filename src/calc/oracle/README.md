# Oracle

Oracle adapters are the boundary to Excel/workbook calculations.

The first target source is VELICAN as an Excel/workbook oracle. Adapters should implement `ExcelOracle<TInput, TOutput>` and return normalized outputs that verification cases can compare against the native TypeScript calculators.

Do not put copied workbook formulas here unless a later task explicitly asks for it. This layer is only the interface for calling or storing oracle results.
