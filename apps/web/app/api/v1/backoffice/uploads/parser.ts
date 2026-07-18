import * as XLSX from "xlsx";

export function parseDate(value: string | number | Date | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return new Date(date.y, date.m - 1, date.d);
    }
  }
  const parsed = new Date(value as string);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function parseNumber(value: string | number | undefined): number | null {
  if (typeof value === "number") return value;
  if (!value || value === "") return null;
  
  const str = String(value);
  
  if (str.includes(",")) {
    const cleaned = str.replace(/\./g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    if (!isNaN(num)) return num;
  }
  
  const cleaned = str.replace(/,/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}
