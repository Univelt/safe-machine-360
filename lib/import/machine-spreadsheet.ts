import ExcelJS from "exceljs";
import {
  cellToText,
  classifyHeader,
  draftFromMappedRow,
  type MachineImportColumn,
  type MachineImportDraft,
  type MachineImportPreview,
} from "./machine-import-map";

export const MACHINE_IMPORT_MAX_BYTES = 40 * 1024 * 1024;

export type { MachineImportColumn, MachineImportDraft, MachineImportPreview };
export { applyImportConflicts } from "./machine-import-map";

function headerScore(values: string[]) {
  return values.reduce((score, value) => score + (classifyHeader(value) ? 1 : 0), 0);
}

function headerTextAt(sheet: ExcelJS.Worksheet, rowNumber: number, colNumber: number) {
  const cell = sheet.getCell(rowNumber, colNumber);
  const direct = cellToText(cell.value);
  if (direct) return direct;
  const master = "master" in cell ? (cell as ExcelJS.Cell & { master?: ExcelJS.Cell }).master : undefined;
  if (master && master !== cell) {
    const merged = cellToText(master.value);
    if (merged) return merged;
  }
  for (let previous = rowNumber - 1; previous >= Math.max(1, rowNumber - 2); previous -= 1) {
    const above = cellToText(sheet.getCell(previous, colNumber).value);
    if (above && classifyHeader(above)) return above;
  }
  return "";
}

export async function parseMachineSpreadsheet(buffer: Buffer | ArrayBuffer | Uint8Array): Promise<Omit<MachineImportPreview, "rows"> & { rows: MachineImportDraft[] }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const sheet = workbook.worksheets.find((candidate) => candidate.rowCount > 0) ?? workbook.worksheets[0];
  if (!sheet) throw new Error("A planilha está vazia.");

  let headerRowNumber = 0;
  const columnMap = new Map<number, MachineImportColumn>();
  const ignoredHeaders: string[] = [];
  const mappedColumns: MachineImportPreview["mappedColumns"] = [];

  const maxScan = Math.min(sheet.rowCount, 20);
  for (let rowNumber = 1; rowNumber <= maxScan; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const headers: Array<{ col: number; text: string }> = [];
    const lastCol = row.cellCount || sheet.columnCount;
    for (let colNumber = 1; colNumber <= Math.max(lastCol, 18); colNumber += 1) {
      const text = headerTextAt(sheet, rowNumber, colNumber);
      if (text) headers.push({ col: colNumber, text });
    }
    if (headerScore(headers.map((item) => item.text)) < 4) continue;

    headerRowNumber = rowNumber;
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

  if (!headerRowNumber || !columnMap.size) {
    throw new Error("Não encontrei o cabeçalho da relação de máquinas. Use a planilha NR-12 com código interno, nome, setor e fabricante.");
  }

  const drafts: MachineImportDraft[] = [];
  const skippedRows: MachineImportPreview["skippedRows"] = [];
  for (let rowNumber = headerRowNumber + 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const cells: Partial<Record<MachineImportColumn, string>> = {};
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const field = columnMap.get(colNumber);
      if (!field) return;
      cells[field] = cellToText(cell.value);
    });
    const draft = draftFromMappedRow(rowNumber, cells);
    if (draft) {
      drafts.push(draft);
      continue;
    }
    if (Object.values(cells).some(Boolean)) {
      skippedRows.push({ rowNumber, reason: "Linha sem código interno e sem nome do equipamento." });
    }
  }

  if (!drafts.length) throw new Error("A planilha não contém máquinas para importar.");

  return {
    sheetName: sheet.name,
    mappedColumns,
    ignoredHeaders: [...new Set(ignoredHeaders.filter((header) => !/foto|item|80/i.test(header)))],
    skippedRows,
    rows: drafts,
  };
}
