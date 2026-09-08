import { MACHINE_IMPORT_MAX_BYTES } from "./machine-table";
import type { MachineImportPreview } from "./machine-import-map";

function isCsv(file: File) {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return name.endsWith(".csv") || type.includes("csv") || type === "text/plain";
}

function isXlsx(file: File) {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return name.endsWith(".xlsx") || type.includes("spreadsheetml") || type.includes("excel");
}

export async function parseMachineFile(file: File): Promise<Omit<MachineImportPreview, "rows"> & { rows: MachineImportPreview["rows"] }> {
  if (file.size > MACHINE_IMPORT_MAX_BYTES) throw new Error("A planilha deve ter no máximo 40 MB.");
  if (isCsv(file)) {
    const { parseMachineCsv } = await import("./machine-csv");
    return parseMachineCsv(await file.text(), file.name);
  }
  if (!isXlsx(file)) throw new Error("Envie um arquivo .xlsx ou .csv da relação de máquinas NR-12.");
  const { parseMachineSpreadsheet } = await import("./machine-spreadsheet");
  return parseMachineSpreadsheet(await file.arrayBuffer());
}
