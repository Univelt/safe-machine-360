import { parseMachineGrid } from "./machine-table";
import type { MachineImportPreview } from "./machine-import-map";

function detectDelimiter(line: string) {
  const counts = { ";": 0, ",": 0, "\t": 0 };
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && char in counts) counts[char as keyof typeof counts] += 1;
  }
  if (counts["\t"] > counts[";"] && counts["\t"] > counts[","]) return "\t";
  if (counts[";"] > counts[","]) return ";";
  return ",";
}

export function parseCsvToGrid(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (!text.trim()) return [];

  const firstLine = text.split("\n").find((line) => line.trim()) ?? "";
  const delimiter = detectDelimiter(firstLine);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
        continue;
      }
      if (char === '"') {
        inQuotes = false;
        continue;
      }
      field += char;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === delimiter) {
      row.push(field.trim());
      field = "";
      continue;
    }
    if (char === "\n") {
      row.push(field.trim());
      field = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
      continue;
    }
    field += char;
  }

  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function parseMachineCsv(text: string, fileName = "planilha.csv"): Omit<MachineImportPreview, "rows"> & { rows: MachineImportPreview["rows"] } {
  const grid = parseCsvToGrid(text);
  if (!grid.length) throw new Error("A planilha está vazia.");
  return parseMachineGrid(grid, fileName.replace(/\.[^.]+$/, "") || "CSV");
}
