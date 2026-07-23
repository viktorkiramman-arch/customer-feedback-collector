const FORMULA_PREFIX = /^[\s\t\r]*[=+\-@]/;

export function neutralizeSpreadsheetFormula(value: string): string {
  return FORMULA_PREFIX.test(value) ? `'${value}` : value;
}

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const text = neutralizeSpreadsheetFormula(String(value)).replace(/"/g, '""');
  return `"${text}"`;
}

export function toCsv(rows: readonly (readonly unknown[])[]): string {
  return `\uFEFF${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n")}\r\n`;
}
