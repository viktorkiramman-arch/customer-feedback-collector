import { describe, expect, it } from "vitest";
import { escapeCsvCell, neutralizeSpreadsheetFormula, toCsv } from "@/lib/csv";

describe("CSV safety", () => {
  it("neutralizes spreadsheet formulas", () => {
    expect(neutralizeSpreadsheetFormula("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");
    expect(neutralizeSpreadsheetFormula("  @command")).toBe("'  @command");
    expect(neutralizeSpreadsheetFormula("ordinary text")).toBe("ordinary text");
  });

  it("escapes quotes and commas", () => {
    expect(escapeCsvCell('hello, "world"')).toBe('"hello, ""world"""');
  });

  it("writes a UTF-8 BOM and CRLF rows", () => {
    expect(toCsv([["a", "b"], [1, 2]])).toBe('\uFEFF"a","b"\r\n"1","2"\r\n');
  });
});
