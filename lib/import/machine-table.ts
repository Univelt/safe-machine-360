import {
  classifyHeader,
  draftFromMappedRow,
  type MachineImportColumn,
  type MachineImportPreview,
} from "./machine-import-map";

export const MACHINE_IMPORT_MAX_BYTES = 40 * 1024 * 1024;

function headerScore(values: string[]) {
  return values.reduce((score, value) => score + (classifyHeader(value) ? 1 : 0), 0);
}

function headerTextAt(grid: string[][], rowIndex: number, colIndex: number) {
  const direct = (grid[rowIndex]?.[colIndex] ?? "").trim();
  if (direct) return direct;
  for (let previous = rowIndex - 1; previous >= Math.max(0, rowIndex - 2); previous -= 1) {
    const above = (grid[previous]?.[colIndex] ?? "").trim();
    if (above && classifyHeader(above)) return above;
  }
  return "";
}

export function parseMachineGrid(grid: string[][], sheetName: string): Omit<MachineImportPreview, "rows"> & { rows: MachineImportPreview["rows"] } {
  let headerRowIndex = -1;
  const columnMap = new Map<number, MachineImportColumn>();
  const ignoredHeaders: string[] = [];
  const mappedColumns: MachineImportPreview["mappedColumns"] = [];

  const maxScan = Math.min(grid.length, 20);
  for (let rowIndex = 0; rowIndex < maxScan; rowIndex += 1) {
    const width = Math.max(grid[rowIndex]?.length ?? 0, 18);
    const headers: Array<{ col: number; text: string }> = [];
    for (let colIndex = 0; colIndex < width; colIndex += 1) {
      const text = headerTextAt(grid, rowIndex, colIndex);
      if (text) headers.push({ col: colIndex, text });
    }
    if (headerScore(headers.map((item) => item.text)) < 4) continue;

    headerRowIndex = rowIndex;
    const used = new Set<MachineImportColumn>();
    for (const header of headers) {
      const field = classifyHeader(header.text);
      if (!field || used.has(field)) {
        ignoredHeaders.push(header.text);
        continue;
      }
      used.add(field);
      columnMap.set(header.col, field);
      mappedColumns.push({ header: header.text, field });
    }
    break;
  }

  if (headerRowIndex < 0 || !columnMap.size) {
    throw new Error("Não encontrei o cabeçalho da relação de máquinas. Use a planilha NR-12 com código interno, nome, setor e fabricante.");
  }

  const drafts: MachineImportPreview["rows"] = [];
  const skippedRows: MachineImportPreview["skippedRows"] = [];
  for (let rowIndex = headerRowIndex + 1; rowIndex < grid.length; rowIndex += 1) {
    const row = grid[rowIndex] ?? [];
    const cells: Partial<Record<MachineImportColumn, string>> = {};
    for (const [colIndex, field] of columnMap) {
      const value = (row[colIndex] ?? "").trim();
      if (value) cells[field] = value;
    }
    const draft = draftFromMappedRow(rowIndex + 1, cells);
    if (draft) {
      drafts.push(draft);
      continue;
    }
    if (Object.values(cells).some(Boolean)) {
      skippedRows.push({ rowNumber: rowIndex + 1, reason: "Linha sem código interno e sem nome do equipamento." });
    }
  }

  if (!drafts.length) throw new Error("A planilha não contém máquinas para importar.");

  return {
    sheetName,
    mappedColumns,
    ignoredHeaders: [...new Set(ignoredHeaders.filter((header) => !/foto|item|80/i.test(header)))],
    skippedRows,
    rows: drafts,
  };
}
