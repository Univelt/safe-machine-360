import ExcelJS from "exceljs";
import { cellToText, type MachineImportPreview } from "./machine-import-map";
import { parseMachineGrid } from "./machine-table";

export { MACHINE_IMPORT_MAX_BYTES } from "./machine-table";
export type { MachineImportColumn, MachineImportDraft, MachineImportPreview } from "./machine-import-map";
export { applyImportConflicts } from "./machine-import-map";

function resolvedCellText(sheet: ExcelJS.Worksheet, rowNumber: number, colNumber: number) {
  const cell = sheet.getCell(rowNumber, colNumber);
  const direct = cellToText(cell.value);
  if (direct) return direct;
  const master = "master" in cell ? (cell as ExcelJS.Cell & { master?: ExcelJS.Cell }).master : undefined;
  if (master && master !== cell) return cellToText(master.value);
  return "";
}

function worksheetToGrid(sheet: ExcelJS.Worksheet) {
  let maxCol = 18;
  const sampleRows = Math.min(sheet.rowCount, 40);
  for (let rowNumber = 1; rowNumber <= sampleRows; rowNumber += 1) {
    maxCol = Math.max(maxCol, sheet.getRow(rowNumber).cellCount || 0);
  }
  maxCol = Math.min(Math.max(maxCol, sheet.columnCount || 0, 18), 40);
  const maxRow = sheet.rowCount;
  const grid: string[][] = [];
  for (let rowNumber = 1; rowNumber <= maxRow; rowNumber += 1) {
    const row: string[] = [];
    for (let colNumber = 1; colNumber <= maxCol; colNumber += 1) {
      row.push(resolvedCellText(sheet, rowNumber, colNumber));
    }
    grid.push(row);
  }
  return grid;
}

export async function parseMachineSpreadsheet(buffer: Buffer | ArrayBuffer | Uint8Array): Promise<Omit<MachineImportPreview, "rows"> & { rows: MachineImportPreview["rows"] }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const sheet = workbook.worksheets.find((candidate) => candidate.rowCount > 0) ?? workbook.worksheets[0];
  if (!sheet) throw new Error("A planilha está vazia.");
  return parseMachineGrid(worksheetToGrid(sheet), sheet.name);
}
